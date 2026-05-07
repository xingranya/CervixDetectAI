export type DemoPlanTier = 'basic' | 'premium';

export type DemoBillingMode = 'duration' | 'usage';

export interface DemoStatusCardPreset {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: string;
  color: string;
  planName: string;
  tierLabel: string;
  quotaLabel: string;
  remainingCount: string;
  featureTags: string[];
  renewalNote?: string;
}

export interface DemoOffer {
  code: string;
  tier: DemoPlanTier;
  billingMode: DemoBillingMode;
  durationDays?: number;
  amount: number;
  originalAmount?: number;
  planName: string;
  label: string;
  description: string;
  unitLabel: string;
  billingLabel: string;
  badge: string;
  autoRenewHint?: string;
  statusCard: DemoStatusCardPreset;
  featureSummary: string[];
}

export interface DemoPlanGroup {
  tier: DemoPlanTier;
  eyebrow: string;
  badge: string;
  badgeColor: string;
  title: string;
  summary: string;
  icon: string;
  avatarColor: string;
  actionColor: string;
  accentTextClass: string;
  features: string[];
  durationOffers: DemoOffer[];
  usageOffers: DemoOffer[];
}

export const demoHeroHighlights = [
  '双层套餐覆盖',
  '周期选择清晰',
  '权益边界明确',
];

export const demoPlanComparisonRows = [
  { label: '检测方式', basic: '3 种', premium: '5 种' },
  { label: 'AI 医疗助手', basic: '包含', premium: '增强版' },
  { label: '随访管理', basic: '不含', premium: '完整闭环' },
  { label: '患者小程序', basic: '不含', premium: '即将开放 / 可定制接入' },
  { label: '报告形式', basic: '完整 PDF', premium: '多格式完整报告' },
  { label: '自定义水印', basic: '不含', premium: '包含' },
];

