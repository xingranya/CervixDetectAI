/* eslint-disable @typescript-eslint/no-require-imports */
const PDFDocument = require('pdfkit');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} = require('docx');
const ExcelJS = require('exceljs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Study, Patient, AnalysisResult, StudyImage } = require('../models');

// 中文字体路径
const FONT_PATH = path.join(__dirname, '../public/fonts/SimSun.ttf');

/**
 * 获取报告所需的完整数据
 * @param {number} studyId - 病例ID
 * @returns {Promise<object>} 包含 study, patient, analysisResult, images
 */
async function getReportData(studyId) {
  const study = await Study.findByPk(studyId, {
    include: [
      { model: Patient, as: 'patient' },
      { model: StudyImage, as: 'images' },
      { model: AnalysisResult, as: 'analysis_results' },
    ],
  });

  if (!study) {
    throw new Error(`病例 ${studyId} 不存在`);
  }

  const patient = study.patient;
  // 取最新一条分析结果
  const analysisResult =
    study.analysis_results && study.analysis_results.length > 0
      ? study.analysis_results[study.analysis_results.length - 1]
      : null;
  const images = study.images || [];
  let history = [];
  try {
    history = (
      await AnalysisResult.findAll({
        include: [
          {
            model: Study,
            as: 'study',
            attributes: ['id', 'study_id', 'study_date', 'study_type', 'patient_id'],
            where: { patient_id: study.patient_id },
          },
        ],
        order: [[{ model: Study, as: 'study' }, 'study_date', 'DESC']],
        limit: 6,
      })
    ).reverse();
  } catch (error) {
    console.warn(`[ReportGenerator] 患者历史趋势查询失败，已回退本次检查趋势: ${error.message}`);
  }

  return { study, patient, analysisResult, images, history };
}

/**
 * 计算患者年龄
 * @param {string|null} birthDate
 * @returns {string}
 */
function calcAge(birthDate) {
  if (!birthDate) return '未知';
  const birth = new Date(birthDate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  return `${age}岁`;
}

/**
 * 风险等级中文映射
 */
function riskLevelText(level) {
  const map = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' };
  return map[level] || level || '未评估';
}

/**
 * 性别中文映射
 */
function genderText(g) {
  const map = { male: '男', female: '女', other: '其他' };
  return map[g] || g || '未知';
}

/**
 * 获取可嵌入的本地图像路径列表（跳过远程URL）
 * @param {Array} images
 * @returns {string[]}
 */
function getLocalImagePaths(images) {
  const result = [];
  for (const img of images) {
    const fp = img.file_path;
    if (!fp) continue;
    // 跳过远程URL
    if (fp.startsWith('http://') || fp.startsWith('https://')) continue;
    // 构造绝对路径
    const absPath = path.isAbsolute(fp) ? fp : path.join(__dirname, '..', fp);
    if (fs.existsSync(absPath)) {
      result.push(absPath);
    }
  }
  return result;
}

function convertMarkdownToPlainText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 42,
  marginTop: 42,
  footerY: 812,
  contentWidth: 511.28,
  bottomLimit: 780,
  colors: {
    primary: '#105EA3',
    primaryDeep: '#0A3D68',
    primarySoft: '#E3F2FD',
    border: '#D2DDE8',
    text: '#1F2937',
    textSoft: '#637381',
    light: '#F1F5F9',
    panel: '#F8FAFC',
    danger: '#DC2626',
    warning: '#EA580C',
    success: '#16A34A',
    white: '#FFFFFF',
  },
};

const DEFAULT_REPORT_FOOTER =
  '本报告由 CervixDetect AI 生成，仅作为辅助筛查与归档参考，不能替代执业医师的临床诊断、活检结果或最终治疗决策。';

function normalizeConfidence(value) {
  const raw = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(raw)) return 0;
  if (raw > 1 && raw <= 100) return Math.min(raw / 100, 1);
  return Math.max(0, Math.min(raw, 1));
}

