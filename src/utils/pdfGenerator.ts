/**
 * PDF 报告生成工具
 * 输出医生归档版病例 PDF，包含图像对比、结构化表格与趋势图。
 */

import { getAnnotationColor, getAnnotationFill } from 'components/studies/analyzer/utils';
import type jsPDF from 'jspdf';
import type {
  PatientInsightDiseaseAlertData,
  PatientInsightHistoryData,
  PatientInsightHistoryItem,
  PatientInsightRiskFactorsData,
  PatientInsightRiskProfileData,
  PatientInsightRiskLevel,
} from 'src/services/api';
import {
  convertSuspiciousAreasToAnnotations,
  type SuspiciousAreaLike,
} from 'src/utils/studyAnnotations';

interface StudyData {
  id: string | number;
  patientDbId?: number;
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  bodyPart?: string;
  description?: string;
  imageUrl?: string;
}

interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  riskLevel?: PatientInsightRiskLevel;
  biomarkers?: Record<string, string>;
  suspiciousAreas?: Array<string | SuspiciousAreaLike>;
  recommendations?: string[];
  detailedReport?: string;
}

export interface PDFReportData {
  study: StudyData;
  result: AnalysisResult;
  history?: PatientInsightHistoryData | null;
  riskProfile?: PatientInsightRiskProfileData | null;
  riskFactors?: PatientInsightRiskFactorsData | null;
  diseaseAlert?: PatientInsightDiseaseAlertData | null;
}

interface ReportImageAsset {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
  width: number;
  height: number;
}

interface TrendPoint {
  label: string;
  riskWeight: number;
  confidencePercent: number;
}

interface RadarIndicatorPoint {
  name: string;
  value: number;
}

interface NormalizedSuspiciousArea extends SuspiciousAreaLike {
  description: string;
  locationText: string;
  featuresText: string;
}

const PDF_CONFIG = {
  PAGE_FORMAT: 'a4' as const,
  MARGIN_X: 14,
  MARGIN_Y: 16,
  FOOTER_HEIGHT: 10,
  CONTENT_WIDTH: 182,
  COLORS: {
    PRIMARY: [17, 76, 125] as const,
    PRIMARY_SOFT: [244, 248, 252] as const,
    PRIMARY_DEEP: [15, 55, 93] as const,
    PRIMARY_TINT: [232, 240, 248] as const,
    BORDER: [222, 229, 236] as const,
    BORDER_STRONG: [198, 210, 222] as const,
    TEXT: [28, 42, 56] as const,
    TEXT_MUTED: [77, 94, 110] as const,
    TEXT_SOFT: [112, 128, 145] as const,
    SUCCESS: [34, 110, 77] as const,
    WARNING: [188, 108, 37] as const,
    DANGER: [184, 62, 56] as const,
    PANEL: [248, 250, 252] as const,
    WHITE: [255, 255, 255] as const,
    LIGHT: [250, 251, 252] as const,
    STRIPE: [246, 248, 251] as const,
    RISK_BG: [251, 243, 242] as const,
    DISCLAIMER_BG: [253, 247, 246] as const,
  },
} as const;

const HISTORY_LIMIT = 6;

function convertMarkdownToPlainText(text?: string): string {
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

function normalizeConfidence(value: number | undefined | null): number {
  const raw = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(raw)) return 0;
  if (raw > 1 && raw <= 100) return Math.min(raw / 100, 1);
  return Math.max(0, Math.min(raw, 1));
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatPercent(value: number): string {
  return `${Math.round(normalizeConfidence(value) * 100)}%`;
}

function sanitizeFileSegment(value: string | number | undefined, fallback: string): string {
  const text = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return text || fallback;
}

function inferRiskLevelFromDiagnosis(diagnosis?: string): PatientInsightRiskLevel {
  const text = diagnosis || '';
  if (text.includes('浸润性癌') || text.includes('SCC')) return 'critical';
  if (text.includes('HSIL') || text.includes('ASC-H')) return 'high';
  if (text.includes('LSIL') || text.includes('ASC-US') || text.includes('AGC')) return 'medium';
  return 'low';
}

function resolveEffectiveRiskLevel(result: AnalysisResult): PatientInsightRiskLevel {
  return result.riskLevel || inferRiskLevelFromDiagnosis(result.diagnosis);
}

function resolveRiskLevelLabel(level: PatientInsightRiskLevel): string {
  if (level === 'critical') return '极高风险';
  if (level === 'high') return '高风险';
  if (level === 'medium') return '中风险';
  return '低风险';
}

function resolveRiskLevelColor(level: PatientInsightRiskLevel) {
  if (level === 'critical') return PDF_CONFIG.COLORS.DANGER;
  if (level === 'high') return [239, 68, 68] as const;
  if (level === 'medium') return [234, 88, 12] as const;
  return PDF_CONFIG.COLORS.SUCCESS;
}

function resolveRiskWeight(level: PatientInsightRiskLevel): number {
  if (level === 'critical') return 4;
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

function normalizeSuspiciousAreas(
  areas?: Array<string | SuspiciousAreaLike>,
): NormalizedSuspiciousArea[] {
  if (!areas?.length) return [];

  return areas.map((item, index) => {
    if (typeof item === 'string') {
      return {
        description: item || `异常区域${index + 1}`,
        locationText: '-',
        featuresText: '-',
      };
    }

    return {
      ...item,
      description: item.description || `异常区域${index + 1}`,
      locationText: item.location || '-',
      featuresText: item.features?.join('、') || '-',
    };
  });
}

function buildTrendSeries(data: PDFReportData): { points: TrendPoint[]; isFallback: boolean } {
  const historySeries = data.history?.series?.slice(-HISTORY_LIMIT) || [];
  if (historySeries.length > 0) {
    return {
      points: historySeries.map((item, index) => ({
        label: resolveHistoryLabel(item, index),
        riskWeight: resolveRiskWeight(item.risk_level),
        confidencePercent: Number((normalizeConfidence(item.confidence) * 100).toFixed(2)),
      })),
      isFallback: historySeries.length < 2,
    };
  }

  const effectiveRiskLevel = resolveEffectiveRiskLevel(data.result);
  return {
    points: [
      {
        label: '本次检查',
        riskWeight: resolveRiskWeight(effectiveRiskLevel),
        confidencePercent: Number((normalizeConfidence(data.result.confidence) * 100).toFixed(2)),
      },
    ],
    isFallback: true,
  };
}

function buildRadarSeries(data: PDFReportData): { points: RadarIndicatorPoint[]; overallScore: number | null } {
  const factors = data.riskFactors?.factors || [];
  if (!factors.length) {
    return { points: [], overallScore: null };
  }

  return {
    points: factors.map((item) => ({
      name: item.name,
      value: Math.max(0, Math.min(Number(item.score || 0), 100)),
    })),
    overallScore:
      typeof data.riskFactors?.overallScore === 'number' ? data.riskFactors.overallScore : null,
  };
}

function resolveHistoryLabel(item: PatientInsightHistoryItem, index: number): string {
  if (item.study_date) {
    return formatDate(item.study_date);
  }
  if (item.study_unique_id) {
    return item.study_unique_id;
  }
  return `检查${index + 1}`;
}

function tupleColor(color: readonly [number, number, number]) {
  return { r: color[0], g: color[1], b: color[2] };
}

function setTextColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function setDrawColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function setFillColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function drawRoundedPanel(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: readonly [number, number, number] = PDF_CONFIG.COLORS.WHITE,
) {
  setFillColor(doc, fillColor);
  setDrawColor(doc, PDF_CONFIG.COLORS.BORDER);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('创建画布上下文失败');
  }
  return { canvas, ctx };
}

function safeCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png',
  quality?: number,
): string | null {
  try {
    return canvas.toDataURL(format, quality);
  } catch (error) {
    console.warn('导出画布图片失败，将使用回退内容:', error);
    return null;
  }
}

function fillCanvasBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color = '#ffffff',
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`影像加载失败: ${url}`));
    image.src = url;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: { x: number; y: number; width: number; height: number },
) {
  const imageRatio = image.width / image.height;
  const rectRatio = rect.width / rect.height;

  let drawWidth = rect.width;
  let drawHeight = rect.height;
  let drawX = rect.x;
  let drawY = rect.y;

  if (imageRatio > rectRatio) {
    drawHeight = rect.width / imageRatio;
    drawY = rect.y + (rect.height - drawHeight) / 2;
  } else {
    drawWidth = rect.height * imageRatio;
    drawX = rect.x + (rect.width - drawWidth) / 2;
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
}

function drawCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    font: string;
    color: string;
    maxLines?: number;
    measureOnly?: boolean;
  },
) {
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  const lines: string[] = [];
  const segments = text.split('\n');

  for (const segment of segments) {
    if (!segment) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const char of segment) {
      const test = current + char;
      if (ctx.measureText(test).width > options.maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }

  const limited = typeof options.maxLines === 'number' ? lines.slice(0, options.maxLines) : lines;
  limited.forEach((line, index) => {
    if (options.measureOnly) return;
    const output =
      typeof options.maxLines === 'number' &&
      index === limited.length - 1 &&
      lines.length > limited.length
        ? `${line.replace(/\s+$/, '')}…`
        : line;
    ctx.fillText(output, options.x, options.y + index * options.lineHeight);
  });

  return limited.length;
}

function drawDocTextBlock(
  doc: jsPDF,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    fontSize: number;
    color: readonly [number, number, number];
    maxLines?: number;
    align?: 'left' | 'right' | 'center';
  },
) {
  doc.setFontSize(options.fontSize);
  setTextColor(doc, options.color);
  const rawLines = doc.splitTextToSize(text || '-', options.maxWidth) as string[];
  const lines =
    typeof options.maxLines === 'number' ? rawLines.slice(0, options.maxLines) : rawLines;
  const finalLines =
    typeof options.maxLines === 'number' && rawLines.length > lines.length
      ? lines.map((line, index) =>
          index === lines.length - 1 ? `${line.replace(/\s+$/, '')}…` : line,
        )
      : lines;
  doc.text(finalLines, options.x, options.y, options.align ? { align: options.align } : undefined);
  return finalLines.length * options.lineHeight;
}

function drawSidebarMetric(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  accent = '#0f766e',
  width = 252,
) {
  const innerX = x + 14;
  const innerWidth = width - 28;
  const lineCount = drawCanvasText(ctx, value, {
    x: innerX,
    y: y + 58,
    maxWidth: innerWidth,
    lineHeight: 24,
    font: 'bold 26px sans-serif',
    color: accent,
    maxLines: 2,
    measureOnly: true,
  });
  const boxHeight = Math.max(76, 34 + lineCount * 24);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#dbe5ef';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, boxHeight);
  ctx.strokeRect(x, y, width, boxHeight);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px sans-serif';
  ctx.fillText(label, innerX, y + 28);

  drawCanvasText(ctx, value, {
    x: innerX,
    y: y + 58,
    maxWidth: innerWidth,
    lineHeight: 24,
    font: 'bold 26px sans-serif',
    color: accent,
    maxLines: 2,
  });

  return y + boxHeight;
}

function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  title: string,
  description: string,
) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeStyle = '#dbe5ef';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(title, rect.x + 24, rect.y + 48);

  drawCanvasText(ctx, description, {
    x: rect.x + 24,
    y: rect.y + 96,
    maxWidth: rect.width - 48,
    lineHeight: 32,
    font: '24px sans-serif',
    color: '#64748b',
  });
}

