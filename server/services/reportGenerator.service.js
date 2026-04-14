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
  BorderStyle,
  WidthType,
} = require('docx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { Study, Patient, AnalysisResult, StudyImage } = require('../models');

// 中文字体路径
const FONT_PATH = path.join(__dirname, '../../public/fonts/SimSun.ttf');
const HAS_CN_FONT = fs.existsSync(FONT_PATH);

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

  return { study, patient, analysisResult, images };
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
  const data = await getReportData(studyId);
  const { study, patient, analysisResult, images } = data;

  const fileName = `report_${study.study_id}_${Date.now()}.pdf`;
  const outputDir = process.env.PDF_OUTPUT_DIR
    ? path.resolve(process.env.PDF_OUTPUT_DIR)
    : path.join(__dirname, '../reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);

    // 注册中文字体
    if (HAS_CN_FONT) {
      doc.registerFont('SimSun', FONT_PATH);
      doc.font('SimSun');
    }

    let pageCount = 1;
    doc.on('pageAdded', () => {
      pageCount += 1;
    });

    doc.pipe(stream);

    // ---------- 标题 ----------
    doc.fontSize(20).text(template.header, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text(template.hospital_name, { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#1976D2').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // ---------- 患者信息 ----------
    doc.fillColor('#000000').fontSize(14).text('一、患者信息');
    doc.moveDown(0.5);
    doc.fontSize(10);

    const patientRows = [
      ['姓名', patient?.name || '-', '性别', genderText(patient?.gender)],
      ['年龄', calcAge(patient?.birth_date), '患者编号', patient?.patient_id || '-'],
      ['联系电话', patient?.phone || '-', '病历号', patient?.medical_card_no || '-'],
    ];

    for (const row of patientRows) {
      doc
        .text(`${row[0]}：${row[1]}`, 60, doc.y, { continued: true, width: 220 })
        .text(`    ${row[2]}：${row[3]}`, { width: 250 });
      doc.moveDown(0.3);
    }
    doc.moveDown(0.5);

    // ---------- 检查信息 ----------
    doc.fontSize(14).text('二、检查信息');
    doc.moveDown(0.5);
    doc.fontSize(10);

    const studyDate = study.study_date
      ? new Date(study.study_date).toLocaleDateString('zh-CN')
      : '-';
    doc.text(`检查类型：${study.study_type || '-'}`, 60);
    doc.moveDown(0.2);
    doc.text(`检查日期：${studyDate}`, 60);
    doc.moveDown(0.2);
    doc.text(`病例编号：${study.study_id}`, 60);
    if (study.description) {
      doc.moveDown(0.2);
      doc.text(`描述：${study.description}`, 60);
    }
    doc.moveDown(0.5);

    // ---------- 分析结果 ----------
    doc.fontSize(14).text('三、AI分析结果');
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (analysisResult) {
      const confidence = analysisResult.confidence
        ? `${Math.round(Number(analysisResult.confidence) * 100)}%`
        : '-';

      doc.text(`诊断结论：${analysisResult.diagnosis || '-'}`, 60);
      doc.moveDown(0.2);
      doc.text(`置信度：${confidence}`, 60);
      doc.moveDown(0.2);
      doc.text(`风险等级：${riskLevelText(analysisResult.risk_level)}`, 60);
      doc.moveDown(0.3);

      // 生物标志物
      if (analysisResult.biomarkers) {
        doc.text('生物标志物：', 60);
        doc.moveDown(0.2);
        const markers = analysisResult.biomarkers;
        for (const [key, val] of Object.entries(markers)) {
          doc.text(`  ${key}：${val}`, 70);
          doc.moveDown(0.1);
        }
        doc.moveDown(0.3);
      }

      // 可疑区域
      if (analysisResult.suspicious_areas && analysisResult.suspicious_areas.length > 0) {
        doc.text(`可疑区域（${analysisResult.suspicious_areas.length}个）：`, 60);
        doc.moveDown(0.2);
        for (const [i, area] of analysisResult.suspicious_areas.entries()) {
          doc.text(`  ${i + 1}. ${area.description || '异常区域'}`, 70);
          doc.moveDown(0.1);
        }
        doc.moveDown(0.3);
      }

      // 详细报告
      if (analysisResult.detailed_report) {
        doc.text('详细病理报告：', 60);
        doc.moveDown(0.2);
        doc.fontSize(9).text(convertMarkdownToPlainText(analysisResult.detailed_report), 60, doc.y, {
          width: 480,
        });
        doc.fontSize(10);
        doc.moveDown(0.3);
      }
    } else {
      doc.text('暂无分析结果', 60);
    }
    doc.moveDown(0.5);

    // ---------- 病例图像 ----------
    const localImages = getLocalImagePaths(images);
    if (localImages.length > 0) {
      doc.fontSize(14).text('四、病例图像');
      doc.moveDown(0.5);
      for (const [idx, imgPath] of localImages.entries()) {
        // 检查剩余页面空间，不足则新增页
        if (doc.y > 600) doc.addPage();
        doc.fontSize(9).text(`图像 ${idx + 1}`, 60);
        doc.moveDown(0.2);
        try {
          doc.image(imgPath, 60, doc.y, { width: 300 });
          doc.moveDown(0.5);
          // 图片后留一段空白（PDFKit image 不会自动推进y）
          doc.y += 220;
        } catch {
          doc.text(`  [图像加载失败: ${path.basename(imgPath)}]`, 70);
          doc.moveDown(0.3);
        }
      }
      doc.moveDown(0.5);
    }

    // ---------- 临床建议 ----------
    if (analysisResult?.recommendations && analysisResult.recommendations.length > 0) {
      doc.fontSize(14).text(localImages.length > 0 ? '五、临床建议' : '四、临床建议');
      doc.moveDown(0.5);
      doc.fontSize(10);
      for (const [i, rec] of analysisResult.recommendations.entries()) {
        doc.text(`${i + 1}. ${rec}`, 60, doc.y, { width: 480 });
        doc.moveDown(0.2);
      }
    }

    // ---------- 页脚 ----------
    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text(template.footer, 50, doc.y, { align: 'center', width: 495 });
    doc.text(`报告生成时间：${new Date().toLocaleString('zh-CN')}`, {
      align: 'center',
      width: 495,
    });

    doc.end();

    stream.on('finish', () => {
      const stat = fs.statSync(filePath);
      resolve({ filePath, fileName, fileSize: stat.size, pageCount });
    });

    stream.on('error', reject);
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
