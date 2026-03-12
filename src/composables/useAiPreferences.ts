import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  createDefaultAiConfig,
  createDefaultPreferences,
  HEATMAP_COLOR_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  MODEL_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  REPORT_FORMAT_OPTIONS,
  ROI_STYLE_OPTIONS,
} from 'src/constants/preferences';
import { STORAGE_KEYS, getItem, setItem } from 'src/utils/storage';
import type {
  AiConfigState,
  AiPreferencesTab,
  ModelOption,
  UserPreferencesState,
} from 'src/types/preferences';

/**
 * 统一管理 AI 配置与用户偏好的默认值、持久化和摘要逻辑。
 */
export function useAiPreferences() {
  const $q = useQuasar();

  const activeTab = ref<AiPreferencesTab>('engine');
  const apiConfig = ref<AiConfigState>(createDefaultAiConfig());
  const preferences = ref<UserPreferencesState>(createDefaultPreferences());

  const activeModel = computed<ModelOption>(() => {
    return (
      MODEL_OPTIONS.find((item) => item.value === apiConfig.value.model) || MODEL_OPTIONS[0]!
    );
  });

  const activeModelLabel = computed(() => activeModel.value.label);
  const activeModelDescription = computed(() => activeModel.value.description);

  const overviewCards = computed(() => [
    {
      label: '当前模型',
      value: activeModelLabel.value.replace(' (推荐)', ''),
      description: activeModelDescription.value,
    },
    {
      label: '通知状态',
      value: preferences.value.notifications.enable ? '已启用' : '已关闭',
      description: `${preferences.value.notifications.channels.length} 个通道`,
    },
    {
      label: '默认导出',
      value: preferences.value.reports.defaultFormat.label,
      description: '报告格式与存档策略',
    },
    {
      label: '账单提醒',
      value: preferences.value.billing.lowBalanceAlert ? '开启' : '关闭',
      description: `阈值 ¥${preferences.value.billing.threshold}`,
    },
  ]);

  const securitySummary = computed(() => {
    const desensitization = preferences.value.privacy.desensitization
      ? '已启用脱敏导出'
      : '未启用脱敏导出';
    const mfa = preferences.value.privacy.mfa
      ? '敏感操作需要二次验证'
      : '敏感操作当前为单步确认';
    return `${desensitization}，${mfa}。`;
  });

  const billingSummary = computed(() => {
    if (!preferences.value.billing.lowBalanceAlert) {
      return preferences.value.billing.autoRenewal
        ? '已开启自动续费，当前关闭余额预警。'
        : '当前关闭自动续费与余额预警，适合人工管控账单。';
    }

    return `余额低于 ¥${preferences.value.billing.threshold} 时提醒${
      preferences.value.billing.autoRenewal ? '，并保持自动续费开启。' : '，当前自动续费关闭。'
    }`;
  });

  const saveAIConfig = () => {
    setItem(STORAGE_KEYS.AI_CONFIG, apiConfig.value);
    $q.notify({
      type: 'positive',
      message: 'AI引擎配置已保存',
      position: 'top',
      icon: 'check_circle',
    });
  };

  const resetAIConfig = () => {
    apiConfig.value = createDefaultAiConfig();
    $q.notify({
      type: 'info',
      message: '已恢复默认引擎配置',
      position: 'top',
    });
  };

  const savePreferences = () => {
    setItem(STORAGE_KEYS.USER_PREFERENCES, preferences.value);
    $q.notify({
      type: 'positive',
      message: '服务偏好设置已保存',
      position: 'top',
      icon: 'check_circle',
    });
  };

  const resetPreferences = () => {
    preferences.value = createDefaultPreferences();
    $q.notify({
      type: 'info',
      message: '已恢复默认偏好设置',
      position: 'top',
    });
  };

  const loadSavedConfig = () => {
    const savedAIConfig = getItem<Partial<AiConfigState>>(STORAGE_KEYS.AI_CONFIG);
    if (savedAIConfig && typeof savedAIConfig === 'object') {
      apiConfig.value = { ...createDefaultAiConfig(), ...savedAIConfig };
    }

    const savedPreferences = getItem<Partial<UserPreferencesState>>(STORAGE_KEYS.USER_PREFERENCES);
    if (savedPreferences && typeof savedPreferences === 'object') {
      preferences.value = {
        ...createDefaultPreferences(),
        ...savedPreferences,
        notifications: {
          ...createDefaultPreferences().notifications,
          ...savedPreferences.notifications,
        },
        analysis: {
          ...createDefaultPreferences().analysis,
          ...savedPreferences.analysis,
        },
        reports: {
          ...createDefaultPreferences().reports,
          ...savedPreferences.reports,
        },
        privacy: {
          ...createDefaultPreferences().privacy,
          ...savedPreferences.privacy,
        },
        billing: {
          ...createDefaultPreferences().billing,
          ...savedPreferences.billing,
        },
      };
    }
  };

  onMounted(() => {
    loadSavedConfig();
  });

  return {
    activeModelDescription,
    activeModelLabel,
    activeTab,
    apiConfig,
    billingSummary,
    heatmapColorOptions: HEATMAP_COLOR_OPTIONS,
    imageQualityOptions: IMAGE_QUALITY_OPTIONS,
    modelOptions: MODEL_OPTIONS,
    notificationTypeOptions: NOTIFICATION_TYPE_OPTIONS,
    overviewCards,
    preferences,
    reportFormatOptions: REPORT_FORMAT_OPTIONS,
    resetAIConfig,
    resetPreferences,
    roiStyleOptions: ROI_STYLE_OPTIONS,
    saveAIConfig,
    savePreferences,
    securitySummary,
  };
}