async function createOriginalImageAsset(data: PDFReportData): Promise<ReportImageAsset> {
  const width = 1400;
  const height = 900;
  const sidebarWidth = 206;
  const headerHeight = 60;
  const padding = 28;
  const gap = 22;
  const { canvas, ctx } = createCanvas(width, height);
  fillCanvasBackground(ctx, width, height);

  ctx.fillStyle = '#13456d';
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px serif';
  ctx.fillText('原始影像', 30, 38);
  ctx.font = '18px sans-serif';
  ctx.fillText('本次检查基础影像与病例信息', 30, 54);

  const imageRect = {
    x: padding,
    y: headerHeight + padding,
    width: width - sidebarWidth - padding * 2 - gap,
    height: height - headerHeight - padding * 2 - 12,
  };
  const sidebarX = imageRect.x + imageRect.width + gap;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sidebarX, imageRect.y, sidebarWidth, imageRect.height);
  ctx.strokeStyle = '#d9e2ea';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sidebarX, imageRect.y, sidebarWidth, imageRect.height);

  if (data.study.imageUrl) {
    try {
      const image = await loadImage(data.study.imageUrl);
      drawImageCover(ctx, image, imageRect);
    } catch (error) {
      console.warn('加载原始影像失败，将使用占位图:', error);
      drawImagePlaceholder(ctx, imageRect, '未能加载原始影像', '请在联网环境下重试导出，或稍后重新生成报告。');
    }
  } else {
    drawImagePlaceholder(ctx, imageRect, '当前病例无原始影像', '影像资源缺失，PDF 中仅保留结构化分析结果。');
  }

  ctx.fillStyle = '#18374d';
  ctx.font = 'bold 24px serif';
  ctx.fillText('检查摘要', sidebarX + 18, imageRect.y + 34);

  const sidebarContentX = sidebarX + 14;
  const sidebarMetricWidth = sidebarWidth - 28;
  let metricY = imageRect.y + 54;
  metricY = drawSidebarMetric(
    ctx,
    sidebarContentX,
    metricY,
    '检查日期',
    formatDate(data.study.studyDate),
    '#2563eb',
    sidebarMetricWidth,
  );
  metricY += 16;
  metricY = drawSidebarMetric(
    ctx,
    sidebarContentX,
    metricY,
    '检查方式',
    data.study.modality || '-',
    '#0f766e',
    sidebarMetricWidth,
  );
  metricY += 14;
  drawCanvasText(ctx, '保留采集原图，便于医生复核影像背景与细胞分布。', {
    x: sidebarContentX,
    y: Math.min(metricY + 20, imageRect.y + imageRect.height - 28),
    maxWidth: sidebarMetricWidth,
    lineHeight: 24,
    font: '19px sans-serif',
    color: '#475569',
    maxLines: 2,
  });

  const dataUrl = safeCanvasToDataUrl(canvas, 'image/jpeg', 0.9);
  if (dataUrl) {
    return { dataUrl, format: 'JPEG', width, height };
  }

  const fallback = createCanvas(width, height);
  fillCanvasBackground(fallback.ctx, width, height);
  drawImagePlaceholder(
    fallback.ctx,
    { x: 42, y: 120, width: width - 84, height: height - 180 },
    '原始影像导出失败',
    '当前影像资源受到跨域限制，已回退为说明页。',
  );
  return {
    dataUrl: fallback.canvas.toDataURL('image/jpeg', 0.92),
    format: 'JPEG',
    width,
    height,
  };
}

async function createAnnotatedImageAsset(data: PDFReportData): Promise<ReportImageAsset> {
  const width = 1400;
  const height = 900;
  const sidebarWidth = 206;
  const headerHeight = 60;
  const padding = 28;
  const gap = 22;
  const suspiciousAreas = normalizeSuspiciousAreas(data.result.suspiciousAreas);
  const confidence = normalizeConfidence(data.result.confidence);
  const riskLevel = resolveEffectiveRiskLevel(data.result);
  const { canvas, ctx } = createCanvas(width, height);
  fillCanvasBackground(ctx, width, height);

  ctx.fillStyle = '#13456d';
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px serif';
  ctx.fillText('AI 标注摘要图', 30, 38);
  ctx.font = '18px sans-serif';
  ctx.fillText('可疑区域定位与检测摘要', 30, 54);

  const imageRect = {
    x: padding,
    y: headerHeight + padding,
    width: width - sidebarWidth - padding * 2 - gap,
    height: height - headerHeight - padding * 2 - 12,
  };
  const sidebarX = imageRect.x + imageRect.width + gap;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sidebarX, imageRect.y, sidebarWidth, imageRect.height);
  ctx.strokeStyle = '#d9e2ea';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sidebarX, imageRect.y, sidebarWidth, imageRect.height);

  let hadTaintedCanvas = false;
  if (data.study.imageUrl) {
    try {
      const image = await loadImage(data.study.imageUrl);
      const drawnRect = drawImageCover(ctx, image, imageRect);
      const annotations = convertSuspiciousAreasToAnnotations({
        areas: suspiciousAreas,
        imageWidth: image.width,
        imageHeight: image.height,
        confidence,
      });

      if (annotations.length > 0) {
        const scaleX = drawnRect.width / image.width;
        const scaleY = drawnRect.height / image.height;

        annotations.forEach((annotation, index) => {
          const x = drawnRect.x + annotation.x * scaleX;
          const y = drawnRect.y + annotation.y * scaleY;
          const rectWidth = annotation.width * scaleX;
          const rectHeight = annotation.height * scaleY;
          const color = getAnnotationColor(annotation.confidence, annotation.source);
          const fill = getAnnotationFill(annotation.confidence, annotation.source);

          ctx.fillStyle = fill;
          ctx.fillRect(x, y, rectWidth, rectHeight);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, rectWidth, rectHeight);

          const label = `${index + 1}. ${annotation.label || '异常区域'}`;
          ctx.font = 'bold 18px sans-serif';
          const labelWidth = Math.min(ctx.measureText(label).width + 18, rectWidth + 16);
          ctx.fillStyle = color;
          ctx.fillRect(x, Math.max(imageRect.y + 8, y - 26), labelWidth, 24);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, x + 8, Math.max(imageRect.y + 25, y - 8));
        });
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
        ctx.fillRect(imageRect.x + 20, imageRect.y + imageRect.height - 84, imageRect.width - 40, 54);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.fillText('本次结果未返回可绘制坐标，右侧保留文字摘要。', imageRect.x + 38, imageRect.y + imageRect.height - 48);
      }
    } catch (error) {
      console.warn('加载 AI 标注底图失败，将使用占位图:', error);
      drawImagePlaceholder(ctx, imageRect, '未能生成标注底图', '当前影像资源不可用，已保留文字摘要与结构化结果。');
    }
  } else {
    drawImagePlaceholder(ctx, imageRect, '当前病例无影像可标注', '系统仍会导出结构化表格与趋势信息。');
  }

  ctx.fillStyle = '#18374d';
  ctx.font = 'bold 24px serif';
  ctx.fillText('检测摘要', sidebarX + 18, imageRect.y + 34);

  const riskColor = tupleColor(resolveRiskLevelColor(riskLevel));
  const sidebarContentX = sidebarX + 14;
  const sidebarMetricWidth = sidebarWidth - 28;
  let metricY = imageRect.y + 54;
  metricY = drawSidebarMetric(
    ctx,
    sidebarContentX,
    metricY,
    '风险等级',
    resolveRiskLevelLabel(riskLevel),
    `rgb(${riskColor.r}, ${riskColor.g}, ${riskColor.b})`,
    sidebarMetricWidth,
  );
  metricY += 16;
  metricY = drawSidebarMetric(
    ctx,
    sidebarContentX,
    metricY,
    '置信度',
    formatPercent(confidence),
    '#2563eb',
    sidebarMetricWidth,
  );
  metricY += 16;
  metricY = drawSidebarMetric(
    ctx,
    sidebarContentX,
    metricY,
    '可疑区域数',
    String(suspiciousAreas.length),
    '#0f766e',
    sidebarMetricWidth,
  );
  metricY += 14;
  drawCanvasText(
    ctx,
    suspiciousAreas.length > 0
      ? '图中红框用于标记可疑区域，详细位置与特征请查看第二页明细表。'
      : '当前结果未返回需重点标注的可疑区域，详细说明请查看正文分析结论。',
    {
      x: sidebarContentX,
      y: metricY + 18,
      maxWidth: sidebarMetricWidth,
      lineHeight: 24,
      font: '19px sans-serif',
      color: '#64748b',
      maxLines: 3,
    },
  );

  const dataUrl = safeCanvasToDataUrl(canvas, 'image/jpeg', 0.9);
  if (dataUrl) {
    return { dataUrl, format: 'JPEG', width, height };
  }

  hadTaintedCanvas = true;
  const fallback = createCanvas(width, height);
  fillCanvasBackground(fallback.ctx, width, height);
  drawImagePlaceholder(
    fallback.ctx,
    { x: 42, y: 120, width: width - 84, height: height - 180 },
    'AI 标注图导出失败',
    hadTaintedCanvas
      ? '影像底图受到跨域限制，已回退为说明页。'
      : '系统未能生成 AI 标注图，请稍后重试。',
  );
  return {
    dataUrl: fallback.canvas.toDataURL('image/jpeg', 0.92),
    format: 'JPEG',
    width,
    height,
  };
}