function formatPercent(value) {
  return `${Math.round(normalizeConfidence(value) * 100)}%`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function inferRiskLevelFromDiagnosis(diagnosis) {
  const text = String(diagnosis || '');
  if (text.includes('浸润性癌') || text.includes('SCC')) return 'critical';
  if (text.includes('HSIL') || text.includes('ASC-H')) return 'high';
  if (text.includes('LSIL') || text.includes('ASC-US') || text.includes('AGC')) return 'medium';
  return 'low';
}

function resolveRiskColor(level) {
  if (level === 'critical' || level === 'high') return PDF_LAYOUT.colors.danger;
  if (level === 'medium') return PDF_LAYOUT.colors.warning;
  return PDF_LAYOUT.colors.success;
}

function resolveRiskWeight(level) {
  if (level === 'critical') return 4;
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

function sanitizeFileSegment(value, fallback) {
  const text = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return text || fallback;
}

function normalizeSuspiciousAreas(areas) {
  if (!Array.isArray(areas)) return [];
  return areas.map((area, index) => {
    if (typeof area === 'string') {
      return {
        description: area || `异常区域${index + 1}`,
        locationText: '-',
        featuresText: '-',
      };
    }

    return {
      description: area?.description || `异常区域${index + 1}`,
      locationText: area?.location || '-',
      featuresText: Array.isArray(area?.features) ? area.features.join('、') : '-',
    };
  });
}

function normalizeReportData(rawData, template) {
  const { study, patient, analysisResult, images, history } = rawData;
  const riskLevel =
    analysisResult?.risk_level || inferRiskLevelFromDiagnosis(analysisResult?.diagnosis);
  const suspiciousAreas = normalizeSuspiciousAreas(analysisResult?.suspicious_areas);
  const biomarkers = analysisResult?.biomarkers || {};

  return {
    reportId: `RPT-${sanitizeFileSegment(study.study_id || study.id, 'study')}-${Date.now()
      .toString(36)
      .toUpperCase()}`,
    template,
    study: {
      id: study.id,
      studyId: study.study_id || String(study.id),
      studyDate: formatDate(study.study_date),
      studyType: study.study_type || '-',
      description: study.description || '-',
      doctorName: study.doctor_name || '-',
      department: study.department || '-',
    },
    patient: {
      name: patient?.name || '-',
      gender: genderText(patient?.gender),
      age: calcAge(patient?.birth_date),
      patientId: patient?.patient_id || '-',
      phone: patient?.phone || '-',
      medicalCardNo: patient?.medical_card_no || '-',
    },
    result: {
      diagnosis: analysisResult?.diagnosis || '暂无分析结果',
      confidenceText: analysisResult ? formatPercent(analysisResult.confidence) : '-',
      confidence: normalizeConfidence(analysisResult?.confidence),
      riskLevel,
      riskText: riskLevelText(riskLevel),
      riskColor: resolveRiskColor(riskLevel),
      biomarkers,
      suspiciousAreas,
      recommendations: Array.isArray(analysisResult?.recommendations)
        ? analysisResult.recommendations
        : [],
      detailedReport: convertMarkdownToPlainText(analysisResult?.detailed_report),
    },
    trend: buildServerTrendSeries(history, analysisResult),
    images: Array.isArray(images) ? images : [],
  };
}

function buildServerTrendSeries(history, fallbackResult) {
  const series = Array.isArray(history) ? history : [];
  if (series.length > 0) {
    return series.map((item, index) => ({
      label: formatDate(item.study?.study_date) || `检查${index + 1}`,
      riskWeight: resolveRiskWeight(item.risk_level),
      confidencePercent: Math.round(normalizeConfidence(item.confidence) * 100),
    }));
  }

  const level = fallbackResult?.risk_level || inferRiskLevelFromDiagnosis(fallbackResult?.diagnosis);
  return [
    {
      label: '本次检查',
      riskWeight: resolveRiskWeight(level),
      confidencePercent: Math.round(normalizeConfidence(fallbackResult?.confidence) * 100),
    },
  ];
}

function resolveLocalImagePath(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return null;
  const normalized = String(filePath).replace(/^\/+/, '');
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', normalized);
  return fs.existsSync(absPath) ? absPath : null;
}

async function loadImageAsset(imageRecord) {
  const filePath = imageRecord?.file_path;
  if (!filePath) return null;

  if (/^https?:\/\//i.test(filePath)) {
    try {
      const response = await axios.get(filePath, {
        responseType: 'arraybuffer',
        timeout: 12000,
        maxContentLength: 15 * 1024 * 1024,
        headers: { Accept: 'image/*' },
      });
      return {
        source: Buffer.from(response.data),
        label: imageRecord.original_filename || imageRecord.stored_filename || '远程影像',
        remote: true,
      };
    } catch (error) {
      console.warn(`[ReportGenerator] 远程影像加载失败: ${error.message}`);
      return null;
    }
  }

  const localPath = resolveLocalImagePath(filePath);
  if (!localPath) return null;
  return {
    source: localPath,
    label: imageRecord.original_filename || path.basename(localPath),
    remote: false,
  };
}

async function loadReportImageAssets(images) {
  const assets = [];
  for (const image of images || []) {
    const asset = await loadImageAsset(image);
    if (asset) assets.push(asset);
    if (assets.length >= 2) break;
  }
  return assets;
}

function setBaseFont(doc) {
  if (fs.existsSync(FONT_PATH)) {
    doc.font(FONT_PATH);
  }
}

function addNewPage(doc) {
  doc.addPage();
  setBaseFont(doc);
  return PDF_LAYOUT.marginTop;
}

function ensureServerPageSpace(doc, y, requiredHeight) {
  if (y + requiredHeight <= PDF_LAYOUT.bottomLimit) return y;
  return addNewPage(doc);
}

function textHeight(doc, text, width, fontSize = 9.5, lineGap = 2) {
  doc.fontSize(fontSize);
  return doc.heightOfString(String(text || '-'), { width, lineGap });
}

function drawWrappedText(doc, text, x, y, options = {}) {
  const width = options.width || PDF_LAYOUT.contentWidth;
  const fontSize = options.fontSize || 9.5;
  const color = options.color || PDF_LAYOUT.colors.text;
  const lineGap = options.lineGap ?? 2;
  doc.fontSize(fontSize).fillColor(color);
  doc.text(String(text || '-'), x, y, { width, lineGap, align: options.align || 'left' });
  return y + textHeight(doc, text || '-', width, fontSize, lineGap);
}

function drawSectionTitleServer(doc, title, y) {
  y = ensureServerPageSpace(doc, y, 24);
  doc.fontSize(13).fillColor(PDF_LAYOUT.colors.primaryDeep).text(title, PDF_LAYOUT.marginX, y);
  doc
    .strokeColor(PDF_LAYOUT.colors.border)
    .lineWidth(0.8)
    .moveTo(PDF_LAYOUT.marginX, y + 19)
    .lineTo(PDF_LAYOUT.marginX + PDF_LAYOUT.contentWidth, y + 19)
    .stroke();
  return y + 28;
}

function drawRoundedBox(doc, x, y, width, height, fillColor = PDF_LAYOUT.colors.white) {
  doc
    .roundedRect(x, y, width, height, 7)
    .fillAndStroke(fillColor, PDF_LAYOUT.colors.border);
}

function drawHeroServer(doc, data) {
  doc.rect(0, 0, PDF_LAYOUT.pageWidth, 92).fill(PDF_LAYOUT.colors.primary);
  doc.fillColor(PDF_LAYOUT.colors.white).fontSize(20).text('CervixDetect AI', PDF_LAYOUT.marginX, 24);
  doc.fontSize(12).text('宫颈病例专业归档报告', PDF_LAYOUT.marginX, 50);
  doc
    .fontSize(8.5)
    .text(`报告编号 ${data.reportId}`, PDF_LAYOUT.pageWidth - 232, 24, {
      width: 190,
      align: 'right',
    })
    .text(`生成时间 ${formatDateTime()}`, PDF_LAYOUT.pageWidth - 232, 45, {
      width: 190,
      align: 'right',
    });

  drawRoundedBox(doc, PDF_LAYOUT.marginX, 112, PDF_LAYOUT.contentWidth, 96, PDF_LAYOUT.colors.primarySoft);
  doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(9).text('诊断结论', PDF_LAYOUT.marginX + 18, 132);
  doc.fillColor(PDF_LAYOUT.colors.text).fontSize(18).text(data.result.diagnosis, PDF_LAYOUT.marginX + 18, 150, {
    width: 190,
    height: 42,
    ellipsis: true,
  });

  const cards = [
    ['风险等级', data.result.riskText, data.result.riskColor],
    ['置信度', data.result.confidenceText, PDF_LAYOUT.colors.primaryDeep],
    ['检查日期', data.study.studyDate, PDF_LAYOUT.colors.text],
    ['检查方式', data.study.studyType, PDF_LAYOUT.colors.text],
  ];
  let x = PDF_LAYOUT.marginX + 218;
  for (const [label, value, color] of cards) {
    const width = label === '检查方式' ? 104 : 54;
    drawRoundedBox(doc, x, 142, width, 42, PDF_LAYOUT.colors.white);
    doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(7.5).text(label, x + 8, 151);
    doc.fillColor(color).fontSize(9.2).text(value, x + 8, 165, {
      width: width - 16,
      height: 14,
      ellipsis: true,
    });
    x += width + 8;
  }

  return 232;
}

function drawInfoGridServer(doc, data, y) {
  const rows = [
    ['患者姓名', data.patient.name, '患者编号', data.patient.patientId],
    ['性别/年龄', `${data.patient.gender} / ${data.patient.age}`, '联系电话', data.patient.phone],
    ['检查日期', data.study.studyDate, '检查方式', data.study.studyType],
    ['科室/医生', `${data.study.department} / ${data.study.doctorName}`, '病历号', data.patient.medicalCardNo],
  ];
  const labelWidth = 62;
  const valueWidth = 190;
  const rowHeight = 28;
  let currentY = ensureServerPageSpace(doc, y, rows.length * rowHeight + 8);

  rows.forEach((row, rowIndex) => {
    const fill = rowIndex % 2 === 0 ? PDF_LAYOUT.colors.white : PDF_LAYOUT.colors.panel;
    [
      { x: PDF_LAYOUT.marginX, label: row[0], value: row[1] },
      { x: PDF_LAYOUT.marginX + labelWidth + valueWidth + 8, label: row[2], value: row[3] },
    ].forEach((cell) => {
      doc.rect(cell.x, currentY, labelWidth, rowHeight).fillAndStroke(PDF_LAYOUT.colors.primarySoft, PDF_LAYOUT.colors.border);
      doc.rect(cell.x + labelWidth, currentY, valueWidth, rowHeight).fillAndStroke(fill, PDF_LAYOUT.colors.border);
      doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(8.2).text(cell.label, cell.x + 8, currentY + 10);
      doc.fillColor(PDF_LAYOUT.colors.text).fontSize(9.4).text(cell.value || '-', cell.x + labelWidth + 8, currentY + 10, {
        width: valueWidth - 16,
        height: 13,
        ellipsis: true,
      });
    });
    currentY += rowHeight;
  });

  return currentY + 12;
}

function drawImagePlaceholderServer(doc, x, y, width, height, title, description) {
  drawRoundedBox(doc, x, y, width, height, PDF_LAYOUT.colors.panel);
  doc.fillColor(PDF_LAYOUT.colors.text).fontSize(12).text(title, x + 16, y + 30);
  doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(9).text(description, x + 16, y + 54, {
    width: width - 32,
    lineGap: 2,
  });
}

function drawImagePairServer(doc, data, imageAssets, y) {
  y = ensureServerPageSpace(doc, y, 196);
  const gap = 12;
  const width = (PDF_LAYOUT.contentWidth - gap) / 2;
  const height = 142;
  const labels = ['原始影像', 'AI 标注摘要图'];

  labels.forEach((label, index) => {
    const x = PDF_LAYOUT.marginX + index * (width + gap);
    doc.fillColor(PDF_LAYOUT.colors.primaryDeep).fontSize(10).text(label, x, y);
    drawRoundedBox(doc, x, y + 16, width, height + 28, PDF_LAYOUT.colors.white);
    const asset = imageAssets[index] || imageAssets[0];
    if (asset) {
      try {
        doc.image(asset.source, x + 8, y + 24, {
          fit: [width - 16, height - 10],
          align: 'center',
          valign: 'center',
        });
      } catch (error) {
        console.warn(`[ReportGenerator] PDF 影像嵌入失败: ${error.message}`);
        drawImagePlaceholderServer(doc, x + 8, y + 24, width - 16, height - 10, '影像嵌入失败', '影像资源存在但暂时无法写入报告。');
      }
      doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(8).text(asset.label, x + 10, y + height + 30, {
        width: width - 20,
        height: 12,
        ellipsis: true,
      });
    } else {
      drawImagePlaceholderServer(
        doc,
        x + 8,
        y + 24,
        width - 16,
        height - 10,
        '当前病例无可嵌入影像',
        '系统仍会导出结构化分析结果、趋势与临床建议。',
      );
    }
  });

  return y + 196;
}

function drawKeyMetricsServer(doc, data, y) {
  const markerText = (key) => data.result.biomarkers[key] || data.result.biomarkers[key.toLowerCase()] || '-';
  const rows = [
    ['诊断结论', data.result.diagnosis, '风险等级', data.result.riskText],
    ['置信度', data.result.confidenceText, '可疑区域数', String(data.result.suspiciousAreas.length)],
    ['HPV', markerText('HPV'), 'p16', markerText('p16')],
    ['Ki67', markerText('Ki67'), '检查描述', data.study.description],
  ];
  return drawInfoTableServer(doc, rows, y);
}

function drawInfoTableServer(doc, rows, y) {
  const labelWidth = 58;
  const valueWidth = 194;
  const rowWidth = labelWidth + valueWidth;
  let currentY = y;

  rows.forEach((row, rowIndex) => {
    const leftHeight = textHeight(doc, row[1], valueWidth - 16, 9.1, 1.5);
    const rightHeight = textHeight(doc, row[3], valueWidth - 16, 9.1, 1.5);
    const rowHeight = Math.max(28, leftHeight, rightHeight) + 12;
    currentY = ensureServerPageSpace(doc, currentY, rowHeight + 2);

    [
      { x: PDF_LAYOUT.marginX, label: row[0], value: row[1] },
      { x: PDF_LAYOUT.marginX + rowWidth + 8, label: row[2], value: row[3] },
    ].forEach((cell) => {
      doc.rect(cell.x, currentY, labelWidth, rowHeight).fillAndStroke(PDF_LAYOUT.colors.primarySoft, PDF_LAYOUT.colors.border);
      doc
        .rect(cell.x + labelWidth, currentY, valueWidth, rowHeight)
        .fillAndStroke(rowIndex % 2 === 0 ? PDF_LAYOUT.colors.white : PDF_LAYOUT.colors.panel, PDF_LAYOUT.colors.border);
      doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(8.1).text(cell.label, cell.x + 8, currentY + 11);
      drawWrappedText(doc, cell.value || '-', cell.x + labelWidth + 8, currentY + 10, {
        width: valueWidth - 16,
        fontSize: 9.1,
        lineGap: 1.5,
      });
    });
    currentY += rowHeight;
  });

  return currentY + 12;
}

function drawSuspiciousAreaTableServer(doc, data, y) {
  const areas = data.result.suspiciousAreas;
  if (areas.length === 0) {
    y = ensureServerPageSpace(doc, y, 42);
    drawRoundedBox(doc, PDF_LAYOUT.marginX, y, PDF_LAYOUT.contentWidth, 34, PDF_LAYOUT.colors.panel);
    doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(9).text('本次结果未返回需重点标注的可疑区域。', PDF_LAYOUT.marginX + 12, y + 12);
    return y + 46;
  }

  const widths = [44, 164, 132, 171.28];
  const headers = ['序号', '描述', '位置', '特征'];
  let currentY = y;

  const drawHeader = () => {
    let x = PDF_LAYOUT.marginX;
    headers.forEach((header, index) => {
      doc.rect(x, currentY, widths[index], 24).fillAndStroke(PDF_LAYOUT.colors.primarySoft, PDF_LAYOUT.colors.border);
      doc.fillColor(PDF_LAYOUT.colors.text).fontSize(8.5).text(header, x + 8, currentY + 8);
      x += widths[index];
    });
    currentY += 24;
  };

  const firstRowHeight = Math.max(
    30,
    ...[areas[0].description, areas[0].locationText, areas[0].featuresText].map((value, index) =>
      textHeight(doc, value, widths[index + 1] - 12, 8.5, 1.2),
    ),
  ) + 12;
  currentY = ensureServerPageSpace(doc, currentY, 24 + firstRowHeight);
  drawHeader();

  areas.forEach((area, index) => {
    const values = [String(index + 1), area.description, area.locationText, area.featuresText];
    const rowHeight = Math.max(
      30,
      ...values.map((value, valueIndex) => textHeight(doc, value, widths[valueIndex] - 12, 8.5, 1.2)),
    ) + 12;
    currentY = ensureServerPageSpace(doc, currentY, rowHeight + 2);
    if (currentY === PDF_LAYOUT.marginTop) drawHeader();

    let x = PDF_LAYOUT.marginX;
    values.forEach((value, valueIndex) => {
      doc
        .rect(x, currentY, widths[valueIndex], rowHeight)
        .fillAndStroke(index % 2 === 0 ? PDF_LAYOUT.colors.white : PDF_LAYOUT.colors.panel, PDF_LAYOUT.colors.border);
      drawWrappedText(doc, value || '-', x + 6, currentY + 8, {
        width: widths[valueIndex] - 12,
        fontSize: 8.5,
        lineGap: 1.2,
      });
      x += widths[valueIndex];
    });
    currentY += rowHeight;
  });

  return currentY + 12;
}

function drawTrendServer(doc, data, y) {
  y = ensureServerPageSpace(doc, y, 120);
  const width = PDF_LAYOUT.contentWidth;
  const height = 92;
  const x = PDF_LAYOUT.marginX;
  const top = y;
  const points = data.trend;

  drawRoundedBox(doc, x, top, width, height, PDF_LAYOUT.colors.white);
  doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(8).text('风险权重：低=1，中=2，高=3，极高=4', x + 12, top + 10);

  const plotX = x + 34;
  const plotY = top + 26;
  const plotWidth = width - 70;
  const plotHeight = 42;
  doc.strokeColor(PDF_LAYOUT.colors.border).lineWidth(0.6);
  for (let i = 0; i <= 3; i += 1) {
    const lineY = plotY + (plotHeight / 3) * i;
    doc.moveTo(plotX, lineY).lineTo(plotX + plotWidth, lineY).stroke();
  }

  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => ({
    x: plotX + step * index,
    y: plotY + plotHeight - ((point.riskWeight - 1) / 3) * plotHeight,
    point,
  }));

  doc.strokeColor(PDF_LAYOUT.colors.danger).lineWidth(1.8);
  coordinates.forEach((coord, index) => {
    if (index === 0) doc.moveTo(coord.x, coord.y);
    else doc.lineTo(coord.x, coord.y);
  });
  doc.stroke();

  coordinates.forEach((coord) => {
    doc.circle(coord.x, coord.y, 3.2).fill(PDF_LAYOUT.colors.danger);
    doc
      .fillColor(PDF_LAYOUT.colors.textSoft)
      .fontSize(7)
      .text(coord.point.label, coord.x - 25, plotY + plotHeight + 9, {
        width: 50,
        align: 'center',
        height: 18,
        ellipsis: true,
      });
    doc
      .fillColor(PDF_LAYOUT.colors.primaryDeep)
      .fontSize(7)
      .text(`${coord.point.confidencePercent}%`, coord.x - 18, coord.y - 15, {
        width: 36,
        align: 'center',
      });
  });

  const caption =
    points.length < 2
      ? '历史数据不足，已回退为本次检查风险与置信度展示。'
      : '展示近 6 次检查的风险权重与模型置信度，用于纵向观察变化。';
  doc.fillColor(PDF_LAYOUT.colors.textSoft).fontSize(8).text(caption, x + 12, top + height - 16, {
    width: width - 24,
  });

  return top + height + 14;
}

function drawRecommendationServer(doc, recommendations, y) {
  const list = recommendations.length
    ? recommendations
    : ['请结合阴道镜、HPV 结果及临床体征进行综合判断，必要时安排复查或进一步病理检查。'];

  let currentY = y;
  list.forEach((recommendation, index) => {
    const bodyHeight = textHeight(doc, recommendation, PDF_LAYOUT.contentWidth - 92, 9.2, 1.5);
    const height = Math.max(38, bodyHeight + 20);
    currentY = ensureServerPageSpace(doc, currentY, height + 8);
    drawRoundedBox(doc, PDF_LAYOUT.marginX, currentY, PDF_LAYOUT.contentWidth, height, PDF_LAYOUT.colors.primarySoft);
    doc.fillColor(PDF_LAYOUT.colors.primaryDeep).fontSize(8.5).text(`建议 ${index + 1}`, PDF_LAYOUT.marginX + 14, currentY + 14);
    drawWrappedText(doc, recommendation, PDF_LAYOUT.marginX + 72, currentY + 13, {
      width: PDF_LAYOUT.contentWidth - 92,
      fontSize: 9.2,
      lineGap: 1.5,
    });
    currentY += height + 8;
  });

  return currentY;
}

function drawDetailedReportServer(doc, text, y) {
  if (!text) return y;
  let currentY = y;
  const paragraphs = text
    .split('\n\n')
    .map((item) => item.trim())
    .filter(Boolean);

  paragraphs.forEach((paragraph) => {
    const paragraphHeight = textHeight(doc, paragraph, PDF_LAYOUT.contentWidth, 9.1, 2);
    currentY = ensureServerPageSpace(doc, currentY, Math.min(paragraphHeight + 10, 120));
    currentY = drawWrappedText(doc, paragraph, PDF_LAYOUT.marginX, currentY, {
      width: PDF_LAYOUT.contentWidth,
      fontSize: 9.1,
      lineGap: 2,
    });
    currentY += 8;
  });

  return currentY;
}

function drawDisclaimerServer(doc, y, template) {
  y = ensureServerPageSpace(doc, y, 68);
  drawRoundedBox(doc, PDF_LAYOUT.marginX, y, PDF_LAYOUT.contentWidth, 56, '#FEF2F2');
  doc.fillColor(PDF_LAYOUT.colors.danger).fontSize(10.5).text('免责声明', PDF_LAYOUT.marginX + 14, y + 12);
  drawWrappedText(
    doc,
    template.footer || DEFAULT_REPORT_FOOTER,
    PDF_LAYOUT.marginX + 14,
    y + 30,
    {
      width: PDF_LAYOUT.contentWidth - 28,
      fontSize: 8.5,
      color: PDF_LAYOUT.colors.textSoft,
      lineGap: 1.5,
    },
  );
  return y + 68;
}

function addBufferedFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    setBaseFont(doc);
    doc
      .strokeColor(PDF_LAYOUT.colors.border)
      .lineWidth(0.6)
      .moveTo(PDF_LAYOUT.marginX, PDF_LAYOUT.footerY - 12)
      .lineTo(PDF_LAYOUT.marginX + PDF_LAYOUT.contentWidth, PDF_LAYOUT.footerY - 12)
      .stroke();
    doc
      .fillColor(PDF_LAYOUT.colors.textSoft)
      .fontSize(8)
      .text('CervixDetect AI · 医生归档版病例报告', PDF_LAYOUT.marginX, PDF_LAYOUT.footerY, {
        width: 260,
      })
      .text(`第 ${i + 1} 页 / 共 ${range.count} 页`, PDF_LAYOUT.pageWidth - 150, PDF_LAYOUT.footerY, {
        width: 108,
        align: 'right',
      });
  }
}

