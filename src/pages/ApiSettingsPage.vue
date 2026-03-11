<template>
  <q-page class="q-pa-md app-gradient-page api-settings-page">
    <!-- 页面头部 -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 q-mb-xs">
          <q-icon name="workspace_premium" class="q-mr-sm" color="primary" />
          订阅与AI设置
        </div>
        <div class="text-subtitle2 text-grey-7">选择适合您的AI辅助筛查订阅计划，配置AI引擎参数</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 左侧主内容 -->
      <div class="col-lg-8 col-md-12">
        <!-- 订阅计划选择 -->
        <q-card
          id="subscription-plans"
          flat
          bordered
          class="q-mb-md subscription-demo-shell page-section-anchor"
        >
          <q-card-section class="subscription-demo-hero">
            <div class="row items-start q-col-gutter-lg">
              <div class="col-12 col-md-7">
                <div class="row items-center q-col-gutter-sm subscription-demo-hero__topline">
                  <div class="col-auto">
                    <q-chip dense color="primary" text-color="white" icon="workspace_premium">
                      订阅服务中心
                    </q-chip>
                  </div>
                  <div class="col-auto">
                    <div class="subscription-demo-hero__signal">
                      订阅状态与能力配置同屏联动
                    </div>
                  </div>
                </div>

                <div class="subscription-demo-kicker q-mt-md">面向门诊、专科与区域协同筛查</div>
                <div class="subscription-demo-title q-mt-sm">
                  让宫颈筛查能力
                  <span class="subscription-demo-title__accent">即刻成型</span>
                </div>
                <div class="text-body1 text-grey-7 q-mt-sm subscription-demo-subtitle">
                  从首诊体验到年度合作，把 AI 检测、结构化报告与随访闭环整合在同一套订阅能力里，
                  选中方案后右侧状态与可用配置立即同步。
                </div>

                <div class="row q-col-gutter-sm q-mt-md subscription-demo-stat-grid">
                  <div class="col-12 col-sm-4" v-for="item in heroStatCards" :key="item.label">
                    <div class="subscription-demo-stat-card">
                      <div class="subscription-demo-stat-card__label">{{ item.label }}</div>
                      <div class="subscription-demo-stat-card__value">{{ item.value }}</div>
                      <div class="subscription-demo-stat-card__description">
                        {{ item.description }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row q-col-gutter-sm q-mt-md">
                  <div class="col-12 col-sm-6" v-for="pill in heroHighlights" :key="pill.label">
                    <div class="subscription-hero-chip">
                      <div class="subscription-hero-chip__label">{{ pill.label }}</div>
                      <div class="subscription-hero-chip__value">{{ pill.value }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-5">
                <q-card flat class="subscription-demo-highlight">
                  <q-card-section>
                    <div class="subscription-demo-highlight__eyebrow">当前主推档位</div>
                    <div class="row items-start no-wrap q-mt-sm">
                      <div class="col">
                        <div class="text-h6 text-weight-bold">
                          {{ currentHeroOffer.planName }}
                        </div>
                        <div class="text-caption text-grey-7 q-mt-xs subscription-demo-highlight__desc">
                          {{ getOfferCompactDescription(currentHeroOffer) }}
                        </div>
                      </div>
                      <q-badge outline color="primary" class="subscription-demo-highlight__tier">
                        {{ currentHeroGroup.title }}
                      </q-badge>
                    </div>

                    <div class="subscription-demo-highlight__price-band q-mt-md">
                      <div>
                        <div
                          v-if="currentHeroOffer.originalAmount"
                          class="text-caption text-grey-5 text-strike"
                        >
                          ¥{{ formatCurrency(currentHeroOffer.originalAmount) }}
                        </div>
                        <div class="row items-end no-wrap">
                          <div class="text-h3 text-weight-bold text-primary">
                            ¥{{ formatCurrency(currentHeroOffer.amount) }}
                          </div>
                          <div class="text-body2 text-grey-7 q-ml-sm q-mb-xs">
                            /{{ currentHeroOffer.unitLabel }}
                          </div>
                        </div>
                      </div>
                      <div class="subscription-demo-highlight__price-note">
                        <div class="subscription-demo-highlight__price-note-label">开通建议</div>
                        <div class="subscription-demo-highlight__price-note-value">
                          {{ currentHeroOffer.billingLabel }}
                        </div>
                        <div class="text-caption text-grey-6">
                          {{ getOfferSupportText(currentHeroOffer) }}
                        </div>
                      </div>
                    </div>

                    <div class="subscription-demo-highlight__metrics q-mt-md">
                      <div class="subscription-demo-highlight__metric">
                        <span class="subscription-demo-highlight__metric-label">建议开通</span>
                        <strong>{{ currentHeroOffer.billingLabel }}</strong>
                      </div>
                      <div class="subscription-demo-highlight__metric">
                        <span class="subscription-demo-highlight__metric-label">核心权益</span>
                        <strong>{{ currentHeroOffer.featureSummary.length }} 项</strong>
                      </div>
                      <div class="subscription-demo-highlight__metric">
                        <span class="subscription-demo-highlight__metric-label">开通后</span>
                        <strong>状态即时同步</strong>
                      </div>
                    </div>

                    <div class="subscription-demo-highlight__bullet-list q-mt-md">
                      <div
                        class="subscription-demo-highlight__bullet"
                        v-for="point in currentHeroBullets"
                        :key="point"
                      >
                        <q-icon name="task_alt" color="positive" size="16px" />
                        <span>{{ point }}</span>
                      </div>
                    </div>

                    <q-btn
                      unelevated
                      color="primary"
                      class="full-width q-mt-md subscription-demo-highlight__cta"
                      no-caps
                      :label="getActionLabel(activeTier)"
                      @click="openPaymentDialog(currentHeroOffer)"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-lg">
              <div
                v-for="group in demoPlanGroups"
                :key="group.tier"
                class="col-12 col-xl-6"
              >
                <q-card
                  flat
                  class="plan-stage-card"
                  :class="[
                    `plan-stage-card--${group.tier}`,
                    { 'plan-stage-card--active': activeTier === group.tier },
                  ]"
                >
                  <q-card-section class="plan-stage-card__header">
                    <div class="row items-start no-wrap">
                      <div class="col">
                        <div class="row items-center q-gutter-sm">
                          <div class="text-overline" :class="group.accentTextClass">
                            {{ group.eyebrow }}
                          </div>
                          <q-badge :color="group.badgeColor">
                            {{ group.badge }}
                          </q-badge>
                        </div>
                        <div class="text-h5 text-weight-bold q-mt-sm">{{ group.title }}</div>
                        <div class="text-body2 text-grey-7 q-mt-sm">
                          {{ group.summary }}
                        </div>
                      </div>
                      <q-avatar :color="group.avatarColor" text-color="white" size="52px">
                        <q-icon :name="group.icon" size="28px" />
                      </q-avatar>
                    </div>

                    <div class="q-mt-lg">
                      <div class="plan-stage-card__focus-strip">
                        <div>
                          <div class="plan-stage-card__focus-label">当前已选</div>
                          <div class="plan-stage-card__focus-name">
                            {{ getSelectedOffer(group.tier).label }}
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="plan-stage-card__focus-price">
                            ¥{{ formatCurrency(getSelectedOffer(group.tier).amount) }}
                            <span>/{{ getSelectedOffer(group.tier).unitLabel }}</span>
                          </div>
                          <div class="plan-stage-card__focus-saving">
                            {{ getOfferSavingsText(getSelectedOffer(group.tier)) }}
                          </div>
                        </div>
                      </div>

                      <div class="plan-stage-card__selected-meta q-mt-md">
                        <q-badge :color="group.badgeColor">
                          {{ getSelectedOffer(group.tier).badge }}
                        </q-badge>
                        <span>{{ getOfferSupportText(getSelectedOffer(group.tier)) }}</span>
                      </div>
                    </div>

                    <div class="row q-col-gutter-sm q-mt-md">
                      <div class="col-12 col-sm-6" v-for="feature in group.features" :key="feature">
                        <div class="plan-feature-pill">
                          <q-icon name="check_circle" color="positive" size="16px" />
                          <span>{{ feature }}</span>
                        </div>
                      </div>
                    </div>
                  </q-card-section>

                  <q-card-section class="plan-stage-card__offers">
                    <div class="text-subtitle2 text-weight-medium q-mb-sm">按天数收费</div>
                    <div class="row q-col-gutter-sm">
                      <div
                        v-for="offer in group.durationOffers"
                        :key="offer.code"
                        class="col-12 col-sm-6"
                      >
                        <button
                          type="button"
                          class="offer-tile"
                          :class="{ 'offer-tile--active': selectedOfferByTier[group.tier] === offer.code }"
                          @click="selectOffer(group.tier, offer.code)"
                        >
                          <div class="offer-tile__topline">
                            <q-badge
                              outline
                              :color="group.tier === 'premium' ? 'deep-orange' : 'primary'"
                            >
                              {{ offer.badge }}
                            </q-badge>
                            <span class="offer-tile__saving">
                              {{ getOfferSavingsText(offer) }}
                            </span>
                          </div>
                          <div class="row items-start no-wrap">
                            <div class="col text-left">
                              <div class="text-body1 text-weight-medium">{{ offer.label }}</div>
                              <div class="text-caption text-grey-7 q-mt-xs offer-tile__description">
                                {{ getOfferCompactDescription(offer) }}
                              </div>
                            </div>
                            <q-icon
                              :name="
                                selectedOfferByTier[group.tier] === offer.code
                                  ? 'radio_button_checked'
                                  : 'radio_button_unchecked'
                              "
                              :color="
                                selectedOfferByTier[group.tier] === offer.code
                                  ? 'primary'
                                  : 'grey-5'
                              "
                              size="18px"
                            />
                          </div>
                          <div class="q-mt-md text-left">
                            <div
                              v-if="offer.originalAmount"
                              class="text-caption text-grey-5 text-strike"
                            >
                              ¥{{ formatCurrency(offer.originalAmount) }}
                            </div>
                            <div class="row items-end no-wrap offer-tile__price-row">
                              <div class="text-h6 text-weight-bold">
                                ¥{{ formatCurrency(offer.amount) }}
                              </div>
                              <span class="offer-tile__price-unit">/{{ offer.unitLabel }}</span>
                            </div>
                            <div class="offer-tile__footnote">
                              <span>{{ offer.billingLabel }}</span>
                              <span v-if="offer.autoRenewHint">{{ offer.autoRenewHint }}</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div v-if="group.usageOffers.length" class="q-mt-lg">
                      <div class="text-subtitle2 text-weight-medium q-mb-sm">按次数收费</div>
                      <div class="row q-col-gutter-sm">
                        <div
                          v-for="offer in group.usageOffers"
                          :key="offer.code"
                          class="col-12 col-sm-6"
                        >
                          <button
                            type="button"
                            class="offer-tile offer-tile--usage"
                            :class="{ 'offer-tile--active': selectedOfferByTier[group.tier] === offer.code }"
                            @click="selectOffer(group.tier, offer.code)"
                          >
                            <div class="offer-tile__topline">
                              <q-badge outline color="teal">
                                {{ offer.badge }}
                              </q-badge>
                              <span class="offer-tile__saving">
                                {{ getOfferSupportText(offer) }}
                              </span>
                            </div>
                            <div class="row items-start no-wrap">
                              <div class="col text-left">
                                <div class="text-body1 text-weight-medium">{{ offer.label }}</div>
                                <div class="text-caption text-grey-7 q-mt-xs offer-tile__description">
                                  {{ getOfferCompactDescription(offer) }}
                                </div>
                              </div>
                              <q-icon
                                :name="
                                  selectedOfferByTier[group.tier] === offer.code
                                    ? 'radio_button_checked'
                                    : 'radio_button_unchecked'
                                "
                                :color="
                                  selectedOfferByTier[group.tier] === offer.code
                                    ? 'primary'
                                    : 'grey-5'
                                "
                                size="18px"
                              />
                            </div>
                            <div class="q-mt-md text-left">
                              <div class="row items-end no-wrap offer-tile__price-row">
                                <div class="text-h6 text-weight-bold">
                                  ¥{{ formatCurrency(offer.amount) }}
                                </div>
                                <span class="offer-tile__price-unit">/{{ offer.unitLabel }}</span>
                              </div>
                              <div class="offer-tile__footnote">
                                <span>{{ offer.billingLabel }}</span>
                                <span>即开即用</span>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </q-card-section>

                  <q-card-actions class="plan-stage-card__actions">
                    <q-btn
                      unelevated
                      :color="group.actionColor"
                      :label="getActionLabel(group.tier)"
                      no-caps
                      class="full-width"
                      @click="openPaymentDialog(getSelectedOffer(group.tier))"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- AI模型配置 -->
        <q-card id="ai-engine-config" flat bordered class="q-mb-md page-section-anchor settings-block-card">
          <q-card-section class="settings-block-card__section">
            <div class="settings-block-card__head q-mb-md">
              <div>
                <div class="text-h6">AI引擎配置</div>
                <div class="settings-block-card__summary">
                  统一控制模型版本、诊断阈值与敏感性，适配不同科室筛查强度。
                </div>
              </div>
            </div>

            <q-form>
              <div class="row q-col-gutter-md items-start">
                <div class="col-12 col-lg-5">
                  <q-select
                    v-model="apiConfig.model"
                    outlined
                    label="AI引擎版本"
                    :options="modelOptions"
                    emit-value
                    map-options
                    hint="选择要使用的CervixDetect AI引擎版本"
                  >
                    <template v-slot:prepend>
                      <q-icon name="psychology" />
                    </template>
                  </q-select>

                  <div class="row q-col-gutter-sm q-mt-sm">
                    <div class="col-12 col-sm-6 col-lg-12">
                      <div class="config-brief-card">
                        <div class="config-brief-card__label">当前阈值</div>
                        <div class="config-brief-card__value">
                          {{ (apiConfig.confidence * 100).toFixed(0) }}%
                        </div>
                        <div class="config-brief-card__desc">更高阈值更保守</div>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6 col-lg-12">
                      <div class="config-brief-card config-brief-card--accent">
                        <div class="config-brief-card__label">当前敏感性</div>
                        <div class="config-brief-card__value">
                          {{ (apiConfig.sensitivity * 100).toFixed(0) }}%
                        </div>
                        <div class="config-brief-card__desc">更适合异常细胞优先检出</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-lg-7">
                  <div class="config-slider-card">
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
                      class="q-mt-md"
                    />
                    <div class="text-caption text-grey-6 q-mt-xs">
                      调整 AI 诊断输出的保守程度。
                    </div>
                  </div>

                  <div class="config-slider-card q-mt-sm">
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
                      class="q-mt-md"
                    />
                    <div class="text-caption text-grey-6 q-mt-xs">
                      控制异常细胞优先检出的灵敏程度。
                    </div>
                  </div>
                </div>
              </div>

              <div class="row q-mt-md">
                <q-space />
                <q-btn flat label="恢复默认" @click="resetAIConfig" class="q-mr-sm" />
                <q-btn unelevated color="primary" label="保存配置" no-caps @click="saveAIConfig" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- 服务偏好设置 (UI优化版) -->
        <q-card
          id="service-preferences"
          flat
          bordered
          class="settings-block-card page-section-anchor"
        >
          <q-card-section class="settings-block-card__section">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-h6">
                  <q-icon name="tune" color="primary" class="q-mr-sm" />
                  服务偏好设置
                </div>
                <div class="settings-block-card__summary">
                  在同一页内统一配置通知、分析、报告、安全与账单偏好。
                </div>
              </div>
              <q-btn
                flat
                round
                icon="restart_alt"
                color="grey-7"
                size="sm"
                @click="resetPreferences"
              >
                <q-tooltip>恢复默认设置</q-tooltip>
              </q-btn>
            </div>

            <div class="row q-col-gutter-lg">
              <!-- 左列：通知与分析 -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-primary q-mb-sm">
                  <q-icon name="notifications" class="q-mr-xs" />
                  智能通知中心
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
                          <q-item-label class="text-caption text-grey-7 q-mb-xs"
                            >通知渠道</q-item-label
                          >
                          <div class="q-gutter-sm">
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="in_app"
                              label="站内通知"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="email"
                              label="邮件"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="sms"
                              label="短信"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="browser"
                              label="浏览器推送"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="wechat"
                              label="微信服务号"
                              dense
                              size="sm"
                            />
                          </div>
                        </q-item-section>
                      </q-item>

                      <q-item>
                        <q-item-section>
                          <q-item-label class="text-caption text-grey-7 q-mb-xs"
                            >接收内容</q-item-label
                          >
                          <q-select
                            v-model="preferences.notifications.types"
                            multiple
                            filled
                            dense
                            options-dense
                            emit-value
                            map-options
                            :options="[
                              { label: '分析完成报告', value: 'analysis' },
                              { label: '高风险病变预警', value: 'alert' },
                              { label: '系统安全通知', value: 'security' },
                              { label: '周度/月度汇总', value: 'report' },
                              { label: '营销与优惠', value: 'marketing' },
                            ]"
                            label="选择通知类型"
                          >
                            <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                              <q-item v-bind="itemProps">
                                <q-item-section>
                                  <q-item-label>{{ opt.label }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                  <q-toggle
                                    :model-value="selected"
                                    @update:model-value="toggleOption(opt)"
                                  />
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
                          <q-toggle
                            v-model="preferences.notifications.dndMode"
                            color="indigo"
                            icon="nightlight"
                          />
                        </q-item-section>
                      </q-item>
                    </div>
                  </q-slide-transition>
                </q-list>

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="science" class="q-mr-xs" />
                  分析与诊断习惯
                </div>
                <q-card flat bordered class="bg-grey-1 preference-panel-card">
                  <q-card-section class="q-pa-sm">
                    <q-toggle
                      v-model="preferences.analysis.autoStart"
                      label="上传后自动开始分析"
                      dense
                      class="q-mb-sm"
                    />
                    <q-toggle
                      v-model="preferences.analysis.aiSecondOpinion"
                      label="启用AI第二诊疗意见"
                      dense
                      color="purple"
                    />

                    <q-separator class="q-my-sm" />

                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-select
                          v-model="preferences.analysis.roiStyle"
                          filled
                          dense
                          options-dense
                          emit-value
                          map-options
                          label="病灶标记样式"
                          :options="[
                            { label: '矩形框 (Box)', value: 'box' },
                            { label: '轮廓遮罩 (Mask)', value: 'mask' },
                            { label: '热力图 (Heatmap)', value: 'heatmap' },
                            { label: '混合显示 (Hybrid)', value: 'hybrid' },
                          ]"
                        />
                      </div>
                      <div class="col-6">
                        <q-select
                          v-model="preferences.analysis.heatmapColor"
                          filled
                          dense
                          options-dense
                          emit-value
                          map-options
                          label="热力图配色"
                          :options="[
                            { label: '经典红蓝 (Jet)', value: 'jet' },
                            { label: '医学灰阶 (Gray)', value: 'gray' },
                            { label: '警告红黄 (Hot)', value: 'hot' },
                            { label: '荧光绿 (Viridis)', value: 'viridis' },
                          ]"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- 右列：报告、隐私与订阅 -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-primary q-mb-sm">
                  <q-icon name="assignment" class="q-mr-xs" />
                  报告与导出配置
                </div>
                <q-list separator class="rounded-borders bg-grey-1 preference-list-card">
                  <q-item>
                    <q-item-section>
                      <q-item-label>自动保存历史记录</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="preferences.reports.autoSave" color="green" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-6">
                          <q-select
                            v-model="preferences.reports.defaultFormat"
                            filled
                            dense
                            label="默认导出格式"
                            :options="[
                              { label: 'PDF 专业版', value: 'pdf_pro' },
                              { label: 'PDF 精简版', value: 'pdf_lite' },
                              { label: 'Word 文档', value: 'docx' },
                              { label: 'Excel 数据表', value: 'xlsx' },
                            ]"
                          />
                        </div>
                        <div class="col-6">
                          <q-select
                            v-model="preferences.reports.imageQuality"
                            filled
                            dense
                            label="影像存档质量"
                            :options="[
                              { label: '无损原始图 (RAW)', value: 'lossless' },
                              { label: '高质量 (High)', value: 'high' },
                              { label: '标准压缩 (Standard)', value: 'standard' },
                            ]"
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

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="security" class="q-mr-xs" />
                  隐私与安全
                </div>
                <q-card flat bordered class="bg-grey-1 preference-panel-card">
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-body2">患者敏感信息脱敏</div>
                      <q-toggle v-model="preferences.privacy.desensitization" color="red" dense />
                    </div>
                    <div class="text-caption text-grey-7 q-mb-sm">
                      在导出报告和共享预览中自动隐藏患者姓名、身份证号
                    </div>

                    <q-separator class="q-my-sm" />

                    <div class="row items-center justify-between">
                      <div class="text-body2">敏感操作二次验证</div>
                      <q-toggle v-model="preferences.privacy.mfa" color="orange" dense />
                    </div>
                  </q-card-section>
                </q-card>

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="account_balance_wallet" class="q-mr-xs" />
                  订阅与账单
                </div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-card flat bordered class="bg-grey-1 preference-panel-card">
                      <q-card-section class="q-pa-sm row items-center justify-between">
                        <div class="text-body2">自动续费</div>
                        <q-toggle v-model="preferences.billing.autoRenewal" color="primary" dense />
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-6">
                    <q-card flat bordered class="bg-grey-1 preference-panel-card">
                      <q-card-section class="q-pa-sm row items-center justify-between">
                        <div class="text-body2">余额预警</div>
                        <q-toggle
                          v-model="preferences.billing.lowBalanceAlert"
                          color="warning"
                          dense
                        />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
                <q-input
                  v-if="preferences.billing.lowBalanceAlert"
                  v-model.number="preferences.billing.threshold"
                  filled
                  dense
                  type="number"
                  label="预警阈值 (元)"
                  class="q-mt-sm"
                  prefix="¥"
                />
              </div>
            </div>

            <div class="row q-mt-lg">
              <q-space />
              <q-btn
                unelevated
                color="primary"
                label="保存所有偏好设置"
                icon="save"
                no-caps
                @click="savePreferences"
                class="full-width-xs"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 侧边栏信息 -->
      <div class="col-lg-4 col-md-12">
        <!-- 订阅状态 -->
        <q-card flat bordered class="subscription-status-card">
          <q-card-section class="subscription-status-card__header">
            <div class="row items-start no-wrap">
              <div class="col">
                <div class="subscription-status-card__eyebrow">当前订阅状态</div>
                <div class="text-h6 text-weight-bold q-mt-xs">
                  {{ subscriptionStatus.title }}
                </div>
                <div class="subscription-status-card__summary q-mt-sm">
                  {{ subscriptionStatus.subtitle }}
                </div>
              </div>
              <div class="subscription-status-card__icon-shell">
                <q-icon :name="subscriptionStatus.icon" size="30px" :color="subscriptionStatus.color" />
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-auto">
                <q-chip dense square class="subscription-status-chip subscription-status-chip--primary">
                  {{ subscriptionStatus.badge }}
                </q-chip>
              </div>
              <div class="col-auto" v-if="subscriptionStatus.renewalNote">
                <q-chip dense square class="subscription-status-chip subscription-status-chip--muted">
                  {{ subscriptionStatus.renewalNote }}
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-separator class="subscription-status-card__separator" />

          <q-card-section class="subscription-status-card__body">
            <div class="status-grid">
              <div class="status-grid__item">
                <div class="status-grid__label">当前套餐</div>
                <div class="status-grid__value">{{ subscriptionStatus.planName }}</div>
              </div>
              <div class="status-grid__item">
                <div class="status-grid__label">套餐层级</div>
                <div class="status-grid__value">{{ subscriptionStatus.tierLabel }}</div>
              </div>
              <div class="status-grid__item">
                <div class="status-grid__label">到期时间</div>
                <div class="status-grid__value">{{ subscriptionStatus.expireDate }}</div>
              </div>
              <div class="status-grid__item">
                <div class="status-grid__label">{{ subscriptionStatus.quotaLabel }}</div>
                <div class="status-grid__value status-grid__value--accent">
                  {{ subscriptionStatus.remainingCount }}
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator class="subscription-status-card__separator" />

          <q-card-section class="subscription-status-card__footer">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">已开通权益</div>
              <div class="text-caption text-grey-6">{{ subscriptionStatus.tierLabel }}</div>
            </div>
            <div class="row q-col-gutter-sm">
              <div
                class="col-12"
                v-for="tag in subscriptionStatus.featureTags"
                :key="tag"
              >
                <div class="status-feature-item">
                  <q-icon name="task_alt" color="positive" size="16px" />
                  <span>{{ tag }}</span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-actions v-if="subscriptionStatus.type === 'trial'" class="q-pa-md q-pt-none">
            <q-btn
              unelevated
              color="primary"
              label="选择订阅套餐"
              icon="arrow_upward"
              class="full-width"
              @click="showUpgradeDialog = true"
            />
          </q-card-actions>
        </q-card>

        <!-- 订阅计划对比 -->
        <q-card flat bordered class="q-mt-md comparison-card">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="compare" color="primary" class="q-mr-sm" />
              套餐能力对比
            </div>
            <q-markup-table flat dense class="comparison-table">
              <thead>
                <tr>
                  <th class="text-left">维度</th>
                  <th class="text-center">基础套餐</th>
                  <th class="text-center">顶级套餐</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in planComparisonRows" :key="row.label">
                  <td>{{ row.label }}</td>
                  <td class="text-center">{{ row.basic }}</td>
                  <td class="text-center">{{ row.premium }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>

        <!-- AI引擎性能指标 -->
        <q-card
          id="performance-metrics"
          flat
          bordered
          class="q-mt-md page-section-anchor performance-card"
        >
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="analytics" color="primary" class="q-mr-sm" />
              AI引擎性能指标
            </div>
            <div class="q-gutter-sm">
              <div class="row items-center">
                <div class="col-6 text-grey-6">临床准确率</div>
                <div class="col-6 text-positive text-weight-bold text-right">97.8%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">病变检出率</div>
                <div class="col-6 text-positive text-weight-bold text-right">96.3%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">敏感性</div>
                <div class="col-6 text-weight-medium text-right">94.7%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">特异性</div>
                <div class="col-6 text-weight-medium text-right">98.2%</div>
              </div>
              <q-separator spaced />
              <div class="row items-center">
                <div class="col-6 text-grey-6">平均分析时间</div>
                <div class="col-6 text-weight-medium text-right">~25秒</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">训练数据量</div>
                <div class="col-6 text-weight-medium text-right">120万+</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 技术特性 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="star" color="amber" class="q-mr-sm" />
              核心技术特性
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>多尺度特征融合</q-item-label>
                  <q-item-label caption>结合ResNet-152与Vision Transformer架构</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>注意力机制增强</q-item-label>
                  <q-item-label caption>精准定位异常细胞区域</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>对抗训练优化</q-item-label>
                  <q-item-label caption>提升模型泛化能力与鲁棒性</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>迁移学习增强</q-item-label>
                  <q-item-label caption>基于ImageNet与医学影像双重预训练</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- 订阅指南 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="help_outline" color="info" class="q-mr-sm" />
              订阅指南
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 1 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    根据使用频率选择合适的订阅计划
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 2 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    点击"立即订阅"按钮进入支付流程
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 3 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    完成支付后即可开始使用AI分析服务
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 4 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    订阅到期前将收到续费提醒通知
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- 认证信息 -->
        <q-card
          id="compliance-certifications"
          flat
          bordered
          class="q-mt-md page-section-anchor"
        >
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="workspace_premium" color="purple" class="q-mr-sm" />
              资质认证
            </div>

            <!-- 软著展示 (置顶优化) -->
            <div class="q-gutter-y-sm q-mb-md">
              <div
                v-for="copyright in sortedSoftwareCopyrights"
                :key="copyright.id"
                class="bg-purple-1 rounded-borders q-pa-sm relative-position overflow-hidden cursor-pointer copyright-card"
                @click="openCertificatePreview(copyright)"
              >
                <div class="row items-center relative-position" style="z-index: 1">
                  <q-icon name="verified" color="purple" size="sm" class="q-mr-sm col-auto" />
                  <div class="col">
                    <div
                      class="text-subtitle2 text-purple-9 text-weight-bold"
                      style="line-height: 1.2"
                    >
                      {{ copyright.name }}
                      <q-badge color="purple-3" text-color="purple-9" class="q-ml-xs" align="top"
                        >{{ copyright.version }}</q-badge
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="row q-mt-xs text-caption text-purple-8 q-pl-lg relative-position"
                  style="z-index: 1"
                >
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">登记号</span>
                    <span class="text-weight-medium">{{ copyright.registrationNo }}</span>
                  </div>
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">证书号</span>
                    <span class="text-weight-medium">{{ copyright.certificateNo }}</span>
                  </div>
                </div>
                <!-- 装饰背景 -->
                <q-icon
                  name="copyright"
                  class="absolute-bottom-right text-purple-2"
                  size="48px"
                  style="bottom: -12px; right: -8px; transform: rotate(-15deg)"
                />
              </div>
            </div>

            <q-separator spaced />

            <q-list dense>
              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    NMPA三类医疗器械认证
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    ISO 13485医疗器械质量管理体系
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    国家重点研发计划项目支持
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

        <!-- 订阅支付弹窗 -->
    <q-dialog v-model="showPaymentDialog" persistent>
      <q-card class="demo-payment-dialog">
        <q-card-section class="demo-payment-dialog__header">
          <div class="text-overline text-white-7">订阅支付</div>
          <div class="row items-center justify-between q-mt-sm q-col-gutter-md">
            <div class="col">
              <div class="text-h6">
                <q-icon name="shopping_cart" class="q-mr-sm" />
                确认支付
              </div>
              <div class="text-caption q-mt-xs demo-payment-dialog__caption">
                {{ paymentInfo.planName || '请选择需要开通的订阅套餐' }}
              </div>
            </div>
            <div class="col-auto" v-if="paymentInfo.amount">
              <div class="demo-payment-dialog__hero-amount">
                ¥{{ formatCurrency(paymentInfo.amount) }}
              </div>
            </div>
          </div>
          <div class="text-caption q-mt-sm">
            支付完成后将即时同步当前页面的套餐状态，正式计费规则以签约或支付说明为准。
          </div>
        </q-card-section>

        <q-stepper v-model="paymentStep" ref="stepper" flat class="payment-stepper-shell">
          <q-step :name="1" title="订单确认" icon="receipt" :done="paymentStep > 1">
            <div class="q-pa-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-7">
                  <div class="text-h6 q-mb-md">订单详情</div>
                  <q-card flat bordered class="demo-order-card">
                    <q-card-section class="row items-center q-col-gutter-md">
                      <div class="col-auto">
                        <q-avatar size="58px" color="primary" text-color="white">
                          <q-icon :name="paymentInfo.icon || 'workspace_premium'" size="28px" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-h6 text-weight-bold">{{ paymentInfo.planName }}</div>
                        <div class="text-caption text-grey-7 q-mt-xs">{{ paymentInfo.description }}</div>
                        <div class="row q-gutter-sm q-mt-sm">
                          <q-badge color="primary">{{ paymentInfo.tierLabel }}</q-badge>
                          <q-badge color="blue-8">{{ paymentInfo.billingLabel }}</q-badge>
                          <q-badge
                            v-if="paymentInfo.autoRenewHint"
                            color="orange"
                            text-color="white"
                          >
                            {{ paymentInfo.autoRenewHint }}
                          </q-badge>
                        </div>
                      </div>
                      <div class="col-auto text-right">
                        <div
                          v-if="paymentInfo.originalAmount"
                          class="text-caption text-grey-5 text-strike"
                        >
                          ¥{{ formatCurrency(paymentInfo.originalAmount) }}
                        </div>
                        <div class="text-h5 text-primary text-weight-bold">
                          ¥{{ formatCurrency(paymentInfo.amount) }}
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>

                  <div class="payment-summary q-mt-lg">
                    <div class="summary-row">
                      <span class="text-grey-7">套餐金额</span>
                      <span class="text-weight-medium">
                        ¥{{ formatCurrency(paymentInfo.originalAmount || paymentInfo.amount) }}
                      </span>
                    </div>
                    <div
                      v-if="paymentInfo.discount && paymentInfo.discount > 0"
                      class="summary-row discount-row"
                    >
                      <span class="text-grey-7">
                        <q-icon name="local_offer" size="xs" class="q-mr-xs" />
                        {{ paymentInfo.discountReason }}
                      </span>
                      <span class="text-positive text-weight-medium">-¥{{ paymentInfo.discount }}</span>
                    </div>
                    <q-separator spaced />
                    <div class="summary-row total">
                      <span class="text-h6">应付总额</span>
                      <span class="text-h5 text-primary text-weight-bold">
                        ¥{{ formatCurrency(paymentInfo.amount) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-5">
                  <div class="text-h6 q-mb-md">开通后将同步</div>
                  <div class="checkout-aside-card">
                    <div class="checkout-aside-card__head">
                      <div class="checkout-aside-card__title">权益同步摘要</div>
                      <div class="checkout-aside-card__badge">{{ paymentInfo.tierLabel }}</div>
                    </div>
                    <div class="checkout-aside-card__list">
                      <div
                        class="checkout-aside-card__item"
                        v-for="feature in paymentInfo.featureSummary"
                        :key="feature"
                      >
                        <q-icon name="check_circle" color="positive" size="16px" />
                        <span>{{ feature }}</span>
                      </div>
                    </div>
                    <div class="checkout-aside-card__footer">
                      <div>
                        <span>状态同步</span>
                        <strong>实时更新</strong>
                      </div>
                      <div>
                        <span>套餐金额</span>
                        <strong>¥{{ formatCurrency(paymentInfo.amount) }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="q-mt-lg">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">本次开通后将同步的权益</div>
                <div class="row q-col-gutter-sm">
                  <div
                    class="col-12 col-sm-6"
                    v-for="feature in paymentInfo.featureSummary"
                    :key="feature"
                  >
                    <div class="demo-feature-item">
                      <q-icon name="check_circle" color="positive" size="16px" />
                      <span>{{ feature }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="agreement-section q-mt-lg">
                <q-checkbox v-model="agreePaymentTerms" dense>
                  <span class="text-body2 text-grey-8">
                    我已阅读并同意
                    <span
                      class="agreement-link"
                      @click.stop.prevent="showPaymentAgreement('agreement')"
                    >
                      《用户协议》
                    </span>
                    和
                    <span
                      class="agreement-link"
                      @click.stop.prevent="showPaymentAgreement('privacy')"
                    >
                      《隐私政策》
                    </span>
                  </span>
                </q-checkbox>
                <div v-if="!agreePaymentTerms" class="text-caption text-orange q-mt-xs q-ml-md">
                  请先同意用户协议和隐私政策后继续
                </div>
              </div>
            </div>
          </q-step>

          <q-step :name="2" title="选择支付方式" icon="payment" :done="paymentStep > 2">
            <div class="q-pa-md">
              <div class="payment-selection-banner q-mb-md">
                <div>
                  <div class="payment-selection-banner__label">当前订单</div>
                  <div class="payment-selection-banner__value">
                    {{ paymentInfo.planName }} · ¥{{ formatCurrency(paymentInfo.amount) }}
                  </div>
                </div>
                <q-badge color="primary" outline>
                  {{ paymentInfo.billingLabel }}
                </q-badge>
              </div>
              <div class="text-h6 q-mb-md">支付方式</div>
              <div class="row q-col-gutter-md">
                <div v-for="method in paymentMethods" :key="method.value" class="col-12">
                  <q-card
                    flat
                    bordered
                    class="cursor-pointer payment-method-card"
                    :class="{ 'payment-method-card--active': selectedPaymentMethod === method.value }"
                    @click="selectedPaymentMethod = method.value"
                  >
                    <q-card-section class="row items-center q-pa-md">
                      <q-icon
                        :name="method.icon"
                        :color="method.color"
                        size="32px"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="row items-center q-gutter-sm">
                          <div class="text-body1 text-weight-medium">{{ method.label }}</div>
                          <q-badge
                            v-if="method.value === 'alipay'"
                            color="blue-8"
                            text-color="white"
                          >
                            常用
                          </q-badge>
                        </div>
                        <div class="text-caption text-grey-6">{{ method.description }}</div>
                      </div>
                      <q-radio
                        v-model="selectedPaymentMethod"
                        :val="method.value"
                        color="primary"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <div class="demo-payment-note q-mt-md">
                确认支付后，当前页面的订阅状态、套餐信息与权益摘要将立即刷新。
              </div>

              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="verified_user">
                    状态即时同步
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="assignment">
                    套餐信息更新
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="support_agent">
                    支持再次选购
                  </q-chip>
                </div>
                <div class="col-auto" v-if="paymentInfo.autoRenewHint">
                  <q-chip dense color="orange" text-color="white" icon="autorenew">
                    {{ paymentInfo.autoRenewHint }}
                  </q-chip>
                </div>
              </div>
            </div>
          </q-step>

          <q-step :name="3" title="支付完成" icon="verified">
            <div class="q-pa-xl text-center">
              <q-icon name="task_alt" color="positive" size="72px" />
              <div class="text-h5 text-weight-bold q-mt-md">支付已完成</div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                右侧订阅状态卡已同步切换到 {{ subscriptionStatus.planName }}。
              </div>
              <q-card flat bordered class="q-mt-lg demo-success-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-medium">同步结果</div>
                  <div class="row q-col-gutter-sm q-mt-sm">
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">套餐名称</span>
                        <span class="text-weight-medium">{{ subscriptionStatus.planName }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">到期时间</span>
                        <span class="text-weight-medium">{{ subscriptionStatus.expireDate }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">{{ subscriptionStatus.quotaLabel }}</span>
                        <span class="text-weight-medium">{{ subscriptionStatus.remainingCount }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">状态标识</span>
                        <span class="text-weight-medium">{{ subscriptionStatus.badge }}</span>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-step>

          <template v-slot:navigation>
            <q-stepper-navigation class="q-pa-md">
              <div class="row items-center">
                <q-btn
                  v-if="paymentStep > 1 && paymentStep < 3"
                  flat
                  color="grey-8"
                  label="上一步"
                  icon="arrow_back"
                  @click="stepper?.previous()"
                  no-caps
                  :disable="paymentProcessing"
                />
                <q-space />
                <q-btn
                  flat
                  color="grey-8"
                  :label="paymentStep === 3 ? '关闭' : '取消订单'"
                  @click="paymentStep === 3 ? finishDemoPayment() : cancelPayment()"
                  no-caps
                  class="q-mr-sm"
                  :disable="paymentProcessing"
                />
                <q-btn
                  v-if="paymentStep === 1"
                  unelevated
                  label="下一步：选择支付方式"
                  color="primary"
                  icon-right="arrow_forward"
                  @click="stepper?.next()"
                  no-caps
                  size="md"
                  :disabled="!agreePaymentTerms"
                />
                <q-btn
                  v-else-if="paymentStep === 2"
                  unelevated
                  label="确认支付"
                  color="positive"
                  icon="payment"
                  @click="processPayment"
                  :loading="paymentProcessing"
                  no-caps
                  size="md"
                  class="payment-confirm-btn"
                >
                  <template v-slot:loading>
                    <q-spinner-dots color="white" />
                  </template>
                </q-btn>
                <q-btn
                  v-else
                  unelevated
                  color="primary"
                  label="完成并返回页面"
                  icon-right="arrow_forward"
                  no-caps
                  @click="finishDemoPayment"
                />
              </div>
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showUpgradeDialog">
      <q-card class="upgrade-dialog-card">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">切换订阅套餐</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body1 q-mb-md">
            选择一个推荐档位后，直接进入支付确认流程。
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6" v-for="group in demoPlanGroups" :key="group.tier">
              <q-card flat bordered class="upgrade-option-card">
                <q-card-section>
                  <div class="row items-center justify-between">
                    <div class="text-subtitle1 text-weight-bold">{{ group.title }}</div>
                    <q-badge :color="group.badgeColor">{{ group.badge }}</q-badge>
                  </div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    {{ getSelectedOffer(group.tier).label }} ·
                    ¥{{ formatCurrency(getSelectedOffer(group.tier).amount) }}
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    {{ getSelectedOffer(group.tier).description }}
                  </div>
                </q-card-section>
                <q-card-actions>
                  <q-btn
                    unelevated
                    :color="group.actionColor"
                    class="full-width"
                    no-caps
                    label="选择该套餐"
                    @click="handleUpgrade(group.tier)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="稍后再说" color="grey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="previewVisible" @hide="resetCertificatePreview">
      <q-card style="width: min(92vw, 960px); max-width: 960px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold">{{ activeCertificate?.name }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-img
            v-if="activeCertificate?.imageUrl"
            :src="activeCertificate.imageUrl"
            :alt="activeCertificate.name"
            fit="contain"
            class="certificate-preview-image"
          />
          <div v-else class="text-center text-grey-7 q-py-xl">证书图片待补充</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 协议弹窗 -->
    <AgreementDialog
      v-model="showPaymentAgreementDialog"
      :initial-tab="paymentAgreementTab"
      :show-agree-button="true"
      @agree="agreePaymentTerms = true"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import { userAPI } from 'src/services/api';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
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
import { getItem, setItem, STORAGE_KEYS } from 'src/utils/storage';

type DemoSubscriptionSource = 'demo' | 'backend' | 'default';

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

const $q = useQuasar();
const sortedSoftwareCopyrights = SORTED_SOFTWARE_COPYRIGHTS;
const heroHighlights: HeroHighlightItem[] = [
  {
    label: demoHeroHighlights[0] ?? '双套餐分层方案',
    value: '从单次体验到年度合作',
  },
  {
    label: demoHeroHighlights[1] ?? '支付流程一页完成',
    value: '从选购到开通闭环完成',
  },
  {
    label: demoHeroHighlights[2] ?? '订阅状态即时同步',
    value: '状态、权益、配置同屏刷新',
  },
];
const heroStatCards: HeroStatCardItem[] = [
  {
    label: '机构适配',
    value: '门诊到区域协同',
    description: '基础版覆盖常规筛查，旗舰版补齐协作闭环。',
  },
  {
    label: '报告闭环',
    value: '结构化一体交付',
    description: '检测、导出、随访与留痕在同页打通。',
  },
  {
    label: '开通效率',
    value: '选择后即时生效',
    description: '右侧订阅状态与配置入口同步切换。',
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
const stepper = ref<{ next: () => void; previous: () => void } | null>(null);
const paymentStep = ref(1);
const selectedPaymentMethod = ref<'alipay' | 'wxpay' | 'bank'>('alipay');
const agreePaymentTerms = ref(false);
const showPaymentAgreementDialog = ref(false);
const paymentAgreementTab = ref<'agreement' | 'privacy'>('agreement');
const hasDemoOverride = ref(false);
const currentPaymentOffer = ref<DemoOffer | null>(null);

const createDefaultSubscriptionStatus = (): DemoSubscriptionStatus => ({
  type: 'trial',
  title: '试用体验已就绪',
  subtitle: '当前为试用体验，可直接切换基础套餐或顶级套餐并查看状态变化。',
  icon: 'verified_user',
  color: 'positive',
  badge: '试用体验',
  badgeColor: 'positive',
  planName: '基础套餐按次体验',
  tierLabel: '试用权益',
  expireDate: '单次有效',
  quotaLabel: '剩余次数',
  remainingCount: '1次',
  featureTags: ['三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
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

const apiConfig = ref({
  model: 'qwen-vl-max',
  confidence: 0.85,
  sensitivity: 0.9,
});

const modelOptions = [
  {
    label: 'CervixDetect Pro (推荐)',
    value: 'qwen-vl-max',
    description: '最高精度，适用于复杂病例',
  },
  { label: 'CervixDetect Standard', value: 'qwen-vl-plus', description: '平衡性能与速度' },
  { label: 'CervixDetect Lite', value: 'qwen-vl-v1', description: '快速筛查模式' },
];

const preferences = ref({
  notifications: {
    enable: true,
    channels: ['in_app', 'email', 'browser'] as string[],
    types: ['analysis', 'alert', 'security'] as string[],
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

const paymentMethods = [
  {
    value: 'alipay',
    label: '支付宝',
    description: '快捷安全的移动支付展示方式',
    icon: 'account_balance_wallet',
    color: 'blue',
  },
  {
    value: 'wxpay',
    label: '微信支付',
    description: '适合移动端场景的快捷支付方式',
    icon: 'chat',
    color: 'green',
  },
  {
    value: 'bank',
    label: '银行卡支付',
    description: '保留传统支付方式入口，不发起真实扣费',
    icon: 'credit_card',
    color: 'orange',
  },
] as const;

const currentHeroOffer = computed(() => getSelectedOffer(activeTier.value));
const currentHeroGroup = computed(() => demoSubscriptionCatalog[activeTier.value]);
const currentHeroBullets = computed(() => {
  const offer = currentHeroOffer.value;

  return [
    `${currentHeroGroup.value.badge}主推`,
    `${offer.featureSummary.length} 项核心权益`,
    offer.autoRenewHint ?? getOfferSupportText(offer),
  ];
});

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) {
    return '0';
  }

  const digits = Number.isInteger(amount) ? 0 : 1;
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const getOfferSavings = (offer: DemoOffer): number => {
  if (!offer.originalAmount) {
    return 0;
  }

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
    return offer.amount < 1 ? '适合首次体验开通' : '适合按单次快速开通';
  }

  if (offer.autoRenewHint) {
    return '适合长期稳定使用';
  }

  return offer.durationDays ? `适合 ${offer.durationDays} 天周期使用` : '适合阶段性使用';
};

const getOfferCompactDescription = (offer: DemoOffer): string => {
  if (offer.billingMode === 'usage') {
    return offer.amount < 1 ? '快速体验支付与状态联动。' : '适合正式单次开通与演示。';
  }

  if (offer.durationDays) {
    return `适合 ${offer.durationDays} 天周期使用与稳定筛查。`;
  }

  return offer.description;
};

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
  const base: DemoPaymentInfo = {
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
    base.originalAmount = offer.originalAmount;
    const discount = Number((offer.originalAmount - offer.amount).toFixed(1));
    if (discount > 0) {
      base.discount = discount;
      base.discountReason = '对比原价节省';
    }
  }

  if (offer.autoRenewHint) {
    base.autoRenewHint = offer.autoRenewHint;
  }

  return base;
};

const buildDemoStatusFromOffer = (offer: DemoOffer): DemoSubscriptionStatus => {
  const expireDate =
    offer.billingMode === 'duration' && offer.durationDays
      ? date.formatDate(
          new Date(Date.now() + offer.durationDays * 24 * 60 * 60 * 1000),
          'YYYY-MM-DD',
        )
      : '单次有效';

  const base: DemoSubscriptionStatus = {
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
    base.renewalNote = offer.statusCard.renewalNote;
  }

  return base;
};

const isDemoSubscriptionStatus = (value: unknown): value is DemoSubscriptionStatus => {
  if (!value || typeof value !== 'object') {
    return false;
  }

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
    title: '已检测到真实账号权益',
    subtitle: '当前尚未应用本地订阅状态，右侧展示为账号真实权益的只读回退信息。',
    icon: hasActiveSubscription ? 'shield' : 'payments',
    color: hasActiveSubscription ? 'secondary' : 'primary',
    badge: hasActiveSubscription ? '真实权益回退' : '真实按次回退',
    badgeColor: hasActiveSubscription ? 'secondary' : 'primary',
    planName: hasActiveSubscription ? '真实账号订阅' : '真实账号按次权益',
    tierLabel: '后端回退',
    expireDate: expiresAt ? date.formatDate(expiresAt, 'YYYY-MM-DD') : '按真实账号权益',
    quotaLabel: '可用次数',
    remainingCount: remainingCredits > 0 ? `${remainingCredits}次` : '按真实账号权益',
    featureTags: ['来自真实账号数据', '未改动真实权限控制', '完成套餐购买后将优先显示当前页面状态'],
    source: 'backend',
  };
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

  try {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 900);
    });

    const nextStatus = buildDemoStatusFromOffer(currentPaymentOffer.value);
    subscriptionStatus.value = nextStatus;
    hasDemoOverride.value = true;
    setItem(STORAGE_KEYS.DEMO_SUBSCRIPTION_STATE, nextStatus);
    paymentStep.value = 3;

    $q.notify({
      type: 'positive',
      message: `${nextStatus.planName} 支付完成`,
      caption: '右侧订阅状态已立即同步更新',
      position: 'top',
      icon: 'task_alt',
    });
  } finally {
    paymentProcessing.value = false;
  }
};

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
  apiConfig.value = {
    model: 'qwen-vl-max',
    confidence: 0.85,
    sensitivity: 0.9,
  };
  $q.notify({
    type: 'info',
    message: '已恢复默认配置',
    position: 'top',
  });
};

const savePreferences = () => {
  setItem(STORAGE_KEYS.USER_PREFERENCES, preferences.value);
  $q.notify({
    type: 'positive',
    message: '偏好设置已保存',
    position: 'top',
    icon: 'check_circle',
  });
};

const resetPreferences = () => {
  preferences.value = {
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
  };
  $q.notify({
    type: 'info',
    message: '已恢复默认偏好设置',
    position: 'top',
  });
};

const loadSavedConfig = () => {
  const savedAIConfig = getItem<typeof apiConfig.value>(STORAGE_KEYS.AI_CONFIG);
  if (savedAIConfig && typeof savedAIConfig === 'object') {
    apiConfig.value = { ...apiConfig.value, ...savedAIConfig };
  }

  const savedPreferences = getItem<typeof preferences.value>(STORAGE_KEYS.USER_PREFERENCES);
  if (savedPreferences && typeof savedPreferences === 'object') {
    preferences.value = { ...preferences.value, ...savedPreferences };
  }
};

const loadUserSubscription = async (): Promise<void> => {
  if (hasDemoOverride.value) {
    return;
  }

  try {
    const response = await userAPI.getProfile();

    if (hasDemoOverride.value) {
      return;
    }

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
  loadSavedConfig();

  const savedDemoState = readDemoSubscriptionState();
  if (savedDemoState) {
    subscriptionStatus.value = savedDemoState;
    hasDemoOverride.value = true;
  } else {
    void loadUserSubscription();
  }
});
</script>

<style scoped>
.api-settings-page {
  --api-settings-sticky-top: 88px;
}

.page-section-anchor {
  scroll-margin-top: 104px;
}

.settings-block-card {
  border: 0;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 251, 255, 0.98) 100%);
  box-shadow: 0 18px 42px rgba(15, 57, 87, 0.08);
}

.settings-block-card__section {
  padding: 22px 24px;
}

.settings-block-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.settings-block-card__summary {
  margin-top: 6px;
  color: #627b8e;
  font-size: 14px;
  line-height: 1.6;
}

.subscription-demo-shell {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(115, 179, 255, 0.24), transparent 34%),
    radial-gradient(circle at right center, rgba(43, 147, 164, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 250, 255, 0.98) 100%);
  box-shadow: 0 24px 60px rgba(15, 57, 87, 0.12);
}

.subscription-demo-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.3), transparent 30%),
    repeating-linear-gradient(
      135deg,
      rgba(18, 88, 138, 0.03) 0,
      rgba(18, 88, 138, 0.03) 1px,
      transparent 1px,
      transparent 18px
    );
  pointer-events: none;
}

.subscription-demo-hero {
  position: relative;
  padding: 30px;
  background: linear-gradient(
    135deg,
    rgba(233, 246, 255, 0.98) 0%,
    rgba(249, 252, 255, 0.96) 48%,
    rgba(240, 252, 249, 0.92) 100%
  );
  border-bottom: 1px solid rgba(28, 86, 129, 0.08);
}

.subscription-demo-hero__topline {
  row-gap: 8px;
}

.subscription-demo-hero__signal {
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(17, 108, 168, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: #0f5c8f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.subscription-demo-kicker {
  color: #0d6e8c;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.subscription-demo-title {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
  max-width: 560px;
  color: #11324d;
  font-size: clamp(2.45rem, 3vw, 4rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.01em;
  text-wrap: balance;
}

.subscription-demo-title__accent {
  display: block;
  color: #0e7a8f;
  text-shadow: 0 12px 24px rgba(17, 108, 168, 0.12);
}

.subscription-demo-subtitle {
  max-width: 560px;
  color: #5f7588 !important;
  line-height: 1.72;
}

.subscription-demo-stat-grid {
  row-gap: 10px;
}

.subscription-demo-stat-card {
  height: 100%;
  min-height: 132px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(244, 250, 255, 0.9) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 14px 28px rgba(15, 57, 87, 0.05);
}

.subscription-demo-stat-card__label {
  color: #70879a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-demo-stat-card__value {
  color: #11324d;
  margin-top: 12px;
  font-size: 20px;
  font-weight: 700;
}

.subscription-demo-stat-card__description {
  margin-top: 8px;
  color: #5e7488;
  font-size: 13px;
  line-height: 1.6;
}

.subscription-hero-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 82px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(14px);
}

.subscription-hero-chip__label {
  color: #688296;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.subscription-hero-chip__value {
  color: #123d59;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.subscription-demo-highlight {
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid rgba(21, 102, 151, 0.1);
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(233, 245, 255, 0.92) 100%
  );
  box-shadow: 0 18px 40px rgba(20, 70, 104, 0.12);
}

.subscription-demo-highlight__eyebrow {
  color: #116ca8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-demo-highlight__tier {
  align-self: flex-start;
  border-radius: 999px;
}

.subscription-demo-highlight__desc {
  line-height: 1.55;
}

.subscription-demo-highlight__price-band {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.8fr);
  gap: 12px;
  align-items: stretch;
}

.subscription-demo-highlight__price-note {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.subscription-demo-highlight__price-note-label,
.subscription-demo-highlight__metric-label {
  display: block;
  margin-bottom: 4px;
  color: #70879a;
  font-size: 12px;
  letter-spacing: 0.03em;
}

.subscription-demo-highlight__price-note-value {
  margin-bottom: 6px;
  color: #163a56;
  font-size: 16px;
  font-weight: 700;
}

.subscription-demo-highlight__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.subscription-demo-highlight__metric {
  padding: 11px 12px;
  border-radius: 16px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.7);
}

.subscription-demo-highlight__metric strong {
  color: #163a56;
  font-size: 15px;
  font-weight: 700;
}

.subscription-demo-highlight__cta {
  min-height: 46px;
  box-shadow: 0 16px 32px rgba(17, 108, 168, 0.2);
}

.subscription-demo-highlight__bullet-list {
  display: grid;
  gap: 10px;
}

.subscription-demo-highlight__bullet {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.68);
  color: #224760;
  font-size: 13px;
  line-height: 1.5;
}

.subscription-demo-highlight::after {
  content: '';
  position: absolute;
  inset: auto -50px -60px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(69, 162, 224, 0.15) 0%, transparent 72%);
}