async function createTrendChartAsset(data: PDFReportData): Promise<ReportImageAsset> {
  const { points, isFallback } = buildTrendSeries(data);
  const echarts = await import('echarts');
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '1400px';
  container.style.height = '560px';
  document.body.appendChild(container);

  const chart = echarts.init(container, undefined, { renderer: 'canvas' });
  chart.setOption({
    backgroundColor: '#ffffff',
    animation: false,
    title: {
      text: '患者风险趋势曲线',
      subtext: isFallback ? '历史数据不足，仅展示本次结果' : '近 6 次检查的风险权重与置信度变化',
      left: 32,
      top: 18,
      textStyle: {
        color: '#0f172a',
        fontSize: 24,
        fontWeight: 700,
      },
      subtextStyle: {
        color: '#64748b',
        fontSize: 14,
      },
    },
    legend: {
      data: ['风险权重', '置信度(%)'],
      top: 24,
      right: 36,
      textStyle: {
        color: '#334155',
        fontSize: 13,
      },
    },
    grid: {
      left: 66,
      right: 64,
      top: 84,
      bottom: 60,
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: points.map((item) => item.label),
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: '#94a3b8' },
      },
      axisLabel: {
        color: '#475569',
        rotate: points.length > 4 ? 18 : 0,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '风险权重',
        min: 1,
        max: 4,
        interval: 1,
        axisLabel: { color: '#475569' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '置信度',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#475569',
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: '风险权重',
        type: 'line',
        smooth: points.length > 2,
        symbolSize: 10,
        data: points.map((item) => item.riskWeight),
        itemStyle: { color: '#dc2626' },
        lineStyle: { width: 2.4, color: '#dc2626' },
        areaStyle: { color: 'rgba(220, 38, 38, 0.05)' },
        yAxisIndex: 0,
      },
      {
        name: '置信度(%)',
        type: 'line',
        smooth: points.length > 2,
        symbolSize: 10,
        data: points.map((item) => item.confidencePercent),
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 2.4, color: '#2563eb' },
        areaStyle: { color: 'rgba(37, 99, 235, 0.04)' },
        yAxisIndex: 1,
      },
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 50));
  const dataUrl = chart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });
  chart.dispose();
  container.remove();

  return {
    dataUrl,
    format: 'PNG',
    width: 1400,
    height: 560,
  };
}

async function createRiskRadarAsset(data: PDFReportData): Promise<ReportImageAsset | null> {
  const { points, overallScore } = buildRadarSeries(data);
  if (!points.length) return null;

  const echarts = await import('echarts');
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '900px';
  container.style.height = '620px';
  document.body.appendChild(container);

  const chart = echarts.init(container, undefined, { renderer: 'canvas' });
  chart.setOption({
    backgroundColor: '#ffffff',
    animation: false,
    title: {
      text: '风险因素雷达图',
      subtext: overallScore !== null ? `综合评分 ${overallScore}` : '患者风险因素分布概览',
      left: 28,
      top: 18,
      textStyle: {
        color: '#16354c',
        fontSize: 22,
        fontWeight: 700,
      },
      subtextStyle: {
        color: '#64748b',
        fontSize: 13,
      },
    },
    radar: {
      center: ['50%', '56%'],
      radius: '62%',
      splitNumber: 4,
      shape: 'polygon',
      axisName: {
        color: '#334155',
        fontSize: 13,
      },
      splitLine: {
        lineStyle: {
          color: ['#dbe5ef'],
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.0)', 'rgba(232,240,248,0.08)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d0dae4',
        },
      },
      indicator: points.map((item) => ({
        name: item.name,
        max: 100,
      })),
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#1d5f95',
          width: 2.2,
        },
        itemStyle: {
          color: '#1d5f95',
        },
        areaStyle: {
          color: 'rgba(29, 95, 149, 0.16)',
        },
        data: [
          {
            value: points.map((item) => item.value),
            name: '风险评分',
          },
        ],
      },
    ],
    tooltip: {},
  });

  await new Promise((resolve) => setTimeout(resolve, 50));
  const dataUrl = chart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });
  chart.dispose();
  container.remove();

  return {
    dataUrl,
    format: 'PNG',
    width: 900,
    height: 620,
  };
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  doc.text('CervixDetect AI · 医生归档版病例报告', PDF_CONFIG.MARGIN_X, pageHeight - 6);
  doc.text(`第 ${pageNum} 页 / 共 ${totalPages} 页`, pageWidth - PDF_CONFIG.MARGIN_X, pageHeight - 6, {
    align: 'right',
  });
}