export const demoSubscriptionCatalog: Record<DemoPlanTier, DemoPlanGroup> = {
  basic: {
    tier: 'basic',
    eyebrow: '基础层级',
    badge: '院内通用',
    badgeColor: 'primary',
    title: '基础套餐',
    summary: '覆盖核心三种检测方式，适合门诊筛查、常规阅片与标准报告交付。',
    icon: 'biotech',
    avatarColor: 'primary',
    actionColor: 'primary',
    accentTextClass: 'text-primary',
    features: [
      '巴氏染色涂片',
      '液基细胞学',
      '宫颈活检切片',
      'AI 医疗助手',
      '完整 PDF 报告',
    ],
    durationOffers: [
      {
        code: 'basic-monthly-auto',
        tier: 'basic',
        billingMode: 'duration',
        durationDays: 30,
        amount: 888,
        planName: '基础套餐连续包月',
        label: '连续包月',
        description: '适合持续开展科室日常筛查。',
        unitLabel: '月',
        billingLabel: '连续包月',
        badge: '推荐档位',
        autoRenewHint: '到期自动续费',
        statusCard: {
          title: '基础套餐已激活',
          subtitle: '核心检测能力与标准报告支持已开通。',
          badge: '基础连续包月',
          badgeColor: 'primary',
          icon: 'verified',
          color: 'primary',
          planName: '基础套餐连续包月',
          tierLabel: '基础套餐',
          quotaLabel: '套餐权益',
          remainingCount: '30天完整使用权益',
          featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
          renewalNote: '到期自动续费',
        },
        featureSummary: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
      },
      {
        code: 'basic-monthly',
        tier: 'basic',
        billingMode: 'duration',
        durationDays: 30,
        amount: 980,
        planName: '基础套餐一月版',
        label: '一月',
        description: '适合短周期部署、培训或科室试运行。',
        unitLabel: '月',
        billingLabel: '一月版',
        badge: '短期方案',
        statusCard: {
          title: '基础套餐已启用',
          subtitle: '30天基础套餐权益已生效。',
          badge: '基础一月版',
          badgeColor: 'primary',
          icon: 'task_alt',
          color: 'primary',
          planName: '基础套餐一月版',
          tierLabel: '基础套餐',
          quotaLabel: '套餐权益',
          remainingCount: '30天完整使用权益',
          featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
        },
        featureSummary: ['30天完整使用权益', '三种检测方式', '完整 PDF 报告'],
      },
      {
        code: 'basic-half-year',
        tier: 'basic',
        billingMode: 'duration',
        durationDays: 180,
        amount: 5199,
        originalAmount: 5880,
        planName: '基础套餐半年版',
        label: '半年',
        description: '适合阶段性项目开展与中期稳定使用。',
        unitLabel: '半年',
        billingLabel: '半年版',
        badge: '省 ¥681',
        statusCard: {
          title: '基础半年版已激活',
          subtitle: '半年周期权益与报告支持已开通。',
          badge: '基础半年版',
          badgeColor: 'primary',
          icon: 'calendar_month',
          color: 'primary',
          planName: '基础套餐半年版',
          tierLabel: '基础套餐',
          quotaLabel: '套餐权益',
          remainingCount: '180天完整使用权益',
          featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
        },
        featureSummary: ['180天完整使用权益', '基础三种检测方式', '标准 PDF 报告'],
      },
      {
        code: 'basic-yearly',
        tier: 'basic',
        billingMode: 'duration',
        durationDays: 365,
        amount: 9888,
        originalAmount: 11760,
        planName: '基础套餐一年版',
        label: '一年',
        description: '适合年度常规筛查与持续稳定使用。',
        unitLabel: '年',
        billingLabel: '一年版',
        badge: '省 ¥1872',
        statusCard: {
          title: '基础一年版已激活',
          subtitle: '全年基础套餐权益已开通。',
          badge: '基础一年版',
          badgeColor: 'primary',
          icon: 'workspace_premium',
          color: 'primary',
          planName: '基础套餐一年版',
          tierLabel: '基础套餐',
          quotaLabel: '套餐权益',
          remainingCount: '365天完整使用权益',
          featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
        },
        featureSummary: ['365天完整使用权益', '基础三种检测方式', '标准 PDF 报告'],
      },
    ],
    usageOffers: [
      {
        code: 'basic-formal-once',
        tier: 'basic',
        billingMode: 'usage',
        amount: 29.9,
        planName: '基础套餐单次版',
        label: '一次正式',
        description: '适合低频按次使用，按单次需求灵活开通。',
        unitLabel: '次',
        billingLabel: '单次正式',
        badge: '单次闭环',
        statusCard: {
          title: '基础单次版已激活',
          subtitle: '单次正式权益已开通。',
          badge: '基础单次版',
          badgeColor: 'teal',
          icon: 'payments',
          color: 'teal',
          planName: '基础套餐单次版',
          tierLabel: '基础套餐',
          quotaLabel: '剩余次数',
          remainingCount: '1次',
          featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
        },
        featureSummary: ['单次正式权益', '基础三种检测方式', '完整 PDF 报告'],
      },
    ],
  },
  premium: {
    tier: 'premium',
    eyebrow: '高阶层级',
    badge: '旗舰方案',
    badgeColor: 'deep-orange',
    title: '顶级套餐',
    summary: '面向高阶机构场景，补齐随访管理、多格式报告、小程序与自定义水印。',
    icon: 'local_hospital',
    avatarColor: 'deep-orange',
    actionColor: 'deep-orange',
    accentTextClass: 'text-deep-orange',
    features: [
      '基础三种检测方式',
      'HPV 分型检测图像',
      'p16/Ki67 双染图像',
      '随访管理',
      '多格式完整报告',
      '自定义水印',
    ],
    durationOffers: [
      {
        code: 'premium-monthly-auto',
        tier: 'premium',
        billingMode: 'duration',
        durationDays: 30,
        amount: 999,
        planName: '顶级套餐连续包月',
        label: '连续包月',
        description: '适合高频筛查机构与长期稳定使用。',
        unitLabel: '月',
        billingLabel: '连续包月',
        badge: '主推档位',
        autoRenewHint: '到期自动续费',
        statusCard: {
          title: '顶级套餐已激活',
          subtitle: '高阶检测能力与随访管理支持已开通。',
          badge: '顶级连续包月',
          badgeColor: 'deep-orange',
          icon: 'workspace_premium',
          color: 'deep-orange',
          planName: '顶级套餐连续包月',
          tierLabel: '顶级套餐',
          quotaLabel: '套餐权益',
          remainingCount: '30天完整使用权益',
          featureTags: ['五种检测方式', '随访管理', '多格式报告', '自定义水印'],
          renewalNote: '到期自动续费',
        },
        featureSummary: ['五种检测方式', '随访管理', '多格式完整报告', '自定义水印'],
      },
      {
        code: 'premium-monthly',
        tier: 'premium',
        billingMode: 'duration',
        durationDays: 30,
        amount: 1280,
        planName: '顶级套餐一月版',
        label: '一月',
        description: '适合短周期启用高阶检测与扩展管理能力。',
        unitLabel: '月',
        billingLabel: '一月版',
        badge: '旗舰入门',
        statusCard: {
          title: '顶级套餐一月版已启用',
          subtitle: '30天顶级套餐权益已生效。',
          badge: '顶级一月版',
          badgeColor: 'deep-orange',
          icon: 'star',
          color: 'deep-orange',
          planName: '顶级套餐一月版',
          tierLabel: '顶级套餐',
          quotaLabel: '套餐权益',
          remainingCount: '30天完整使用权益',
          featureTags: ['五种检测方式', '随访管理', '多格式报告', '自定义水印'],
        },
        featureSummary: ['30天完整使用权益', '随访管理', '多格式完整报告', '自定义水印'],
      },
      {
        code: 'premium-half-year',
        tier: 'premium',
        billingMode: 'duration',
        durationDays: 180,
        amount: 6699,
        originalAmount: 7680,
        planName: '顶级套餐半年版',
        label: '半年',
        description: '适合多科室协同与中长期高阶筛查场景。',
        unitLabel: '半年',
        billingLabel: '半年版',
        badge: '省 ¥981',
        statusCard: {
          title: '顶级半年版已激活',
          subtitle: '半年高阶权益、随访与报告支持已开通。',
          badge: '顶级半年版',
          badgeColor: 'deep-orange',
          icon: 'event_available',
          color: 'deep-orange',
          planName: '顶级套餐半年版',
          tierLabel: '顶级套餐',
          quotaLabel: '套餐权益',
          remainingCount: '180天完整使用权益',
          featureTags: ['五种检测方式', '随访管理', '多格式报告', '自定义水印'],
        },
        featureSummary: ['180天完整使用权益', '五种检测方式', '随访管理', '多格式完整报告'],
      },
      {
        code: 'premium-yearly',
        tier: 'premium',
        billingMode: 'duration',
        durationDays: 365,
        amount: 12699,
        originalAmount: 13398,
        planName: '顶级套餐一年版',
        label: '一年',
        description: '适合年度合作与长期高阶筛查服务。',
        unitLabel: '年',
        billingLabel: '一年版',
        badge: '省 ¥699',
        statusCard: {
          title: '顶级一年版已激活',
          subtitle: '全年顶级套餐权益已开通。',
          badge: '顶级一年版',
          badgeColor: 'deep-orange',
          icon: 'workspace_premium',
          color: 'deep-orange',
          planName: '顶级套餐一年版',
          tierLabel: '顶级套餐',
          quotaLabel: '套餐权益',
          remainingCount: '365天完整使用权益',
          featureTags: ['五种检测方式', '随访管理', '多格式报告', '自定义水印'],
        },
        featureSummary: ['365天完整使用权益', '五种检测方式', '随访管理', '多格式完整报告'],
      },
    ],
    usageOffers: [],
  },
};
