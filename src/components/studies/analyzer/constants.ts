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

// 手动标注颜色配置 (蓝色系)
export const MANUAL_ANNOTATION_CONFIG = {
  color: '#3b82f6',
  fill: 'rgba(59, 130, 246, 0.15)',
  label: '手动标注',
} as const;

// AI检测风险等级颜色配置 (根据置信度)
export const AI_RISK_CONFIG = {
  CRITICAL: { threshold: 0.9, color: '#dc2626', fill: 'rgba(220, 38, 38, 0.2)', label: '极高风险' },
  HIGH: { threshold: 0.75, color: '#ef4444', fill: 'rgba(239, 68, 68, 0.18)', label: '高风险' },
  MEDIUM_HIGH: { threshold: 0.6, color: '#f97316', fill: 'rgba(249, 115, 22, 0.15)', label: '中高风险' },
  MEDIUM: { threshold: 0.4, color: '#eab308', fill: 'rgba(234, 179, 8, 0.15)', label: '中风险' },
  LOW: { threshold: 0, color: '#22c55e', fill: 'rgba(34, 197, 94, 0.12)', label: '低风险' },
} as const;

// 兼容旧代码
export const RISK_CONFIG = AI_RISK_CONFIG;

// AI检测标签配置 - 宫颈病变分类
export const AI_DETECTION_LABELS = {
  NILM: {
    name: '正常/良性',
    fullName: '未见上皮内病变或恶性细胞(NILM)',
    description: '细胞形态正常，未发现明显异常。建议定期复查。',
    severity: 'low' as const,
  },
  ASC_US: {
    name: '非典型鳞状细胞',
    fullName: '非典型鳞状上皮细胞-意义不明确(ASC-US)',
    description: '发现非典型鳞状细胞，意义不明确。建议进行HPV检测或3-6个月后复查。',
    severity: 'medium' as const,
  },
  LSIL: {
    name: '低级别病变',
    fullName: '低级别鳞状上皮内病变(LSIL/CIN1)',
    description: '检测到轻度细胞异型性，可能为HPV感染所致。建议阴道镜检查。',
    severity: 'medium' as const,
  },
  ASC_H: {
    name: '非典型细胞-高级别',
    fullName: '非典型鳞状上皮细胞-不除外高级别病变(ASC-H)',
    description: '发现非典型细胞，不能排除高级别病变可能。建议立即进行阴道镜检查。',
    severity: 'high' as const,
  },
  HSIL: {
    name: '高级别病变',
    fullName: '高级别鳞状上皮内病变(HSIL/CIN2-3)',
    description: '检测到中重度细胞异型性，存在癌前病变风险。建议立即阴道镜检查及活检。',
    severity: 'high' as const,
  },
  SCC: {
    name: '鳞状细胞癌',
    fullName: '鳞状细胞癌(SCC)',
    description: '发现恶性肿瘤细胞特征。请立即就医进行进一步确诊和治疗。',
    severity: 'critical' as const,
  },
  AGC: {
    name: '非典型腺细胞',
    fullName: '非典型腺细胞(AGC)',
    description: '发现非典型腺细胞。建议进行阴道镜检查及宫颈管取样。',
    severity: 'high' as const,
  },
  INFLAMMATION: {
    name: '炎症反应',
    fullName: '炎症性改变',
    description: '检测到炎症细胞浸润，可能为感染所致。建议抗炎治疗后复查。',
    severity: 'low' as const,
  },
} as const;

export type DetectionLabelKey = keyof typeof AI_DETECTION_LABELS;