.plan-stage-card {
  height: 100%;
  border-radius: 28px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.96) 100%);
  box-shadow: 0 18px 40px rgba(15, 57, 87, 0.08);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.plan-stage-card:hover,
.plan-stage-card--active {
  transform: translateY(-4px);
  box-shadow: 0 24px 46px rgba(15, 57, 87, 0.12);
}

.plan-stage-card--basic {
  border-color: rgba(25, 118, 210, 0.12);
}

.plan-stage-card--premium {
  border-color: rgba(255, 87, 34, 0.12);
}

.plan-stage-card__header {
  padding: 24px 24px 18px;
}

.plan-stage-card__offers {
  padding: 0 24px 20px;
}

.plan-stage-card__actions {
  padding: 0 24px 24px;
}

.plan-stage-card__focus-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: linear-gradient(135deg, rgba(240, 248, 252, 0.92) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.plan-stage-card__focus-label {
  color: #70879a;
  font-size: 12px;
  letter-spacing: 0.05em;
}

.plan-stage-card__focus-name {
  color: #173852;
  font-size: 15px;
  font-weight: 700;
}

.plan-stage-card__focus-price {
  color: #153d59;
  font-size: 20px;
  font-weight: 700;
}

.plan-stage-card__focus-price span {
  font-size: 13px;
  font-weight: 500;
  color: #668095;
}

.plan-stage-card__focus-saving {
  color: #0a7f5a;
  font-size: 12px;
  font-weight: 600;
}

.plan-stage-card__selected-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #5d788d;
  font-size: 12px;
  line-height: 1.5;
}