function drawHeroHeader(doc: jsPDF, data: PDFReportData, reportId: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  setFillColor(doc, PDF_CONFIG.COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 21, 'F');

  doc.setFontSize(18);
  setTextColor(doc, PDF_CONFIG.COLORS.WHITE);
  doc.text('CervixDetect AI', PDF_CONFIG.MARGIN_X, 10.5);
  doc.setFontSize(9.4);
  doc.text('宫颈病例专业归档报告', PDF_CONFIG.MARGIN_X, 17);

  drawDocTextBlock(doc, `报告编号 ${reportId}`, {
    x: pageWidth - PDF_CONFIG.MARGIN_X,
    y: 9.3,
    maxWidth: 54,
    lineHeight: 3.8,
    fontSize: 7.7,
    color: PDF_CONFIG.COLORS.WHITE,
    maxLines: 2,
    align: 'right',
  });
  drawDocTextBlock(doc, `生成时间 ${formatDateTime(new Date().toISOString())}`, {
    x: pageWidth - PDF_CONFIG.MARGIN_X,
    y: 15.4,
    maxWidth: 54,
    lineHeight: 3.8,
    fontSize: 7.7,
    color: PDF_CONFIG.COLORS.WHITE,
    maxLines: 2,
    align: 'right',
  });

  const panelX = PDF_CONFIG.MARGIN_X;
  const panelY = 28;
  const panelWidth = PDF_CONFIG.CONTENT_WIDTH;
  const panelHeight = 46;
  drawRoundedPanel(doc, panelX, panelY, panelWidth, panelHeight, PDF_CONFIG.COLORS.PRIMARY_SOFT);

  doc.setFontSize(8.6);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  doc.text('本次检查摘要', panelX + 6, 35.5);

  drawDocTextBlock(doc, data.result.diagnosis || '未提供诊断结论', {
    x: panelX + 6,
    y: 49,
    maxWidth: 48,
    lineHeight: 6.2,
    fontSize: 18,
    color: PDF_CONFIG.COLORS.TEXT,
    maxLines: 2,
  });

  const riskLevel = resolveEffectiveRiskLevel(data.result);
  const riskColor = resolveRiskLevelColor(riskLevel);
  const riskBadgeWidth = 42;
  const riskBadgeY = 56;
  setFillColor(doc, PDF_CONFIG.COLORS.RISK_BG);
  setDrawColor(doc, riskColor);
  doc.roundedRect(panelX + 6, riskBadgeY, riskBadgeWidth, 10, 2.2, 2.2, 'FD');
  doc.setFontSize(8.1);
  setTextColor(doc, riskColor);
  doc.text(resolveRiskLevelLabel(riskLevel), panelX + 6 + riskBadgeWidth / 2, riskBadgeY + 6.6, {
    align: 'center',
  });

  const cardStartX = panelX + 62;
  const cardStartY = 36;
  const cardWidth = 56;
  const cardHeight = 15;
  const cardGap = 4;
  const cardSpecs = [
    {
      label: '风险等级',
      value: resolveRiskLevelLabel(riskLevel),
      x: cardStartX,
      y: cardStartY,
      color: riskColor,
      maxLines: 1,
    },
    {
      label: '置信度',
      value: formatPercent(data.result.confidence),
      x: cardStartX + cardWidth + cardGap,
      y: cardStartY,
      color: PDF_CONFIG.COLORS.PRIMARY_DEEP,
      maxLines: 1,
    },
    {
      label: '检查日期',
      value: formatDate(data.study.studyDate),
      x: cardStartX,
      y: cardStartY + cardHeight + cardGap,
      color: PDF_CONFIG.COLORS.TEXT,
      maxLines: 1,
    },
    {
      label: '检查方式',
      value: data.study.modality || '-',
      x: cardStartX + cardWidth + cardGap,
      y: cardStartY + cardHeight + cardGap,
      color: PDF_CONFIG.COLORS.TEXT,
      maxLines: 1,
    },
  ] as const;

  for (const card of cardSpecs) {
    drawRoundedPanel(doc, card.x, card.y, cardWidth, cardHeight, PDF_CONFIG.COLORS.WHITE);
    doc.setFontSize(7.1);
    setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
    doc.text(card.label, card.x + 3, card.y + 4.4);
    drawDocTextBlock(doc, card.value, {
      x: card.x + 3,
      y: card.y + 10.1,
      maxWidth: cardWidth - 6,
      lineHeight: 3,
      fontSize: 8.1,
      color: card.color,
      maxLines: card.maxLines,
    });
  }
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, followingHeight = 24) {
  y = ensurePageSpace(doc, y, followingHeight + 10);
  setTextColor(doc, PDF_CONFIG.COLORS.PRIMARY_DEEP);
  doc.setFontSize(12.2);
  doc.text(title, PDF_CONFIG.MARGIN_X, y);
  setDrawColor(doc, PDF_CONFIG.COLORS.BORDER);
  doc.line(PDF_CONFIG.MARGIN_X, y + 1.6, PDF_CONFIG.MARGIN_X + PDF_CONFIG.CONTENT_WIDTH, y + 1.6);
  return y + 6.4;
}

function drawImagePairSection(
  doc: jsPDF,
  assets: { original: ReportImageAsset; annotated: ReportImageAsset },
  startY: number,
) {
  const gap = 6;
  const imageWidth = (PDF_CONFIG.CONTENT_WIDTH - gap) / 2;
  const imageHeight = 57.5;

  const panelY = startY + 2;
  drawRoundedPanel(doc, PDF_CONFIG.MARGIN_X, panelY, imageWidth, imageHeight + 10, PDF_CONFIG.COLORS.WHITE);
  drawRoundedPanel(
    doc,
    PDF_CONFIG.MARGIN_X + imageWidth + gap,
    panelY,
    imageWidth,
    imageHeight + 10,
    PDF_CONFIG.COLORS.WHITE,
  );

  doc.setFontSize(10);
  setTextColor(doc, PDF_CONFIG.COLORS.PRIMARY_DEEP);
  doc.text('原始影像', PDF_CONFIG.MARGIN_X + 4, startY);
  doc.text('AI 标注摘要图', PDF_CONFIG.MARGIN_X + imageWidth + gap + 4, startY);

  doc.addImage(
    assets.original.dataUrl,
    assets.original.format,
    PDF_CONFIG.MARGIN_X + 2,
    startY + 4,
    imageWidth - 4,
    imageHeight,
  );
  doc.addImage(
    assets.annotated.dataUrl,
    assets.annotated.format,
    PDF_CONFIG.MARGIN_X + imageWidth + gap + 2,
    startY + 4,
    imageWidth - 4,
    imageHeight,
  );

  doc.setFontSize(8.3);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  doc.text('保留采集原图，方便人工复核影像背景。', PDF_CONFIG.MARGIN_X + 4, startY + imageHeight + 10);
  doc.text(
    '叠加风险框与摘要信息，详细区域说明见第二页。',
    PDF_CONFIG.MARGIN_X + imageWidth + gap + 4,
    startY + imageHeight + 10,
  );

  const note = '阅读建议：先对比左右两图确认可疑区域位置，再结合第二页结构化指标与区域明细做判断。';
  const wrapped = doc.splitTextToSize(note, PDF_CONFIG.CONTENT_WIDTH);
  doc.text(wrapped, PDF_CONFIG.MARGIN_X, startY + imageHeight + 18);

  return startY + imageHeight + wrapped.length * 4 + 20;
}

