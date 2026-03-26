import { computed, onMounted, onUnmounted, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import {
  paymentAPI,
  userAPI,
  type PaymentCheckData,
  type PaymentGatewayData,
} from 'src/services/api';
import {
  demoHeroHighlights,
  demoPlanComparisonRows,
  demoSubscriptionCatalog,
  type DemoOffer,
  type DemoPlanTier,
} from 'src/constants/demoSubscriptionCatalog';
import {
  SORTED_SOFTWARE_COPYRIGHTS,
  type SoftwareCopyrightItem,
} from 'src/constants/softwareCopyrights';
import { getItem, removeItem, setItem, STORAGE_KEYS } from 'src/utils/storage';

type DemoSubscriptionSource = 'demo' | 'backend' | 'default';
type PaymentDisplayState = 'idle' | 'redirect' | 'scheme' | 'qrcode' | 'success' | 'failed';

interface DemoSubscriptionStatus {
  type: 'trial' | 'active' | 'expired';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badge: string;
  badgeColor: string;
  planName: string;
  tierLabel: string;
  expireDate: string;
  quotaLabel: string;
  remainingCount: string;
  featureTags: string[];
  renewalNote?: string;
  source: DemoSubscriptionSource;
}

interface DemoPaymentInfo {
  planType: string;
  planName: string;
  amount: number;
  icon: string;
  description: string;
  tierLabel: string;
  billingLabel: string;
  featureSummary: string[];
  originalAmount?: number;
  discount?: number;
  discountReason?: string;
  autoRenewHint?: string;
}

interface HeroHighlightItem {
  label: string;
  value: string;
}

interface HeroStatCardItem {
  label: string;
  value: string;
  description: string;
}

interface PendingPaymentState {
  payment: PaymentGatewayData;
  paymentMethod: 'alipay' | 'wxpay' | 'bank';
  paymentInfo: DemoPaymentInfo;
  createdAt: number;
}

const PAYMENT_POLL_INTERVAL_MS = 2500;
const MAX_PAYMENT_POLL_COUNT = 40;
const PENDING_PAYMENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function detectClientDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  if (
    ua.includes('micromessenger') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('mobile')
  ) {
    return 'mobile';
  }
  return 'pc';
}

/**
 * 统一管理订阅页的套餐、支付流程与权益状态。
 */