.plan-feature-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 11px 13px;
  border-radius: 18px;
  background: rgba(242, 248, 252, 0.88);
  border: 1px solid rgba(17, 76, 114, 0.06);
  color: #33556e;
  font-size: 13px;
}

.offer-tile {
  width: 100%;
  min-height: 132px;
  padding: 14px;
  border: 1px solid rgba(17, 76, 114, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.offer-tile__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.offer-tile__saving {
  color: #0a7f5a;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.offer-tile__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 38px;
  line-height: 1.55;
}

.offer-tile__price-row {
  gap: 6px;
}

.offer-tile__price-unit {
  color: #688296;
  font-size: 12px;
  margin-bottom: 2px;
}

.offer-tile__footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  color: #688296;
  font-size: 12px;
}

.offer-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(25, 118, 210, 0.22);
  box-shadow: 0 18px 28px rgba(17, 76, 114, 0.08);
}

.offer-tile--active {
  border-color: rgba(25, 118, 210, 0.32);
  background: linear-gradient(180deg, rgba(235, 246, 255, 0.96) 0%, rgba(255, 255, 255, 0.96) 100%);
  box-shadow: 0 16px 28px rgba(25, 118, 210, 0.12);
}

.offer-tile--usage {
  background: linear-gradient(180deg, rgba(241, 251, 248, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.comparison-card,
.upgrade-option-card {
  border: 0;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 18px 42px rgba(15, 57, 87, 0.1);
}

.subscription-status-card {
  position: relative;
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.98) 100%);
  box-shadow:
    0 18px 42px rgba(15, 57, 87, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.subscription-status-card__header,
.subscription-status-card__body,
.subscription-status-card__footer {
  position: relative;
  padding: 20px 22px;
}

.subscription-status-card__header {
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(240, 248, 252, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.subscription-status-card__header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(17, 108, 168, 0.92) 0%, rgba(43, 147, 164, 0.65) 46%, transparent 100%);
}

.subscription-status-card__body,
.subscription-status-card__footer {
  background: transparent;
}

.subscription-status-card__separator {
  opacity: 0.56;
}

.subscription-status-card__eyebrow {
  color: #6b8397;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-status-card__summary {
  color: #5c7488;
  font-size: 14px;
  line-height: 1.7;
}

.subscription-status-card__icon-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 24px rgba(15, 57, 87, 0.08);
}

.subscription-status-chip {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.subscription-status-chip--primary {
  color: #115d93;
  background: rgba(17, 108, 168, 0.1);
  border: 1px solid rgba(17, 108, 168, 0.12);
}

.subscription-status-chip--muted {
  color: #6b5b22;
  background: rgba(180, 125, 31, 0.1);
  border: 1px solid rgba(180, 125, 31, 0.14);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.status-grid__item {
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
}

.status-grid__label {
  margin-bottom: 5px;
  color: #688296;
  font-size: 12px;
  letter-spacing: 0.03em;
}

.status-grid__value {
  color: #18364d;
  font-weight: 600;
  line-height: 1.6;
}

.status-grid__value--accent {
  color: #0f6caa;
}

.status-feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  border: 1px solid rgba(17, 76, 114, 0.07);
  background: rgba(248, 251, 253, 0.92);
}

.demo-feature-item,
.demo-success-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(245, 250, 255, 0.94);
}

.comparison-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.98) 100%);
}