function drawKeyMetricsTable(doc: jsPDF, data: PDFReportData, startY: number) {
  const suspiciousAreaCount = data.result.suspiciousAreas?.length || 0;
  const biomarkers = data.result.biomarkers || {};
  const riskLevel = resolveEffectiveRiskLevel(data.result);
  const rows: Array<[string, string, string, string]> = [
    ['患者编号', data.study.patientId || '-', '检查日期', formatDate(data.study.studyDate)],
    ['检查方式', data.study.modality || '-', '诊断结论', data.result.diagnosis || '-'],
    ['风险等级', resolveRiskLevelLabel(riskLevel), '置信度', formatPercent(data.result.confidence)],
    ['可疑区域数', String(suspiciousAreaCount), 'HPV', biomarkers.HPV || biomarkers.hpv || '-'],
    ['p16', biomarkers.p16 || '-', 'Ki67', biomarkers.Ki67 || biomarkers.ki67 || '-'],
  ];

  const tableX = PDF_CONFIG.MARGIN_X;
  const labelWidth = 17;
  const valueWidth = 74;
  const rowWidth = labelWidth + valueWidth;
  let y = startY;

  rows.forEach((row, rowIndex) => {
    const leftLines = doc.splitTextToSize(row[1], valueWidth - 4);
    const rightLines = doc.splitTextToSize(row[3], valueWidth - 4);
    const lineCount = Math.max(leftLines.length, rightLines.length, 1);
    const rowHeight = Math.max(11, lineCount * 4.2 + 4);
    const valueFill = rowIndex % 2 === 0 ? PDF_CONFIG.COLORS.WHITE : PDF_CONFIG.COLORS.STRIPE;

    [
      { x: tableX, label: row[0], value: row[1] },
      { x: tableX + rowWidth, label: row[2], value: row[3] },
    ].forEach((cell) => {
      setFillColor(doc, rowIndex === 0 ? PDF_CONFIG.COLORS.PRIMARY_TINT : PDF_CONFIG.COLORS.PRIMARY_SOFT);
      setDrawColor(doc, PDF_CONFIG.COLORS.BORDER);
      doc.rect(cell.x, y, labelWidth, rowHeight, 'FD');
      setFillColor(doc, valueFill);
      doc.rect(cell.x + labelWidth, y, valueWidth, rowHeight, 'FD');

      doc.setFontSize(7.8);
      setTextColor(doc, PDF_CONFIG.COLORS.TEXT_MUTED);
      doc.text(cell.label, cell.x + 2.6, y + 6.1);

      const isEmphasis = cell.label === '风险等级' || cell.label === '置信度';
      doc.setFontSize(isEmphasis ? 10.1 : 9.2);
      setTextColor(doc, isEmphasis ? resolveRiskLevelColor(riskLevel) : PDF_CONFIG.COLORS.TEXT);
      doc.text(doc.splitTextToSize(cell.value || '-', valueWidth - 4), cell.x + labelWidth + 2, y + 6.3);
    });

    y += rowHeight;
  });

  setDrawColor(doc, PDF_CONFIG.COLORS.BORDER);
  doc.rect(tableX, startY, PDF_CONFIG.CONTENT_WIDTH, y - startY, 'S');

  return y + 6;
}

function ensurePageSpace(
  doc: jsPDF,
  y: number,
  requiredHeight: number,
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + requiredHeight <= pageHeight - PDF_CONFIG.FOOTER_HEIGHT - 8) {
    return y;
  }
  doc.addPage();
  return PDF_CONFIG.MARGIN_Y;
}

function measureSuspiciousAreaRowHeight(
  doc: jsPDF,
  values: string[],
  columnWidths: number[],
): number {
  const lineGroups = values.map((value, valueIndex) =>
    doc.splitTextToSize(value || '-', columnWidths[valueIndex]! - 4),
  );
  return Math.max(12, Math.max(...lineGroups.map((lines) => lines.length)) * 4.4 + 5);
}

function drawSuspiciousAreaTable(doc: jsPDF, data: PDFReportData, startY: number) {
  const areas = normalizeSuspiciousAreas(data.result.suspiciousAreas);
  if (areas.length === 0) {
    const y = ensurePageSpace(doc, startY, 22);
    drawRoundedPanel(doc, PDF_CONFIG.MARGIN_X, y, PDF_CONFIG.CONTENT_WIDTH, 14, PDF_CONFIG.COLORS.STRIPE);
    doc.setFontSize(8.8);
    setTextColor(doc, PDF_CONFIG.COLORS.TEXT_MUTED);
    doc.text('当前图像整体视野未见明确高危病灶，建议结合整体形态与临床资料综合判断。', PDF_CONFIG.MARGIN_X + 4, y + 9);
    return y + 18;
  }

  const headers = ['序号', '描述', '位置', '特征'];
  const columnWidths = [11, 56, 28, 87];
  const tableX = PDF_CONFIG.MARGIN_X;
  let y = startY;

  const drawHeader = () => {
    let x = tableX;
    headers.forEach((header, index) => {
      setFillColor(doc, PDF_CONFIG.COLORS.PRIMARY_TINT);
      setDrawColor(doc, PDF_CONFIG.COLORS.BORDER_STRONG);
      doc.rect(x, y, columnWidths[index]!, 9.5, 'FD');
      doc.setFontSize(8.1);
      setTextColor(doc, PDF_CONFIG.COLORS.TEXT_MUTED);
      doc.text(header, x + 2.5, y + 6.1);
      x += columnWidths[index]!;
    });
    y += 9.5;
  };

  const firstRowValues = [
    '1',
    areas[0]!.description,
    areas[0]!.locationText,
    areas[0]!.featuresText,
  ];
  y = ensurePageSpace(
    doc,
    y,
    11 + measureSuspiciousAreaRowHeight(doc, firstRowValues, columnWidths) + 2,
  );
  drawHeader();

  for (const [index, area] of areas.entries()) {
    const rowValues = [
      `${index + 1}`,
      area.description,
      area.locationText,
      area.featuresText,
    ];
    const lineGroups = rowValues.map((value, valueIndex) =>
      doc.splitTextToSize(value || '-', columnWidths[valueIndex]! - 4),
    );
    const rowHeight = measureSuspiciousAreaRowHeight(doc, rowValues, columnWidths);
    y = ensurePageSpace(doc, y, rowHeight + 2);
    if (y === PDF_CONFIG.MARGIN_Y) {
      drawHeader();
    }

    let x = tableX;
    lineGroups.forEach((lines, valueIndex) => {
      setFillColor(doc, index % 2 === 0 ? PDF_CONFIG.COLORS.WHITE : PDF_CONFIG.COLORS.STRIPE);
      setDrawColor(doc, PDF_CONFIG.COLORS.BORDER);
      doc.rect(x, y, columnWidths[valueIndex]!, rowHeight, 'FD');
      doc.setFontSize(8.2);
      setTextColor(doc, PDF_CONFIG.COLORS.TEXT);
      doc.text(lines, x + 2, y + 5.8);
      x += columnWidths[valueIndex]!;
    });
    y += rowHeight;
  }

  return y + 8;
}