// ============================================================
// PDF 报告生成
// ============================================================

/**
 * 生成 PDF 报告
 * @param {number} studyId
 * @param {object} template - 模板配置
 * @returns {Promise<{filePath: string, fileName: string, fileSize: number, pageCount: number}>}
 */
async function generatePDF(studyId, template) {
  const rawData = await getReportData(studyId);
  const data = normalizeReportData(rawData, template);
  const imageAssets = await loadReportImageAssets(data.images);

  const fileName = `report_${sanitizeFileSegment(data.study.studyId, 'study')}_${sanitizeFileSegment(
    data.patient.patientId,
    'patient',
  )}_${Date.now()}.pdf`;
  const outputDir = process.env.PDF_OUTPUT_DIR
    ? path.resolve(process.env.PDF_OUTPUT_DIR)
    : path.join(__dirname, '../reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream(filePath);

    let pageCount = 1;
    doc.on('pageAdded', () => {
      pageCount += 1;
      setBaseFont(doc);
    });
    stream.on('finish', () => {
      const stat = fs.statSync(filePath);
      resolve({ filePath, fileName, fileSize: stat.size, pageCount });
    });
    stream.on('error', reject);

    doc.pipe(stream);
    setBaseFont(doc);

    let y = drawHeroServer(doc, data);
    y = drawSectionTitleServer(doc, '患者与检查信息', y);
    y = drawInfoGridServer(doc, data, y);
    y = drawSectionTitleServer(doc, '影像对比', y);
    y = drawImagePairServer(doc, data, imageAssets, y);

    y = addNewPage(doc);
    y = drawSectionTitleServer(doc, '本次检查关键指标', y);
    y = drawKeyMetricsServer(doc, data, y);
    y = drawSectionTitleServer(doc, '可疑区域明细', y);
    y = drawSuspiciousAreaTableServer(doc, data, y);
    y = drawSectionTitleServer(doc, '患者趋势曲线', y);
    y = drawTrendServer(doc, data, y);

    y = addNewPage(doc);
    y = drawSectionTitleServer(doc, '临床建议', y);
    y = drawRecommendationServer(doc, data.result.recommendations, y);

    if (data.result.detailedReport) {
      y = drawSectionTitleServer(doc, '详细说明', y + 4);
      y = drawDetailedReportServer(doc, data.result.detailedReport, y);
    }

    drawDisclaimerServer(doc, y + 4, template);
    addBufferedFooters(doc);

    doc.end();
  });
}