.config-brief-card,
.config-slider-card {
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(247, 251, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.config-brief-card--accent {
  background: rgba(255, 249, 242, 0.92);
  border-color: rgba(237, 137, 54, 0.12);
}

.config-brief-card__label {
  color: #72889a;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.config-brief-card__value {
  margin-top: 8px;
  color: #153b57;
  font-size: 24px;
  font-weight: 700;
}

.config-brief-card__desc {
  margin-top: 6px;
  color: #688296;
  font-size: 12px;
  line-height: 1.6;
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

.preference-panel-card {
  border-color: rgba(17, 76, 114, 0.08);
  box-shadow: none;
}

.comparison-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}

.comparison-table :deep(th) {
  color: #476177;
  font-weight: 700;
}

.comparison-table :deep(td),
.comparison-table :deep(th) {
  padding: 12px 10px;
}

.comparison-table :deep(tbody tr:nth-child(odd)) {
  background: rgba(242, 248, 252, 0.8);
}

.demo-payment-dialog {
  width: min(92vw, 860px);
  max-width: 860px;
  border-radius: 28px;
  overflow: hidden;
}

.demo-payment-dialog__header {
  color: white;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(17, 62, 93, 0.98) 0%, rgba(26, 98, 125, 0.98) 52%, rgba(36, 128, 144, 0.94) 100%);
}

.demo-payment-dialog__caption {
  color: rgba(255, 255, 255, 0.72);
}

.demo-payment-dialog__hero-amount {
  padding: 10px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.payment-stepper-shell :deep(.q-stepper__header) {
  padding: 8px 14px 0;
  background: rgba(247, 251, 255, 0.72);
}

.payment-stepper-shell :deep(.q-stepper__tab) {
  min-height: 62px;
}

.payment-stepper-shell :deep(.q-stepper__title) {
  font-weight: 700;
}

.payment-stepper-shell :deep(.q-stepper__label) {
  color: #33556e;
}

.demo-order-card,
.demo-success-card {
  border-radius: 20px;
  border-color: rgba(17, 76, 114, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 250, 255, 0.98) 100%);
}

.checkout-aside-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(242, 249, 252, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 14px 30px rgba(15, 57, 87, 0.06);
}

.checkout-aside-card__head,
.checkout-aside-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.checkout-aside-card__title {
  color: #153b57;
  font-size: 16px;
  font-weight: 700;
}

.checkout-aside-card__badge {
  padding: 6px 10px;
  border-radius: 999px;
  color: #12689f;
  background: rgba(17, 108, 168, 0.1);
  font-size: 12px;
  font-weight: 700;
}

.checkout-aside-card__list {
  display: grid;
  gap: 10px;
}

.checkout-aside-card__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 76, 114, 0.06);
}