export function useSubscriptionPlans() {
  const $q = useQuasar();
  const router = useRouter();

  const sortedSoftwareCopyrights = SORTED_SOFTWARE_COPYRIGHTS;
  const heroHighlights: HeroHighlightItem[] = [
    {
      label: demoHeroHighlights[0] ?? '双层套餐覆盖',
      value: '从单次开通到长期合作均可匹配',
    },
    {
      label: demoHeroHighlights[1] ?? '周期选择清晰',
      value: '按次、包月、半年和年度方案一目了然',
    },
    {
      label: demoHeroHighlights[2] ?? '权益边界明确',
      value: '检测方式、报告支持和扩展能力清楚可见',
    },
  ];
  const heroStatCards: HeroStatCardItem[] = [
    {
      label: '机构适配',
      value: '门诊到区域协同',
      description: '基础套餐覆盖常规筛查，顶级套餐适配更高频与协同场景。',
    },
    {
      label: '报告闭环',
      value: '结构化一体交付',
      description: '标准报告与高阶输出能力分层明确，便于按需采购。',
    },
    {
      label: '成本规划',
      value: '周期越长越稳',
      description: '按次试用适合启动阶段，周期套餐更适合固定筛查计划。',
    },
  ];
  const planComparisonRows = demoPlanComparisonRows;
  const demoPlanGroups = [demoSubscriptionCatalog.basic, demoSubscriptionCatalog.premium];

  const previewVisible = ref(false);
  const activeCertificate = ref<SoftwareCopyrightItem | null>(null);
  const activeTier = ref<DemoPlanTier>('premium');
  const selectedOfferByTier = ref<Record<DemoPlanTier, string>>({
    basic: 'basic-monthly-auto',
    premium: 'premium-monthly-auto',
  });

  const showPaymentDialog = ref(false);
  const showUpgradeDialog = ref(false);
  const paymentProcessing = ref(false);
  const paymentChecking = ref(false);
  const stepper = ref<{ next: () => void; previous: () => void } | null>(null);
  const paymentStep = ref(1);
  const selectedPaymentMethod = ref<'alipay' | 'wxpay' | 'bank'>('alipay');
  const agreePaymentTerms = ref(false);
  const showPaymentAgreementDialog = ref(false);
  const paymentAgreementTab = ref<'agreement' | 'privacy'>('agreement');
  const hasDemoOverride = ref(false);
  const currentPaymentOffer = ref<DemoOffer | null>(null);
  const paymentDisplayState = ref<PaymentDisplayState>('idle');
  const paymentGatewayData = ref<PaymentGatewayData | null>(null);
  const paymentGatewayMessage = ref('');
  const paymentGatewayError = ref('');
  const paymentQrCodeDataUrl = ref('');
  const paymentPollCount = ref(0);

  let paymentPollTimer: number | null = null;

  const createDefaultSubscriptionStatus = (): DemoSubscriptionStatus => ({
    type: 'trial',
    title: '当前未开通订阅',
    subtitle: '选择合适套餐后即可启用对应检测能力、报告支持与服务周期。',
    icon: 'verified_user',
    color: 'positive',
    badge: '待开通',
    badgeColor: 'positive',
    planName: '请选择套餐',
    tierLabel: '套餐权益',
    expireDate: '开通后生效',
    quotaLabel: '推荐起步',
    remainingCount: '按次或包月',
    featureTags: ['基础检测能力', '结构化报告支持', '可按机构规模扩展'],
    source: 'default',
  });

  const createEmptyPaymentInfo = (): DemoPaymentInfo => ({
    planType: '',
    planName: '',
    amount: 0,
    icon: 'workspace_premium',
    description: '',
    tierLabel: '',
    billingLabel: '',
    featureSummary: [],
  });

  const subscriptionStatus = ref<DemoSubscriptionStatus>(createDefaultSubscriptionStatus());
  const paymentInfo = ref<DemoPaymentInfo>(createEmptyPaymentInfo());

  const paymentMethods = [
    {
      value: 'alipay',
      label: '支付宝',
      description: '适合移动端与日常快捷支付场景',
      icon: 'account_balance_wallet',
      color: 'blue',
    },
    {
      value: 'wxpay',
      label: '微信支付',
      description: '适合院内移动端与微信生态支付场景',
      icon: 'chat',
      color: 'green',
    },
    {
      value: 'bank',
      label: '银行卡支付',
      description: '适合对公结算与常规银行卡支付场景',
      icon: 'credit_card',
      color: 'orange',
    },
  ] as const;

  const currentPaymentMethodLabel = computed(
    () => paymentMethods.find((method) => method.value === selectedPaymentMethod.value)?.label || '',
  );

  const paymentQrCodeTitle = computed(() => {
    switch (selectedPaymentMethod.value) {
      case 'alipay':
        return '支付宝扫码支付';
      case 'wxpay':
        return '微信扫码支付';
      default:
        return '扫码支付';
    }
  });

  const paymentQrCodeHint = computed(() => {
    switch (selectedPaymentMethod.value) {
      case 'alipay':
        return '请使用支付宝扫一扫完成支付，支付成功后系统将自动跳转结果页。';
      case 'wxpay':
        return '请使用微信扫一扫完成支付，支付成功后系统将自动跳转结果页。';
      default:
        return '请使用对应支付应用扫码完成支付，支付成功后系统将自动跳转结果页。';
    }
  });

  const paymentStepThreeIcon = computed(() => {
    switch (paymentDisplayState.value) {
      case 'qrcode':
        return 'qr_code_2';
      case 'scheme':
        return 'phone_iphone';
      case 'redirect':
        return 'open_in_new';
      case 'failed':
        return 'warning';
      case 'success':
        return 'task_alt';
      default:
        return 'payment';
    }
  });

  const paymentStepThreeIconColor = computed(() => {
    switch (paymentDisplayState.value) {
      case 'failed':
        return 'negative';
      case 'qrcode':
        return 'positive';
      case 'success':
        return 'positive';
      default:
        return 'primary';
    }
  });

  const paymentStepThreeTitle = computed(() => {
    switch (paymentDisplayState.value) {
      case 'qrcode':
        return '请完成扫码支付';
      case 'scheme':
        return '正在唤起支付';
      case 'redirect':
        return '正在前往支付页面';
      case 'success':
        return '支付已完成';
      case 'failed':
        return '支付发起失败';
      default:
        return '等待支付确认';
    }
  });

  const paymentStepThreeSubtitle = computed(() => {
    if (paymentGatewayError.value) {
      return paymentGatewayError.value;
    }
    if (paymentGatewayMessage.value) {
      return paymentGatewayMessage.value;
    }
    return '支付完成后系统会自动刷新订单状态。';
  });

  const paymentActionUrl = computed(() => {
    if (!paymentGatewayData.value) return '';
    return paymentGatewayData.value.payurl || paymentGatewayData.value.urlscheme || '';
  });

  const paymentPrimaryActionLabel = computed(() => {
    switch (paymentDisplayState.value) {
      case 'redirect':
        return '立即打开支付页面';
      case 'scheme':
        return '重新唤起支付';
      default:
        return '';
    }
  });

  const getTierOffers = (tier: DemoPlanTier): DemoOffer[] => {
    const group = demoSubscriptionCatalog[tier];
    return [...group.durationOffers, ...group.usageOffers];
  };

  const getSelectedOffer = (tier: DemoPlanTier): DemoOffer => {
    const offers = getTierOffers(tier);
    if (!offers.length) {
      throw new Error(`未配置订阅套餐：${tier}`);
    }

    return offers.find((offer) => offer.code === selectedOfferByTier.value[tier]) ?? offers[0]!;
  };

  const currentHeroOffer = computed(() => getSelectedOffer(activeTier.value));
  const currentHeroGroup = computed(() => demoSubscriptionCatalog[activeTier.value]);
  const currentHeroBullets = computed(() => {
    const offer = currentHeroOffer.value;

    return [
      `${currentHeroGroup.value.badge}适配`,
      `覆盖 ${offer.featureSummary.length} 项核心权益`,
      getOfferSupportText(offer),
    ];
  });

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return '0';

    const digits = Number.isInteger(amount) ? 0 : 1;
    return amount.toLocaleString('zh-CN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const getOfferSavings = (offer: DemoOffer): number => {
    if (!offer.originalAmount) return 0;
    return Number((offer.originalAmount - offer.amount).toFixed(1));
  };

  const getOfferSavingsText = (offer: DemoOffer): string => {
    const savings = getOfferSavings(offer);
    if (savings > 0) {
      return `省 ¥${formatCurrency(savings)}`;
    }

    return offer.billingMode === 'usage' ? '单次开通' : '标准定价';
  };

  const getOfferSupportText = (offer: DemoOffer): string => {
    if (offer.billingMode === 'usage') {
      return offer.amount < 1 ? '适合首次试用或短期体验' : '适合低频按次使用';
    }

    if (offer.autoRenewHint) {
      return '适合长期稳定使用';
    }

    return offer.durationDays ? `适合 ${offer.durationDays} 天周期使用` : '适合阶段性使用';
  };

  const getOfferCompactDescription = (offer: DemoOffer): string => {
    if (offer.billingMode === 'usage') {
      return offer.amount < 1 ? '适合先行试用基础能力。' : '适合按需开通正式单次服务。';
    }

    if (offer.durationDays) {
      return `适合 ${offer.durationDays} 天周期使用与稳定筛查。`;
    }

    return offer.description;
  };

  const getOfferCycleText = (offer: DemoOffer | null): string => {
    if (!offer) return '-';
    if (offer.billingMode === 'usage') return '按次开通';
    if (offer.durationDays) return `${offer.durationDays}天`;
    return offer.billingLabel;
  };

  const getActionLabel = (tier: DemoPlanTier): string => {
    const selectedOffer = getSelectedOffer(tier);
    if (selectedOffer.billingMode === 'usage') {
      return selectedOffer.amount < 1 ? '立即开通试用' : '购买单次版';
    }

    return tier === 'premium' ? '选择顶级套餐' : '选择基础套餐';
  };

  const selectOffer = (tier: DemoPlanTier, offerCode: string): void => {
    selectedOfferByTier.value = {
      ...selectedOfferByTier.value,
      [tier]: offerCode,
    };
    activeTier.value = tier;
  };

  const buildPaymentInfo = (offer: DemoOffer): DemoPaymentInfo => {
    const info: DemoPaymentInfo = {
      planType: offer.code,
      planName: offer.planName,
      amount: offer.amount,
      icon: offer.statusCard.icon,
      description: offer.description,
      tierLabel: offer.statusCard.tierLabel,
      billingLabel: offer.billingLabel,
      featureSummary: offer.featureSummary,
    };

    if (offer.originalAmount) {
      info.originalAmount = offer.originalAmount;
      const discount = Number((offer.originalAmount - offer.amount).toFixed(1));
      if (discount > 0) {
        info.discount = discount;
        info.discountReason = '对比原价节省';
      }
    }

    if (offer.autoRenewHint) {
      info.autoRenewHint = offer.autoRenewHint;
    }

    return info;
  };

  const buildDemoStatusFromOffer = (offer: DemoOffer): DemoSubscriptionStatus => {
    const expireDate =
      offer.billingMode === 'duration' && offer.durationDays
        ? date.formatDate(
            new Date(Date.now() + offer.durationDays * 24 * 60 * 60 * 1000),
            'YYYY-MM-DD',
          )
        : '单次有效';

    const status: DemoSubscriptionStatus = {
      type: 'active',
      title: offer.statusCard.title,
      subtitle: offer.statusCard.subtitle,
      icon: offer.statusCard.icon,
      color: offer.statusCard.color,
      badge: offer.statusCard.badge,
      badgeColor: offer.statusCard.badgeColor,
      planName: offer.statusCard.planName,
      tierLabel: offer.statusCard.tierLabel,
      expireDate,
      quotaLabel: offer.statusCard.quotaLabel,
      remainingCount: offer.statusCard.remainingCount,
      featureTags: offer.statusCard.featureTags,
      source: 'demo',
    };

    if (offer.statusCard.renewalNote) {
      status.renewalNote = offer.statusCard.renewalNote;
    }

    return status;
  };

  const isDemoSubscriptionStatus = (value: unknown): value is DemoSubscriptionStatus => {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.title === 'string' &&
      typeof candidate.subtitle === 'string' &&
      typeof candidate.icon === 'string' &&
      typeof candidate.color === 'string' &&
      typeof candidate.badge === 'string' &&
      typeof candidate.badgeColor === 'string' &&
      typeof candidate.planName === 'string' &&
      typeof candidate.tierLabel === 'string' &&
      typeof candidate.expireDate === 'string' &&
      typeof candidate.quotaLabel === 'string' &&
      typeof candidate.remainingCount === 'string' &&
      Array.isArray(candidate.featureTags) &&
      typeof candidate.source === 'string'
    );
  };

  const readDemoSubscriptionState = (): DemoSubscriptionStatus | null => {
    const savedState = getItem<DemoSubscriptionStatus>(STORAGE_KEYS.DEMO_SUBSCRIPTION_STATE);
    return isDemoSubscriptionStatus(savedState) ? savedState : null;
  };

  const readPendingPaymentState = (): PendingPaymentState | null => {
    const savedState = getItem<PendingPaymentState>(
      STORAGE_KEYS.PENDING_PAYMENT_STATE,
      null,
      'session',
    );

    if (!savedState || typeof savedState !== 'object') {
      return null;
    }

    if (Date.now() - Number(savedState.createdAt || 0) > PENDING_PAYMENT_MAX_AGE_MS) {
      removeItem(STORAGE_KEYS.PENDING_PAYMENT_STATE, 'session');
      return null;
    }

    return savedState;
  };

  const persistPendingPaymentState = (payment: PaymentGatewayData) => {
    if (!currentPaymentOffer.value) return;

    setItem(
      STORAGE_KEYS.PENDING_PAYMENT_STATE,
      {
        payment,
        paymentMethod: selectedPaymentMethod.value,
        paymentInfo: paymentInfo.value,
        createdAt: Date.now(),
      } satisfies PendingPaymentState,
      'session',
    );
  };

  const clearPendingPaymentState = () => {
    removeItem(STORAGE_KEYS.PENDING_PAYMENT_STATE, 'session');
  };

  const createBackendFallbackStatus = (user: {
    subscription_type?: string;
    subscription_expires_at?: string;
    remaining_credits?: number;
  }): DemoSubscriptionStatus | null => {
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const hasActiveSubscription =
      Boolean(user.subscription_type && user.subscription_type !== 'none') &&
      expiresAt !== null &&
      expiresAt >= now;
    const remainingCredits = user.remaining_credits || 0;

    if (!hasActiveSubscription && remainingCredits <= 0) {
      return null;
    }

    return {
      type: 'active',
      title: '账号已有开通权益',
      subtitle: '当前展示为账号现有套餐信息，可继续按需升级或续费。',
      icon: hasActiveSubscription ? 'shield' : 'payments',
      color: hasActiveSubscription ? 'secondary' : 'primary',
      badge: hasActiveSubscription ? '已开通' : '按次权益',
      badgeColor: hasActiveSubscription ? 'secondary' : 'primary',
      planName: hasActiveSubscription ? '当前账号订阅' : '当前账号按次权益',
      tierLabel: '账号权益',
      expireDate: expiresAt ? date.formatDate(expiresAt, 'YYYY-MM-DD') : '按账号权益',
      quotaLabel: '可用次数',
      remainingCount: remainingCredits > 0 ? `${remainingCredits}次` : '以账号权益为准',
      featureTags: ['以当前账号权益为准', '支持继续升级套餐', '到期前可按需续费'],
      source: 'backend',
    };
  };

  const clearPaymentPolling = () => {
    if (paymentPollTimer) {
      window.clearInterval(paymentPollTimer);
      paymentPollTimer = null;
    }
    paymentPollCount.value = 0;
  };

  const resetPaymentGatewayState = () => {
    clearPaymentPolling();
    clearPendingPaymentState();
    paymentDisplayState.value = 'idle';
    paymentGatewayData.value = null;
    paymentGatewayMessage.value = '';
    paymentGatewayError.value = '';
    paymentQrCodeDataUrl.value = '';
    paymentChecking.value = false;
  };

  const openCertificatePreview = (certificate: SoftwareCopyrightItem): void => {
    if (!certificate.imageUrl) {
      $q.notify({
        type: 'info',
        message: '证书图片待补充',
        position: 'top',
        timeout: 1200,
      });
      return;
    }

    activeCertificate.value = certificate;
    previewVisible.value = true;
  };

  const resetCertificatePreview = (): void => {
    previewVisible.value = false;
    activeCertificate.value = null;
  };

  const showPaymentAgreement = (tab: 'agreement' | 'privacy') => {
    paymentAgreementTab.value = tab;
    showPaymentAgreementDialog.value = true;
  };

  const openPaymentDialog = (offer: DemoOffer): void => {
    resetPaymentGatewayState();
    activeTier.value = offer.tier;
    currentPaymentOffer.value = offer;
    paymentInfo.value = buildPaymentInfo(offer);
    paymentStep.value = 1;
    selectedPaymentMethod.value = 'alipay';
    agreePaymentTerms.value = false;
    showUpgradeDialog.value = false;
    showPaymentDialog.value = true;
  };

  const handleUpgrade = (tier: DemoPlanTier): void => {
    openPaymentDialog(getSelectedOffer(tier));
  };

  const resetPaymentFlow = (): void => {
    resetPaymentGatewayState();
    showPaymentDialog.value = false;
    paymentStep.value = 1;
    paymentProcessing.value = false;
    selectedPaymentMethod.value = 'alipay';
    agreePaymentTerms.value = false;
    currentPaymentOffer.value = null;
    paymentInfo.value = createEmptyPaymentInfo();
  };

  const cancelPayment = (): void => {
    resetPaymentFlow();
  };

  const finishDemoPayment = (): void => {
    resetPaymentFlow();
  };

  const openPaymentGateway = () => {
    const actionUrl = paymentActionUrl.value;
    if (!actionUrl) {
      paymentGatewayError.value = '当前未获取到可用的支付地址，请稍后重试。';
      return;
    }

    window.location.assign(actionUrl);
  };

  const copyPaymentLink = async () => {
    const content =
      paymentGatewayData.value?.qrcode ||
      paymentGatewayData.value?.payurl ||
      paymentGatewayData.value?.urlscheme ||
      '';

    if (!content) {
      $q.notify({
        type: 'warning',
        message: '当前没有可复制的支付地址',
        position: 'top',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      $q.notify({
        type: 'positive',
        message: '支付链接已复制',
        caption: '可发送到微信或其他设备继续支付',
        position: 'top',
      });
    } catch (error) {
      console.error('复制支付链接失败:', error);
      $q.notify({
        type: 'negative',
        message: '复制支付链接失败，请稍后重试',
        position: 'top',
      });
    }
  };

  const handlePaymentSuccess = async (order: PaymentCheckData) => {
    clearPaymentPolling();
    clearPendingPaymentState();
    paymentProcessing.value = false;
    paymentChecking.value = false;

    try {
      await loadUserSubscription();
    } catch (error) {
      console.error('刷新订阅状态失败:', error);
    }

    $q.notify({
      type: 'positive',
      message: `${order.name} 支付成功`,
      caption: '套餐权益已更新',
      position: 'top',
      icon: 'task_alt',
    });

    resetPaymentFlow();
    void router.push({
      name: 'payment-result',
      query: { out_trade_no: order.out_trade_no },
    });
  };

  const queryPaymentStatus = async (silent = false) => {
    const outTradeNo = paymentGatewayData.value?.outTradeNo;
    if (!outTradeNo) return;

    if (!silent) {
      paymentChecking.value = true;
    }

    try {
      const response = await paymentAPI.checkOrderStatus(outTradeNo);
      const result = response.data;
      const order = result.data;

      if (result.success && order?.status === 'paid') {
        await handlePaymentSuccess(order);
        return;
      }

      if (!silent) {
        paymentGatewayError.value = order?.status === 'paid' ? '' : '订单尚未完成支付，请稍后再试。';
      }
    } catch (error) {
      console.error('查询支付状态失败:', error);
      if (!silent) {
        paymentGatewayError.value = '暂时无法确认支付结果，请稍后刷新。';
      }
    } finally {
      if (!silent) {
        paymentChecking.value = false;
      }
    }
  };

  const refreshPaymentStatus = async () => {
    await queryPaymentStatus(false);
  };

  const refreshPaymentStatusSilently = async () => {
    if (!paymentGatewayData.value) return;
    await queryPaymentStatus(true);
  };

  const handleFocusRefresh = () => {
    if (!paymentGatewayData.value || paymentDisplayState.value === 'success') return;
    void refreshPaymentStatusSilently();
  };

  const handleVisibilityRefresh = () => {
    if (document.visibilityState === 'visible') {
      handleFocusRefresh();
    }
  };

  const startPaymentPolling = () => {
    clearPaymentPolling();
    void refreshPaymentStatusSilently();
    paymentPollTimer = window.setInterval(() => {
      paymentPollCount.value += 1;
      if (paymentPollCount.value > MAX_PAYMENT_POLL_COUNT) {
        clearPaymentPolling();
        paymentGatewayError.value = '等待支付确认超时，请在完成支付后点击手动刷新。';
        return;
      }

      void queryPaymentStatus(true);
    }, PAYMENT_POLL_INTERVAL_MS);
  };

  const prepareQrCode = async (content: string) => {
    paymentQrCodeDataUrl.value = await QRCode.toDataURL(content, {
      width: 280,
      margin: 1,
      color: {
        dark: '#144768',
        light: '#ffffff',
      },
    });
  };

  const handleRemotePayment = async (payment: PaymentGatewayData) => {
    paymentGatewayData.value = payment;
    persistPendingPaymentState(payment);
    paymentStep.value = 3;
    paymentGatewayError.value = '';

    switch (payment.displayMode) {
      case 'qrcode':
        paymentDisplayState.value = 'qrcode';
        paymentGatewayMessage.value =
          selectedPaymentMethod.value === 'alipay'
            ? '请使用支付宝扫一扫完成支付，支付成功后系统会自动刷新状态。'
            : selectedPaymentMethod.value === 'wxpay'
              ? '请使用微信扫一扫完成支付，支付成功后系统会自动刷新状态。'
              : '请使用对应支付应用扫码完成支付，支付成功后系统会自动刷新状态。';
        await prepareQrCode(payment.qrcode || '');
        startPaymentPolling();
        break;
      case 'scheme':
        paymentDisplayState.value = 'scheme';
        paymentGatewayMessage.value = '正在尝试唤起支付应用，如未自动打开，可点击下方按钮重试。';
        startPaymentPolling();
        openPaymentGateway();
        break;
      case 'redirect':
        paymentDisplayState.value = 'redirect';
        paymentGatewayMessage.value = '正在前往支付页面，如页面未自动跳转，可点击下方按钮继续支付。';
        startPaymentPolling();
        openPaymentGateway();
        break;
      default:
        paymentDisplayState.value = 'failed';
        paymentGatewayError.value = '支付网关未返回可用的支付方式，请稍后重试。';
        break;
    }
  };

  const processDemoBankPayment = async (offer: DemoOffer) => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 900);
    });

    const nextStatus = buildDemoStatusFromOffer(offer);
    subscriptionStatus.value = nextStatus;
    hasDemoOverride.value = true;
    setItem(STORAGE_KEYS.DEMO_SUBSCRIPTION_STATE, nextStatus);
    paymentStep.value = 3;
    paymentDisplayState.value = 'success';
    paymentGatewayMessage.value = '当前为演示模式，已直接模拟支付成功，可关闭窗口继续查看套餐权益。';

    $q.notify({
      type: 'positive',
      message: `${nextStatus.planName} 支付完成`,
      caption: '套餐权益已更新',
      position: 'top',
      icon: 'task_alt',
    });
  };

  const processPayment = async (): Promise<void> => {
    if (!currentPaymentOffer.value) {
      $q.notify({
        type: 'negative',
        message: '当前未选择套餐',
        position: 'top',
      });
      return;
    }

    paymentProcessing.value = true;
    paymentGatewayError.value = '';

    try {
      if (selectedPaymentMethod.value === 'bank') {
        await processDemoBankPayment(currentPaymentOffer.value);
        return;
      }

      const response = await paymentAPI.createOrder(
        currentPaymentOffer.value.code,
        selectedPaymentMethod.value,
        {
          device: detectClientDevice(),
        },
      );

      const payload = response.data.data;
      if (!payload?.payment) {
        throw new Error('下单成功，但未获取到支付指引');
      }

      await handleRemotePayment(payload.payment);
    } catch (error) {
      console.error('创建支付订单失败:', error);
      paymentDisplayState.value = 'failed';
      paymentStep.value = 3;
      paymentGatewayMessage.value = '';
      paymentGatewayError.value =
        error instanceof Error ? error.message : '支付创建失败，请稍后重试。';
    } finally {
      paymentProcessing.value = false;
    }
  };

  const loadUserSubscription = async (): Promise<void> => {
    if (hasDemoOverride.value) return;

    try {
      const response = await userAPI.getProfile();
      if (hasDemoOverride.value) return;

      const backendStatus = createBackendFallbackStatus(response.data.user);
      subscriptionStatus.value = backendStatus ?? createDefaultSubscriptionStatus();
    } catch (error) {
      if (!hasDemoOverride.value) {
        subscriptionStatus.value = createDefaultSubscriptionStatus();
      }
      console.error('获取用户权益失败:', error);
    }
  };

  onMounted(() => {
    const savedDemoState = readDemoSubscriptionState();
    if (savedDemoState) {
      subscriptionStatus.value = savedDemoState;
      hasDemoOverride.value = true;
    } else {
      void loadUserSubscription();
    }

    const pendingPaymentState = readPendingPaymentState();
    if (pendingPaymentState) {
      selectedPaymentMethod.value = pendingPaymentState.paymentMethod;
      paymentInfo.value = pendingPaymentState.paymentInfo;
      paymentGatewayData.value = pendingPaymentState.payment;
      paymentStep.value = 3;
      showPaymentDialog.value = true;

      switch (pendingPaymentState.payment.displayMode) {
        case 'qrcode':
          paymentDisplayState.value = 'qrcode';
          paymentGatewayMessage.value =
            pendingPaymentState.paymentMethod === 'alipay'
              ? '请使用支付宝扫一扫完成支付，支付成功后系统会自动刷新状态。'
              : pendingPaymentState.paymentMethod === 'wxpay'
                ? '请使用微信扫一扫完成支付，支付成功后系统会自动刷新状态。'
                : '请使用对应支付应用扫码完成支付，支付成功后系统会自动刷新状态。';
          if (pendingPaymentState.payment.qrcode) {
            void prepareQrCode(pendingPaymentState.payment.qrcode);
          }
          startPaymentPolling();
          break;
        case 'scheme':
          paymentDisplayState.value = 'scheme';
          paymentGatewayMessage.value = '正在等待支付结果，返回页面后会自动继续确认。';
          startPaymentPolling();
          break;
        case 'redirect':
          paymentDisplayState.value = 'redirect';
          paymentGatewayMessage.value = '正在等待支付结果，返回页面后会自动继续确认。';
          startPaymentPolling();
          break;
        default:
          paymentDisplayState.value = 'idle';
          break;
      }
    }

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);
  });

  onUnmounted(() => {
    clearPaymentPolling();
    window.removeEventListener('focus', handleFocusRefresh);
    document.removeEventListener('visibilitychange', handleVisibilityRefresh);
  });

  return {
    activeCertificate,
    activeTier,
    agreePaymentTerms,
    cancelPayment,
    copyPaymentLink,
    currentHeroBullets,
    currentHeroGroup,
    currentHeroOffer,
    currentPaymentMethodLabel,
    currentPaymentOffer,
    demoPlanGroups,
    finishDemoPayment,
    formatCurrency,
    getActionLabel,
    getOfferCompactDescription,
    getOfferCycleText,
    getOfferSavingsText,
    getOfferSupportText,
    getSelectedOffer,
    handleUpgrade,
    heroHighlights,
    heroStatCards,
    openCertificatePreview,
    openPaymentDialog,
    openPaymentGateway,
    paymentActionUrl,
    paymentAgreementTab,
    paymentChecking,
    paymentDisplayState,
    paymentGatewayData,
    paymentGatewayError,
    paymentGatewayMessage,
    paymentInfo,
    paymentMethods,
    paymentPrimaryActionLabel,
    paymentProcessing,
    paymentQrCodeHint,
    paymentQrCodeDataUrl,
    paymentQrCodeTitle,
    paymentStep,
    paymentStepThreeIcon,
    paymentStepThreeIconColor,
    paymentStepThreeSubtitle,
    paymentStepThreeTitle,
    planComparisonRows,
    previewVisible,
    processPayment,
    refreshPaymentStatus,
    resetCertificatePreview,
    resetPaymentFlow,
    selectedOfferByTier,
    selectedPaymentMethod,
    selectOffer,
    showPaymentAgreement,
    showPaymentAgreementDialog,
    showPaymentDialog,
    showUpgradeDialog,
    sortedSoftwareCopyrights,
    stepper,
    subscriptionStatus,
  };
}