function drawChartSection(
  doc: jsPDF,
  chartAsset: ReportImageAsset,
  data: PDFReportData,
  startY: number,
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = ensurePageSpace(doc, startY, 98);
  if (y === PDF_CONFIG.MARGIN_Y) {
    y = drawSectionTitle(doc, '患者趋势曲线', y + 4);
  }

  doc.addImage(chartAsset.dataUrl, chartAsset.format, PDF_CONFIG.MARGIN_X, y, PDF_CONFIG.CONTENT_WIDTH, 74);
  y += 79;

  const fallback = buildTrendSeries(data).isFallback;
  doc.setFontSize(8.5);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  const caption = fallback
    ? '当前患者历史记录不足，曲线图已回退为本次检查风险权重与置信度展示。'
    : '趋势曲线按最近 6 次检查生成，用于观察风险等级与模型置信度的纵向变化。';
  doc.text(doc.splitTextToSize(caption, PDF_CONFIG.CONTENT_WIDTH), PDF_CONFIG.MARGIN_X, y);

  return Math.min(y + 10, pageHeight - PDF_CONFIG.FOOTER_HEIGHT - 8);
}

function drawRecommendationCards(
  doc: jsPDF,
  recommendations: string[],
  startY: number,
) {
  let y = startY;
  for (const [index, recommendation] of recommendations.entries()) {
    const lines = doc.splitTextToSize(recommendation, PDF_CONFIG.CONTENT_WIDTH - 26);
    const boxHeight = Math.max(14, lines.length * 4.9 + 8);
    y = ensurePageSpace(doc, y, boxHeight + 4);

    drawRoundedPanel(doc, PDF_CONFIG.MARGIN_X, y, PDF_CONFIG.CONTENT_WIDTH, boxHeight, PDF_CONFIG.COLORS.PRIMARY_TINT);
    doc.setFontSize(8.2);
    setTextColor(doc, PDF_CONFIG.COLORS.PRIMARY_DEEP);
    doc.text(`建议 ${index + 1}`, PDF_CONFIG.MARGIN_X + 6, y + 6.7);

    doc.setFontSize(9.1);
    setTextColor(doc, PDF_CONFIG.COLORS.TEXT);
    doc.text(lines, PDF_CONFIG.MARGIN_X + 18, y + 7.9);
    y += boxHeight + 4;
  }
  return y;
}

function drawRiskProfileSummary(doc: jsPDF, data: PDFReportData, startY: number) {
  const riskProfile = data.riskProfile;
  if (!riskProfile) return startY;

  const cards = [
    {
      label: '综合风险评分',
      value: String(riskProfile.score ?? '-'),
      accent: PDF_CONFIG.COLORS.PRIMARY_DEEP,
    },
    {
      label: '风险级别',
      value: resolveRiskLevelLabel(riskProfile.level),
      accent: resolveRiskLevelColor(riskProfile.level),
    },
    {
      label: '趋势方向',
      value:
        riskProfile.trend === 'up'
          ? '上升'
          : riskProfile.trend === 'down'
            ? '下降'
            : riskProfile.trend === 'stable'
              ? '稳定'
              : '样本不足',
      accent: PDF_CONFIG.COLORS.TEXT,
    },
    {
      label: '高风险占比',
      value: `${Math.round((riskProfile.metrics?.high_risk_ratio || 0) * 100)}%`,
      accent: PDF_CONFIG.COLORS.TEXT,
    },
  ];

  const gap = 4;
  const cardWidth = (PDF_CONFIG.CONTENT_WIDTH - gap * 3) / 4;
  const cardHeight = 18;
  let x = PDF_CONFIG.MARGIN_X;
  for (const card of cards) {
    drawRoundedPanel(doc, x, startY, cardWidth, cardHeight, PDF_CONFIG.COLORS.WHITE);
    doc.setFontSize(7.2);
    setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
    doc.text(card.label, x + 3, startY + 4.6);
    drawDocTextBlock(doc, card.value, {
      x: x + 3,
      y: startY + 11,
      maxWidth: cardWidth - 6,
      lineHeight: 3,
      fontSize: 9.2,
      color: card.accent,
      maxLines: 1,
    });
    x += cardWidth + gap;
  }

  if (riskProfile.suggestions?.length) {
    const summary = `关注建议：${riskProfile.suggestions.slice(0, 2).join('；')}`;
    doc.setFontSize(8.2);
    setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
    doc.text(doc.splitTextToSize(summary, PDF_CONFIG.CONTENT_WIDTH), PDF_CONFIG.MARGIN_X, startY + 24);
    return startY + 30;
  }

  return startY + 24;
}

function drawDiseaseAlertSummary(doc: jsPDF, data: PDFReportData, startY: number) {
  const diseaseAlert = data.diseaseAlert;
  if (!diseaseAlert) return startY;

  const levelText =
    diseaseAlert.alertLevel === 'critical'
      ? '高危预警'
      : diseaseAlert.alertLevel === 'warning'
        ? '风险预警'
        : diseaseAlert.alertLevel === 'watch'
          ? '重点观察'
          : '暂无预警';
  const trendText =
    diseaseAlert.trend === 'worsening'
      ? '病程恶化'
      : diseaseAlert.trend === 'improving'
        ? '病程改善'
        : diseaseAlert.trend === 'fluctuating'
          ? '风险波动'
          : '相对稳定';

  drawRoundedPanel(doc, PDF_CONFIG.MARGIN_X, startY, PDF_CONFIG.CONTENT_WIDTH, 22, PDF_CONFIG.COLORS.PRIMARY_SOFT);
  doc.setFontSize(8.1);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  doc.text('病程预警摘要', PDF_CONFIG.MARGIN_X + 6, startY + 5.2);

  doc.setFontSize(9.4);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT);
  const text = `当前状态：${levelText}；趋势判断：${trendText}。${diseaseAlert.prediction || ''}`.trim();
  doc.text(doc.splitTextToSize(text, PDF_CONFIG.CONTENT_WIDTH - 12), PDF_CONFIG.MARGIN_X + 6, startY + 11.6);
  return startY + 28;
}