.checkout-aside-card__footer {
  padding-top: 14px;
  border-top: 1px solid rgba(17, 76, 114, 0.08);
}

.checkout-aside-card__footer div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkout-aside-card__footer span {
  color: #70879a;
  font-size: 12px;
}

.checkout-aside-card__footer strong {
  color: #153b57;
  font-size: 14px;
}

.payment-summary {
  padding: 18px;
  border-radius: 18px;
  background: rgba(244, 249, 253, 0.96);
  border: 1px solid rgba(17, 76, 114, 0.07);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.summary-row.discount-row {
  color: #13795b;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(19, 121, 91, 0.08);
}

.summary-row.total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 76, 114, 0.08);
}

.payment-selection-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(244, 249, 253, 0.92);
}

.payment-selection-banner__label {
  color: #70879a;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.payment-selection-banner__value {
  color: #163a56;
  font-size: 15px;
  font-weight: 700;
}

.payment-method-card {
  border-radius: 20px;
  border-color: rgba(17, 76, 114, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 251, 255, 0.94) 100%);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.payment-method-card:hover,
.payment-method-card--active {
  transform: translateY(-2px);
  border-color: rgba(25, 118, 210, 0.28);
  box-shadow: 0 16px 28px rgba(17, 76, 114, 0.08);
}