// ============================================================
// Word 文档生成
// ============================================================

/**
 * 创建简单表格行（两列键值对）
 */
function createKVRow(key, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2400, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 6600, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: value || '-', size: 20 })] })],
      }),
    ],
  });
}

/**
 * 生成 Word 文档
 * @param {number} studyId
 * @param {object} template
 * @returns {Promise<{filePath: string, fileName: string, fileSize: number}>}
 */
async function generateWord(studyId, template) {
  const data = await getReportData(studyId);
  const { study, patient, analysisResult } = data;

  const fileName = `report_${study.study_id}_${Date.now()}.docx`;
  const outputDir = process.env.PDF_OUTPUT_DIR
    ? path.resolve(process.env.PDF_OUTPUT_DIR)
    : path.join(__dirname, '../reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  const studyDate = study.study_date ? new Date(study.study_date).toLocaleDateString('zh-CN') : '-';
  const confidence = analysisResult?.confidence
    ? `${Math.round(Number(analysisResult.confidence) * 100)}%`
    : '-';

  const sections = [];

  // 标题
  sections.push(
    new Paragraph({
      text: template.header,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: template.hospital_name,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // 患者信息表格
  sections.push(
    new Paragraph({ text: '一、患者信息', heading: HeadingLevel.HEADING_2 }),
    new Table({
      rows: [
        createKVRow('姓名', patient?.name),
        createKVRow('性别', genderText(patient?.gender)),
        createKVRow('年龄', calcAge(patient?.birth_date)),
        createKVRow('患者编号', patient?.patient_id),
        createKVRow('联系电话', patient?.phone),
      ],
      width: { size: 9000, type: WidthType.DXA },
    }),
  );

  // 检查信息
  sections.push(
    new Paragraph({
      text: '二、检查信息',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300 },
    }),
    new Table({
      rows: [
        createKVRow('检查类型', study.study_type),
        createKVRow('检查日期', studyDate),
        createKVRow('病例编号', study.study_id),
        createKVRow('描述', study.description),
      ],
      width: { size: 9000, type: WidthType.DXA },
    }),
  );

  // 分析结果
  sections.push(
    new Paragraph({
      text: '三、AI分析结果',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300 },
    }),
  );

  if (analysisResult) {
    sections.push(
      new Table({
        rows: [
          createKVRow('诊断结论', analysisResult.diagnosis),
          createKVRow('置信度', confidence),
          createKVRow('风险等级', riskLevelText(analysisResult.risk_level)),
        ],
        width: { size: 9000, type: WidthType.DXA },
      }),
    );

    // 临床建议
    if (analysisResult.recommendations?.length > 0) {
      sections.push(
        new Paragraph({
          text: '四、临床建议',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
        }),
      );
      for (const rec of analysisResult.recommendations) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${rec}`, size: 20 })],
            spacing: { after: 100 },
          }),
        );
      }
    }

    // 详细报告
    if (analysisResult.detailed_report) {
      sections.push(
        new Paragraph({
          text: '五、详细病理报告',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: convertMarkdownToPlainText(analysisResult.detailed_report),
              size: 20,
            }),
          ],
        }),
      );
    }
  } else {
    sections.push(new Paragraph({ text: '暂无分析结果' }));
  }

  // 页脚声明
  sections.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [new TextRun({ text: template.footer, size: 16, color: '999999', italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `报告生成时间：${new Date().toLocaleString('zh-CN')}`,
          size: 16,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  const stat = fs.statSync(filePath);

  return { filePath, fileName, fileSize: stat.size };
}

// ============================================================
// Excel 报告生成
// ============================================================

/**
 * 生成 Excel 数据表
 * @param {number} studyId
 * @returns {Promise<{filePath: string, fileName: string, fileSize: number}>}
 */
async function generateExcel(studyId) {
  const data = await getReportData(studyId);
  const { study, patient, analysisResult } = data;

  const fileName = `report_${study.study_id}_${Date.now()}.xlsx`;
  const outputDir = process.env.PDF_OUTPUT_DIR
    ? path.resolve(process.env.PDF_OUTPUT_DIR)
    : path.join(__dirname, '../reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = '宫颈检测AI辅助诊断系统';
  workbook.created = new Date();

  // Sheet1: 患者信息 + 检查信息
  const ws1 = workbook.addWorksheet('患者与检查信息');
  ws1.columns = [
    { header: '项目', key: 'key', width: 20 },
    { header: '内容', key: 'value', width: 40 },
  ];

  // 标题行样式
  ws1.getRow(1).font = { bold: true, size: 12 };
  ws1.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };

  const studyDate = study.study_date ? new Date(study.study_date).toLocaleDateString('zh-CN') : '-';

  const infoRows = [
    { key: '姓名', value: patient?.name || '-' },
    { key: '性别', value: genderText(patient?.gender) },
    { key: '年龄', value: calcAge(patient?.birth_date) },
    { key: '患者编号', value: patient?.patient_id || '-' },
    { key: '联系电话', value: patient?.phone || '-' },
    { key: '病历号', value: patient?.medical_card_no || '-' },
    { key: '', value: '' },
    { key: '检查类型', value: study.study_type || '-' },
    { key: '检查日期', value: studyDate },
    { key: '病例编号', value: study.study_id },
    { key: '描述', value: study.description || '-' },
    { key: '状态', value: study.status },
  ];
  ws1.addRows(infoRows);

  // Sheet2: 分析结果详细数据
  const ws2 = workbook.addWorksheet('分析结果');
  ws2.columns = [
    { header: '项目', key: 'key', width: 25 },
    { header: '内容', key: 'value', width: 50 },
  ];
  ws2.getRow(1).font = { bold: true, size: 12 };
  ws2.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };

  if (analysisResult) {
    const confidence = analysisResult.confidence
      ? `${Math.round(Number(analysisResult.confidence) * 100)}%`
      : '-';

    const resultRows = [
      { key: '诊断结论', value: analysisResult.diagnosis || '-' },
      { key: '置信度', value: confidence },
      { key: '风险等级', value: riskLevelText(analysisResult.risk_level) },
    ];

    // 生物标志物
    if (analysisResult.biomarkers) {
      resultRows.push({ key: '', value: '' });
      resultRows.push({ key: '--- 生物标志物 ---', value: '' });
      for (const [k, v] of Object.entries(analysisResult.biomarkers)) {
        resultRows.push({ key: k, value: String(v) });
      }
    }

    // 可疑区域
    if (analysisResult.suspicious_areas?.length > 0) {
      resultRows.push({ key: '', value: '' });
      resultRows.push({ key: '--- 可疑区域 ---', value: '' });
      for (const [i, area] of analysisResult.suspicious_areas.entries()) {
        resultRows.push({ key: `区域 ${i + 1}`, value: area.description || '异常区域' });
      }
    }

    // 临床建议
    if (analysisResult.recommendations?.length > 0) {
      resultRows.push({ key: '', value: '' });
      resultRows.push({ key: '--- 临床建议 ---', value: '' });
      for (const [i, rec] of analysisResult.recommendations.entries()) {
        resultRows.push({ key: `建议 ${i + 1}`, value: rec });
      }
    }

    ws2.addRows(resultRows);
  } else {
    ws2.addRow({ key: '状态', value: '暂无分析结果' });
  }

  await workbook.xlsx.writeFile(filePath);
  const stat = fs.statSync(filePath);

  return { filePath, fileName, fileSize: stat.size };
}

module.exports = { generatePDF, generateWord, generateExcel, getReportData };