function drawDetailedReport(
  doc: jsPDF,
  text: string,
  startY: number,
) {
  let y = startY;
  const paragraphs = convertMarkdownToPlainText(text)
    .split('\n\n')
    .map((item) => item.trim())
    .filter(Boolean);

  doc.setFontSize(9.1);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT);
  paragraphs.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph, PDF_CONFIG.CONTENT_WIDTH - 4) as string[];
    lines.forEach((line: string) => {
      y = ensurePageSpace(doc, y, 6.1);
      doc.text(line, PDF_CONFIG.MARGIN_X, y);
      y += 5;
    });
    y += 3.2;
  });

  return y + 4;
}

function drawDisclaimer(doc: jsPDF, startY: number) {
  const y = ensurePageSpace(doc, startY, 32);
  drawRoundedPanel(doc, PDF_CONFIG.MARGIN_X, y, PDF_CONFIG.CONTENT_WIDTH, 28, PDF_CONFIG.COLORS.DISCLAIMER_BG);

  doc.setFontSize(9.6);
  setTextColor(doc, PDF_CONFIG.COLORS.DANGER);
  doc.text('免责声明', PDF_CONFIG.MARGIN_X + 6, y + 7);

  doc.setFontSize(7.9);
  setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
  const lines = doc.splitTextToSize(
    '本报告由 CervixDetect AI 生成，仅作为辅助筛查与归档参考，不能替代执业医师的临床诊断、活检结果或最终治疗决策。请结合患者症状、既往病史及其他检查结果综合判断。',
    PDF_CONFIG.CONTENT_WIDTH - 12,
  );
  doc.text(lines, PDF_CONFIG.MARGIN_X + 6, y + 13);

  return y + 34;
}

export async function generatePDFReport(
  data: PDFReportData,
): Promise<{ blob: Blob; fileName: string }> {
  const { default: jsPDF } = await import('jspdf');
  const { setupChineseFontAdvanced } = await import('./pdfFonts');

  const [originalAsset, annotatedAsset, chartAsset, radarAsset] = await Promise.all([
    createOriginalImageAsset(data),
    createAnnotatedImageAsset(data),
    createTrendChartAsset(data),
    createRiskRadarAsset(data),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: PDF_CONFIG.PAGE_FORMAT,
  });

  await setupChineseFontAdvanced(doc);

  const reportId = `RPT-${String(data.study.id)}-${Date.now().toString(36).toUpperCase()}`;
  drawHeroHeader(doc, data, reportId);
  let y = 80;
  if (data.riskProfile) {
    y = drawRiskProfileSummary(doc, data, y);
  }

  y = drawSectionTitle(doc, '影像对比', y + 2, 92);
  y = drawImagePairSection(doc, { original: originalAsset, annotated: annotatedAsset }, y + 1);

  doc.addPage();
  y = drawSectionTitle(doc, '本次检查关键指标', PDF_CONFIG.MARGIN_Y + 4, 72);
  y = drawKeyMetricsTable(doc, data, y);
  y = drawSectionTitle(doc, '可疑区域明细', y, 40);
  y = drawSuspiciousAreaTable(doc, data, y);
  if (data.riskProfile) {
    y = drawSectionTitle(doc, '洞察摘要', y, 34);
    y = drawRiskProfileSummary(doc, data, y + 1);
  }

  doc.addPage();
  y = drawSectionTitle(doc, '患者趋势曲线', PDF_CONFIG.MARGIN_Y + 4, 88);
  y = drawChartSection(doc, chartAsset, data, y);
  if (radarAsset) {
    y = drawSectionTitle(doc, '风险因素画像', y + 4, 88);
    doc.addImage(radarAsset.dataUrl, radarAsset.format, PDF_CONFIG.MARGIN_X + 8, y, 78, 54);
    if (data.riskFactors?.factors?.length) {
      const summaryLines = data.riskFactors.factors
        .slice(0, 4)
        .map((item) => `${item.name}：${item.score} 分（${item.description}）`);
      drawRoundedPanel(
        doc,
        PDF_CONFIG.MARGIN_X + 96,
        y + 2,
        PDF_CONFIG.CONTENT_WIDTH - 96,
        50,
        PDF_CONFIG.COLORS.WHITE,
      );
      doc.setFontSize(8.2);
      setTextColor(doc, PDF_CONFIG.COLORS.TEXT_SOFT);
      doc.text('风险因素摘要', PDF_CONFIG.MARGIN_X + 102, y + 8);
      doc.setFontSize(8.8);
      setTextColor(doc, PDF_CONFIG.COLORS.TEXT);
      doc.text(
        doc.splitTextToSize(summaryLines.join('\n'), PDF_CONFIG.CONTENT_WIDTH - 108),
        PDF_CONFIG.MARGIN_X + 102,
        y + 14,
      );
    }
    y += 62;
  }
  if (data.diseaseAlert) {
    y = drawSectionTitle(doc, '疾病预警摘要', y + 2, 36);
    y = drawDiseaseAlertSummary(doc, data, y + 1);
  }

  doc.addPage();
  y = drawSectionTitle(doc, '临床建议', PDF_CONFIG.MARGIN_Y + 4, 44);
  const recommendations =
    data.result.recommendations?.length
      ? data.result.recommendations
      : ['请结合阴道镜、HPV 结果及临床体征进行综合判断，必要时安排复查或进一步病理检查。'];
  y = drawRecommendationCards(doc, recommendations, y);

  if (data.result.detailedReport) {
    y = drawSectionTitle(doc, '详细说明', y + 2, 50);
    y = drawDetailedReport(doc, data.result.detailedReport, y);
  }

  y = drawDisclaimer(doc, y + 4);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  const fileName = `CervixDetect_Report_${sanitizeFileSegment(
    data.study.patientId,
    'patient',
  )}_${sanitizeFileSegment(data.study.id, 'study')}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  return {
    blob,
    fileName,
  };
}