.demo-payment-note {
  padding: 12px 14px;
  border-radius: 16px;
  color: #1b5d78;
  background: rgba(43, 147, 164, 0.08);
  border: 1px solid rgba(43, 147, 164, 0.12);
}

.payment-confirm-btn {
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(33, 150, 83, 0.24);
}

.agreement-section {
  padding: 14px;
  border-radius: 18px;
  background: rgba(244, 249, 253, 0.94);
  border: 1px solid rgba(17, 76, 114, 0.08);
}

.agreement-link {
  color: #116ca8;
  cursor: pointer;
  font-weight: 700;
}

.agreement-link:hover {
  text-decoration: underline;
}

.upgrade-dialog-card {
  width: min(92vw, 720px);
  max-width: 720px;
  border-radius: 24px;
  overflow: hidden;
}

.upgrade-option-card {
  border: 1px solid rgba(17, 76, 114, 0.08);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.upgrade-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(15, 57, 87, 0.08);
}

.copyright-card {
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.copyright-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(112, 71, 180, 0.16);
}

.certificate-preview-image {
  max-height: 72vh;
  border-radius: 12px;
  background: #f8fafc;
}

@media (max-width: 1023px) {
  .subscription-demo-hero,
  .plan-stage-card__header,
  .plan-stage-card__offers,
  .plan-stage-card__actions,
  .settings-block-card__section,
  .subscription-status-card__header,
  .subscription-status-card__body,
  .subscription-status-card__footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .page-section-anchor {
    scroll-margin-top: 88px;
  }

}

