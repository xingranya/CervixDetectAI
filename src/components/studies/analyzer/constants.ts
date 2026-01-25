export const ZOOM_CONFIG = {
  FACTOR: 1.15, // 缩放因子（每次放大/缩小15%）
  MAX_SCALE: 8, // 最大缩放倍数
  MIN_SCALE: 0.1, // 最小缩放倍数
  FIT_RATIO: 0.9, // 适配屏幕时的填充比例
} as const;

export const LABEL_CONFIG = {
  MAX_LENGTH: 50, // 标签最大字符数
  CHAR_WIDTH_CN: 12, // 中文字符估算宽度
  CHAR_WIDTH_EN: 9, // 英文字符估算宽度
  PADDING: 12, // 标签内边距
} as const;

export const RISK_CONFIG = {
  HIGH: { threshold: 0.8, color: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)', label: '高风险' },
  MEDIUM_HIGH: {
    threshold: 0.6,
    color: '#f97316',
    fill: 'rgba(249, 115, 22, 0.15)',
    label: '中高风险',
  },
  MEDIUM: { threshold: 0.4, color: '#eab308', fill: 'rgba(234, 179, 8, 0.15)', label: '中风险' },
  LOW: { threshold: 0, color: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)', label: '低风险' },
} as const;
