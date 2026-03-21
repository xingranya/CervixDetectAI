<template>
  <q-page class="q-pa-md ai-preferences-page app-gradient-page">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 q-mb-xs">
          <q-icon name="tune" class="q-mr-sm" color="primary" />
          AI与偏好设置
        </div>
        <div class="text-subtitle2 text-grey-7">
          集中管理模型参数、通知策略、报告导出与安全偏好。
        </div>
      </div>
    </div>

    <q-card flat bordered class="preferences-hero q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-lg-8 col-md-7 col-12">
          <div class="preferences-hero__eyebrow">参数中心</div>
          <div class="preferences-hero__title">按模块维护 AI 引擎与服务偏好</div>
          <div class="preferences-hero__summary">
            适用于日常筛查、报告导出和提醒策略调整。
          </div>
        </div>
        <div class="col-lg-4 col-md-5 col-12">
          <div class="row q-col-gutter-sm">
            <div class="col-6" v-for="card in overviewCards" :key="card.label">
              <div class="overview-mini-card">
                <div class="overview-mini-card__label">{{ card.label }}</div>
                <div class="overview-mini-card__value">{{ card.value }}</div>
                <div class="overview-mini-card__desc">{{ card.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-tabs
      v-model="activeTab"
      dense
      class="preferences-tabs app-accent-tabs text-grey q-mb-xs"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="engine" label="AI引擎" icon="psychology" />
      <q-tab name="workflow" label="通知与分析" icon="science" />
      <q-tab name="delivery" label="报告与安全" icon="assignment" />
      <q-tab name="billing" label="账单偏好" icon="account_balance_wallet" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="activeTab" animated class="preferences-panels">
      <q-tab-panel name="engine" class="q-pa-none">
        <q-card flat bordered class="preference-shell-card">
          <q-card-section class="preference-shell-card__section">
            <div class="preference-shell-card__header q-mb-md">
              <div>
                <div class="text-h6">AI引擎配置</div>
                <div class="preference-shell-card__summary">
                  面向不同科室筛查强度，统一维护模型版本、置信度阈值与异常检出敏感性。
                </div>
              </div>
              <div class="row q-gutter-sm">
                <q-btn flat color="grey-7" icon="restart_alt" label="恢复默认" no-caps @click="resetAIConfig" />
                <q-btn unelevated color="primary" icon="save" label="保存引擎配置" no-caps @click="saveAIConfig" />
              </div>
            </div>

            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-lg-4">
                <q-card flat bordered class="config-panel-card">
                  <q-card-section>
                    <div class="text-subtitle2 text-weight-bold q-mb-md">版本选择</div>
                    <q-select
                      v-model="apiConfig.model"
                      outlined
                      label="AI引擎版本"
                      :options="modelOptions"
                      emit-value
                      map-options
                      hint="选择要使用的 CervixDetect AI 引擎版本"
                    >
                      <template v-slot:prepend>
                        <q-icon name="memory" />
                      </template>
                    </q-select>

                    <div class="config-kpi-card q-mt-md">
                      <div class="config-kpi-card__label">当前工作模式</div>
                      <div class="config-kpi-card__value">{{ activeModelLabel }}</div>
                      <div class="config-kpi-card__desc">{{ activeModelDescription }}</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-lg-8">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="config-panel-card">
                      <q-card-section>
                        <div class="config-slider-card__head">
                          <div class="config-slider-card__title">置信度阈值</div>
                          <div class="config-slider-card__value">
                            {{ (apiConfig.confidence * 100).toFixed(0) }}%
                          </div>
                        </div>
                        <q-slider
                          v-model="apiConfig.confidence"
                          :min="0.7"
                          :max="0.95"
                          :step="0.05"
                          label
                          label-always
                          :label-value="'阈值 ' + (apiConfig.confidence * 100).toFixed(0) + '%'"
                          color="primary"
                          class="q-mt-lg"
                        />
                        <div class="text-caption text-grey-6 q-mt-sm">
                          数值越高，AI 输出越保守，更适合复核要求较高的筛查场景。
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="config-panel-card">
                      <q-card-section>
                        <div class="config-slider-card__head">
                          <div class="config-slider-card__title">异常检出敏感性</div>
                          <div class="config-slider-card__value config-slider-card__value--warm">
                            {{ (apiConfig.sensitivity * 100).toFixed(0) }}%
                          </div>
                        </div>
                        <q-slider
                          v-model="apiConfig.sensitivity"
                          :min="0.8"
                          :max="1.0"
                          :step="0.05"
                          label
                          label-always
                          :label-value="'敏感性 ' + (apiConfig.sensitivity * 100).toFixed(0) + '%'"
                          color="orange"
                          class="q-mt-lg"
                        />
                        <div class="text-caption text-grey-6 q-mt-sm">
                          数值越高越偏向异常优先检出，适合高风险病例预警场景。
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="workflow" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-7">
            <q-card flat bordered class="preference-shell-card">
              <q-card-section class="preference-shell-card__section">
                <div class="preference-shell-card__header q-mb-md">
                  <div>
                    <div class="text-h6">智能通知中心</div>
                    <div class="preference-shell-card__summary">
                      按消息通道和接收内容控制站内、邮件与浏览器提醒策略。
                    </div>
                  </div>
                  <q-btn flat round icon="restart_alt" color="grey-7" @click="resetPreferences" aria-label="恢复默认设置">
                    <q-tooltip>恢复默认设置</q-tooltip>
                  </q-btn>
                </div>

                <q-list separator class="rounded-borders bg-grey-1 preference-list-card">
                  <q-item tag="label" v-ripple>
                    <q-item-section>
                      <q-item-label>启用全渠道通知</q-item-label>
                      <q-item-label caption>站内通知、分析完成、异常预警等重要消息</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-toggle v-model="preferences.notifications.enable" color="primary" />
                    </q-item-section>
                  </q-item>

                  <q-slide-transition>
                    <div v-show="preferences.notifications.enable">
                      <q-item>
                        <q-item-section>
                          <q-item-label class="text-caption text-grey-7 q-mb-xs">通知渠道</q-item-label>
                          <div class="q-gutter-sm">
                            <q-checkbox v-model="preferences.notifications.channels" val="in_app" label="站内通知" dense size="sm" />
                            <q-checkbox v-model="preferences.notifications.channels" val="email" label="邮件" dense size="sm" />
                            <q-checkbox v-model="preferences.notifications.channels" val="sms" label="短信" dense size="sm" />
                            <q-checkbox v-model="preferences.notifications.channels" val="browser" label="浏览器推送" dense size="sm" />
                            <q-checkbox v-model="preferences.notifications.channels" val="wechat" label="微信服务号" dense size="sm" />
                          </div>
                        </q-item-section>
                      </q-item>

                      <q-item>
                        <q-item-section>
                          <q-item-label class="text-caption text-grey-7 q-mb-xs">接收内容</q-item-label>
                          <q-select
                            v-model="preferences.notifications.types"
                            multiple
                            filled
                            dense
                            options-dense
                            emit-value
                            map-options
                            :options="notificationTypeOptions"
                            label="选择通知类型"
                          >
                            <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                              <q-item v-bind="itemProps">
                                <q-item-section>
                                  <q-item-label>{{ opt.label }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                  <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                        </q-item-section>
                      </q-item>

                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>免打扰模式</q-item-label>
                          <q-item-label caption>夜间 (22:00 - 08:00) 仅接收紧急预警</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-toggle v-model="preferences.notifications.dndMode" color="indigo" icon="nightlight" />
                        </q-item-section>
                      </q-item>
                    </div>
                  </q-slide-transition>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-5">
            <q-card flat bordered class="preference-shell-card">
              <q-card-section class="preference-shell-card__section">
                <div class="text-h6 q-mb-md">
                  <q-icon name="science" color="primary" class="q-mr-sm" />
                  分析与诊断习惯
                </div>

                <div class="preference-stack">
                  <div class="toggle-info-card">
                    <div>
                      <div class="text-body1 text-weight-medium">上传后自动开始分析</div>
                      <div class="text-caption text-grey-6">适合高频筛查流程，减少人工确认步骤。</div>
                    </div>
                    <q-toggle v-model="preferences.analysis.autoStart" color="primary" />
                  </div>

                  <div class="toggle-info-card">
                    <div>
                      <div class="text-body1 text-weight-medium">启用 AI 第二诊疗意见</div>
                      <div class="text-caption text-grey-6">为复杂病例补充一轮额外解释建议。</div>
                    </div>
                    <q-toggle v-model="preferences.analysis.aiSecondOpinion" color="purple" />
                  </div>

                  <q-card flat bordered class="preference-panel-card">
                    <q-card-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-6">
                          <q-select
                            v-model="preferences.analysis.roiStyle"
                            filled
                            dense
                            options-dense
                            emit-value
                            map-options
                            label="病灶标记样式"
                            :options="roiStyleOptions"
                          />
                        </div>
                        <div class="col-12 col-sm-6">
                          <q-select
                            v-model="preferences.analysis.heatmapColor"
                            filled
                            dense
                            options-dense
                            emit-value
                            map-options
                            label="热力图配色"
                            :options="heatmapColorOptions"
                          />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="delivery" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-7">
            <q-card flat bordered class="preference-shell-card">
              <q-card-section class="preference-shell-card__section">
                <div class="text-h6 q-mb-md">
                  <q-icon name="assignment" color="primary" class="q-mr-sm" />
                  报告与导出配置
                </div>

                <q-list separator class="rounded-borders bg-grey-1 preference-list-card">
                  <q-item>
                    <q-item-section>
                      <q-item-label>自动保存历史记录</q-item-label>
                      <q-item-label caption>生成报告后自动留存导出历史与影像快照</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="preferences.reports.autoSave" color="green" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-6">
                          <q-select
                            v-model="preferences.reports.defaultFormat"
                            filled
                            dense
                            label="默认导出格式"
                            :options="reportFormatOptions"
                          />
                        </div>
                        <div class="col-12 col-sm-6">
                          <q-select
                            v-model="preferences.reports.imageQuality"
                            filled
                            dense
                            label="影像存档质量"
                            :options="imageQualityOptions"
                          />
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model="preferences.reports.watermarkText"
                        filled
                        dense
                        label="自定义报告水印"
                        placeholder="例如: 仅供内部参考"
                      >
                        <template v-slot:append>
                          <q-toggle v-model="preferences.reports.watermark" dense color="teal" />
                        </template>
                      </q-input>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-5">
            <q-card flat bordered class="preference-shell-card">
              <q-card-section class="preference-shell-card__section">
                <div class="text-h6 q-mb-md">
                  <q-icon name="security" color="primary" class="q-mr-sm" />
                  隐私与安全
                </div>

                <div class="preference-stack">
                  <div class="toggle-info-card">
                    <div>
                      <div class="text-body1 text-weight-medium">患者敏感信息脱敏</div>
                      <div class="text-caption text-grey-6">导出报告与共享预览时自动隐藏姓名、身份证号。</div>
                    </div>
                    <q-toggle v-model="preferences.privacy.desensitization" color="red" />
                  </div>

                  <div class="toggle-info-card">
                    <div>
                      <div class="text-body1 text-weight-medium">敏感操作二次验证</div>
                      <div class="text-caption text-grey-6">对高风险操作增加额外确认步骤。</div>
                    </div>
                    <q-toggle v-model="preferences.privacy.mfa" color="orange" />
                  </div>

                  <div class="security-hint-card">
                    <div class="security-hint-card__title">当前策略提示</div>
                    <div class="security-hint-card__text">
                      {{ securitySummary }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="billing" class="q-pa-none">
        <q-card flat bordered class="preference-shell-card">
          <q-card-section class="preference-shell-card__section">
            <div class="preference-shell-card__header q-mb-md">
              <div>
                <div class="text-h6">账单与提醒偏好</div>
                <div class="preference-shell-card__summary">
                  控制自动续费与余额预警，让账单策略与实际使用节奏一致。
                </div>
              </div>
              <q-btn unelevated color="primary" icon="save" label="保存全部偏好设置" no-caps @click="savePreferences" />
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="toggle-info-card preference-panel-card">
                  <div>
                    <div class="text-body1 text-weight-medium">自动续费</div>
                    <div class="text-caption text-grey-6">套餐到期前自动延续当前方案，减少服务中断。</div>
                  </div>
                  <q-toggle v-model="preferences.billing.autoRenewal" color="primary" />
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="toggle-info-card preference-panel-card">
                  <div>
                    <div class="text-body1 text-weight-medium">余额预警</div>
                    <div class="text-caption text-grey-6">低于阈值时主动提醒，避免按次权益耗尽。</div>
                  </div>
                  <q-toggle v-model="preferences.billing.lowBalanceAlert" color="warning" />
                </div>
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-sm items-start">
              <div class="col-12 col-lg-5">
                <q-input
                  v-if="preferences.billing.lowBalanceAlert"
                  v-model.number="preferences.billing.threshold"
                  filled
                  dense
                  type="number"
                  label="预警阈值 (元)"
                  prefix="¥"
                />
              </div>

              <div class="col-12 col-lg-7">
                <div class="security-hint-card security-hint-card--billing">
                  <div class="security-hint-card__title">账单策略说明</div>
                  <div class="security-hint-card__text">
                    {{ billingSummary }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { useAiPreferences } from 'src/composables/useAiPreferences';

const {
  activeModelDescription,
  activeModelLabel,
  activeTab,
  apiConfig,
  billingSummary,
  heatmapColorOptions,
  imageQualityOptions,
  modelOptions,
  notificationTypeOptions,
  overviewCards,
  preferences,
  reportFormatOptions,
  resetAIConfig,
  resetPreferences,
  roiStyleOptions,
  saveAIConfig,
  savePreferences,
  securitySummary,
} = useAiPreferences();
</script>

<style scoped>
.preferences-hero,
.preference-shell-card {
  border-radius: var(--app-radius-xl);
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(245, 250, 255, 0.92));
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.preferences-hero :deep(.q-card__section) {
  padding: 22px 24px;
}

.preferences-hero__eyebrow {
  color: #0f6caa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.preferences-hero__title {
  margin-top: 10px;
  max-width: 560px;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
  color: #11324d;
  font-size: clamp(2.45rem, 3vw, 4rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.01em;
  text-wrap: balance;
}

.preferences-hero__summary {
  max-width: 560px;
  margin-top: 10px;
  color: #5f7588;
  line-height: 1.72;
}

.overview-mini-card {
  height: 100%;
  min-height: 112px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.overview-mini-card__label {
  color: #70879a;
  font-size: 12px;
  letter-spacing: 0.06em;
}

.overview-mini-card__value {
  margin-top: 8px;
  color: #133953;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.overview-mini-card__desc {
  margin-top: 6px;
  color: #698296;
  font-size: 12px;
  line-height: 1.55;
}

.preferences-panels {
  border-radius: var(--app-radius-lg);
}

.preferences-panels :deep(.q-tab-panel) {
  padding-top: 8px;
}

.preference-shell-card__section {
  padding: 24px;
}

.preference-shell-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.preference-shell-card__summary {
  margin-top: 6px;
  color: #667e90;
  line-height: 1.6;
}

.config-panel-card,
.preference-panel-card {
  border-radius: 22px;
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(248, 251, 255, 0.94);
}

.config-kpi-card,
.security-hint-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(17, 108, 168, 0.12);
  background: linear-gradient(180deg, rgba(237, 247, 255, 0.96), rgba(255, 255, 255, 0.94));
}

.security-hint-card--billing {
  min-height: 100%;
}

.config-kpi-card__label,
.security-hint-card__title {
  color: #0f6caa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.config-kpi-card__value {
  margin-top: 10px;
  color: #123a55;
  font-size: 20px;
  font-weight: 700;
}

.config-kpi-card__desc,
.security-hint-card__text {
  margin-top: 8px;
  color: #5f7689;
  line-height: 1.68;
}

.config-slider-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.config-slider-card__title {
  color: #153b57;
  font-size: 15px;
  font-weight: 700;
}

.config-slider-card__value {
  color: #0f6caa;
  font-size: 20px;
  font-weight: 700;
}

.config-slider-card__value--warm {
  color: #d97706;
}

.preference-list-card :deep(.q-item) {
  min-height: 58px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.preference-stack {
  display: grid;
  gap: 14px;
}

.toggle-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(250, 252, 255, 0.92);
}

@media (max-width: 1023px) {
  .preference-shell-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 599px) {
  .preferences-hero,
  .preference-shell-card {
    border-radius: 22px;
  }

  .preferences-hero__title {
    font-size: 2.2rem;
  }

  .preference-shell-card__section {
    padding: 18px;
  }

  .toggle-info-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-mini-card {
    min-height: auto;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .preferences-hero,
  .preference-shell-card,
  .config-panel-card,
  .preference-panel-card,
  .overview-mini-card,
  .config-kpi-card,
  .security-hint-card,
  .toggle-info-card {
    background: var(--app-elevated-bg) !important;
    border-color: var(--app-border-default) !important;
  }

  .preferences-hero__title,
  .overview-mini-card__value,
  .config-kpi-card__value,
  .config-slider-card__title {
    color: var(--q-grey-2) !important;
  }

  .preferences-hero__summary,
  .overview-mini-card__label,
  .overview-mini-card__desc,
  .preference-shell-card__summary,
  .config-kpi-card__desc,
  .security-hint-card__text {
    color: var(--app-text-secondary) !important;
  }
}
</style>