@media (max-width: 599px) {
  .subscription-demo-shell,
  .subscription-status-card,
  .comparison-card,
  .settings-block-card {
    border-radius: 22px;
  }

  .subscription-demo-title {
    font-size: 2.2rem;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .subscription-demo-highlight__price-band,
  .subscription-demo-highlight__metrics {
    grid-template-columns: 1fr;
  }

  .subscription-demo-stat-card,
  .subscription-hero-chip,
  .config-brief-card,
  .config-slider-card {
    min-height: auto;
  }

  .plan-stage-card__focus-strip,
  .plan-stage-card__selected-meta,
  .payment-selection-banner,
  .checkout-aside-card__head,
  .checkout-aside-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .offer-tile {
    min-height: auto;
  }

  .demo-payment-dialog,
  .upgrade-dialog-card {
    width: 96vw;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .subscription-demo-shell,
  .settings-block-card,
  .plan-stage-card,
  .subscription-status-card,
  .comparison-card,
  .demo-order-card,
  .demo-success-card,
  .upgrade-option-card {
    background: var(--app-surface) !important;
  }

  .subscription-demo-hero,
  .subscription-demo-stat-card,
  .subscription-demo-hero__signal,
  .subscription-hero-chip,
  .subscription-demo-highlight,
  .subscription-status-card__header,
  .subscription-demo-highlight__price-note,
  .subscription-demo-highlight__metric,
  .subscription-demo-highlight__bullet,
  .plan-stage-card__focus-strip,
  .plan-stage-card__selected-meta,
  .offer-tile,
  .status-grid__item,
  .status-feature-item,
  .config-brief-card,
  .config-slider-card,
  .preference-panel-card,
  .demo-feature-item,
  .demo-success-item,
  .payment-summary,
  .agreement-section,
  .subscription-status-card__icon-shell,
  .checkout-aside-card,
  .checkout-aside-card__item,
  .payment-selection-banner,
  .payment-method-card {
    background: var(--app-elevated-bg) !important;
    border-color: var(--app-border-default) !important;
  }

  .subscription-demo-title,
  .subscription-demo-title__accent,
  .subscription-demo-stat-card__value,
  .subscription-hero-chip__value,
  .status-grid__value,
  .subscription-demo-highlight__metric strong,
  .subscription-demo-highlight__price-note-value,
  .config-brief-card__value,
  .config-slider-card__title,
  .plan-stage-card__focus-name,
  .plan-stage-card__focus-price,
  .checkout-aside-card__title,
  .checkout-aside-card__footer strong,
  .payment-selection-banner__value {
    color: var(--q-grey-2) !important;
  }

  .subscription-status-card__summary,
  .subscription-demo-kicker,
  .subscription-demo-subtitle,
  .subscription-demo-stat-card__label,
  .subscription-demo-stat-card__description,
  .subscription-hero-chip__label,
  .subscription-status-card__eyebrow,
  .status-grid__label,
  .subscription-status-card__footer .text-caption,
  .subscription-demo-highlight__price-note-label,
  .subscription-demo-highlight__metric-label,
  .subscription-demo-highlight__bullet,
  .plan-stage-card__selected-meta,
  .plan-stage-card__focus-label,
  .plan-stage-card__focus-price span,
  .plan-stage-card__focus-saving,
  .config-brief-card__label,
  .config-brief-card__desc,
  .checkout-aside-card__footer span,
  .payment-selection-banner__label {
    color: var(--app-text-secondary) !important;
  }

  .subscription-status-chip--primary,
  .subscription-status-chip--muted,
  .checkout-aside-card__badge {
    background: rgba(148, 163, 184, 0.12) !important;
    border-color: rgba(148, 163, 184, 0.24) !important;
    color: var(--q-grey-3) !important;
  }

  .demo-payment-dialog__hero-amount {
    background: rgba(148, 163, 184, 0.12) !important;
    border-color: rgba(148, 163, 184, 0.24) !important;
  }

  .subscription-demo-shell,
  .plan-stage-card,
  .subscription-status-card,
  .comparison-card {
    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.22) !important;
  }

  .subscription-hero-chip,
  .subscription-demo-hero__signal {
    background: rgba(18, 29, 41, 0.82) !important;
    border-color: rgba(148, 163, 184, 0.12) !important;
  }

  .comparison-table tbody tr:nth-child(odd) {
    background: rgba(148, 163, 184, 0.06) !important;
  }

  .agreement-link {
    color: var(--q-primary) !important;
  }

  .certificate-preview-image {
    background: var(--app-elevated-bg) !important;
  }
}
</style>
