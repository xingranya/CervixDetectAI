import type {
  AiConfigState,
  ModelOption,
  SelectOption,
  UserPreferencesState,
} from 'src/types/preferences';

export const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'CervixDetect Pro (推荐)',
    value: 'qwen-vl-max',
    description: '最高精度，适用于复杂病例',
  },
  {
    label: 'CervixDetect Standard',
    value: 'qwen-vl-plus',
    description: '平衡性能与速度',
  },
  {
    label: 'CervixDetect Lite',
    value: 'qwen-vl-v1',
    description: '快速筛查模式',
  },
];

export const NOTIFICATION_TYPE_OPTIONS: SelectOption[] = [
  { label: '分析完成报告', value: 'analysis' },
  { label: '高风险病变预警', value: 'alert' },
  { label: '系统安全通知', value: 'security' },
  { label: '周度/月度汇总', value: 'report' },
  { label: '营销与优惠', value: 'marketing' },
];

export const ROI_STYLE_OPTIONS: SelectOption[] = [
  { label: '矩形框 (Box)', value: 'box' },
  { label: '轮廓遮罩 (Mask)', value: 'mask' },
  { label: '热力图 (Heatmap)', value: 'heatmap' },
  { label: '混合显示 (Hybrid)', value: 'hybrid' },
];

export const HEATMAP_COLOR_OPTIONS: SelectOption[] = [
  { label: '经典红蓝 (Jet)', value: 'jet' },
  { label: '医学灰阶 (Gray)', value: 'gray' },
  { label: '警告红黄 (Hot)', value: 'hot' },
  { label: '荧光绿 (Viridis)', value: 'viridis' },
];

export const REPORT_FORMAT_OPTIONS: SelectOption[] = [
  { label: 'PDF 专业版', value: 'pdf_pro' },
  { label: 'PDF 精简版', value: 'pdf_lite' },
  { label: 'Word 文档', value: 'docx' },
  { label: 'Excel 数据表', value: 'xlsx' },
];

export const IMAGE_QUALITY_OPTIONS: SelectOption[] = [
  { label: '无损原始图 (RAW)', value: 'lossless' },
  { label: '高质量 (High)', value: 'high' },
  { label: '标准压缩 (Standard)', value: 'standard' },
];

export const createDefaultAiConfig = (): AiConfigState => ({
  model: 'qwen-vl-max',
  confidence: 0.85,
  sensitivity: 0.9,
});

export const createDefaultPreferences = (): UserPreferencesState => ({
  notifications: {
    enable: true,
    channels: ['in_app', 'email', 'browser'],
    types: ['analysis', 'alert', 'security'],
    dndMode: false,
  },
  analysis: {
    autoStart: true,
    aiSecondOpinion: false,
    roiStyle: 'box',
    heatmapColor: 'jet',
  },
  reports: {
    autoSave: true,
    defaultFormat: { label: 'PDF 专业版', value: 'pdf_pro' },
    imageQuality: { label: '高质量 (High)', value: 'high' },
    watermark: false,
    watermarkText: '',
  },
  privacy: {
    desensitization: true,
    mfa: false,
  },
  billing: {
    autoRenewal: false,
    lowBalanceAlert: true,
    threshold: 50,
  },
});
