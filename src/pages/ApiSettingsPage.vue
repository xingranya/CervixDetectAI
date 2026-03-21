<template>
  <q-page class="q-pa-md app-gradient-page api-settings-page">
    <!-- 页面头部 -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 q-mb-xs">
          <q-icon name="workspace_premium" class="q-mr-sm" color="primary" />
          套餐订阅
        </div>
        <div class="text-subtitle2 text-grey-7">选择适合您的 AI 辅助筛查订阅计划，查看当前套餐权益与能力差异</div>
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
                </div>

                <div class="subscription-demo-kicker q-mt-md">面向门诊、体检与专科筛查场景</div>
                <div class="subscription-demo-title q-mt-sm">
                  用更合适的套餐
                  <span class="subscription-demo-title__accent">匹配实际筛查规模</span>
                </div>
                <div class="text-body1 text-grey-7 q-mt-sm subscription-demo-subtitle">
                  从按次开通到年度持续使用，按机构规模选择更合适的检测能力、报告支持与服务范围，
                  减少重复采购，也让不同阶段的投入更清晰。
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
                    <div class="subscription-demo-highlight__eyebrow">推荐套餐</div>
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
                        <div class="subscription-demo-highlight__price-note-label">适用说明</div>
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
                        <span class="subscription-demo-highlight__metric-label">适用阶段</span>
                        <strong>{{ currentHeroOffer.billingLabel }}</strong>
                      </div>
                      <div class="subscription-demo-highlight__metric">
                        <span class="subscription-demo-highlight__metric-label">权益覆盖</span>
                        <strong>{{ currentHeroOffer.featureSummary.length }} 项</strong>
                      </div>
                      <div class="subscription-demo-highlight__metric">
                        <span class="subscription-demo-highlight__metric-label">服务周期</span>
                        <strong>{{ getOfferCycleText(currentHeroOffer) }}</strong>
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
              <q-icon name="workspace_premium" color="primary" class="q-mr-sm" />
              套餐服务优势
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>按使用规模灵活开通</q-item-label>
                  <q-item-label caption>支持按次、按月、半年和年度周期选择，便于按预算安排。</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>基础与高阶能力分层清晰</q-item-label>
                  <q-item-label caption>常规筛查与高阶协同场景分别对应不同套餐，选型更直接。</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>报告与管理支持更完整</q-item-label>
                  <q-item-label caption>高阶套餐覆盖多格式报告、随访管理与自定义水印等扩展能力。</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>长期使用成本更可控</q-item-label>
                  <q-item-label caption>周期越长，单位时间投入越稳定，适合固定筛查计划和持续运营。</q-item-label>
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
                class="compliance-copyright-card rounded-borders q-pa-sm relative-position overflow-hidden cursor-pointer copyright-card"
                @click="openCertificatePreview(copyright)"
              >
                <div class="row items-center relative-position" style="z-index: 1">
                  <q-icon name="verified" color="primary" size="sm" class="q-mr-sm col-auto" />
                  <div class="col">
                    <div
                      class="text-subtitle2 text-weight-bold compliance-copyright-card__title"
                      style="line-height: 1.2"
                    >
                      {{ copyright.name }}
                      <q-badge color="blue-1" text-color="primary" class="q-ml-xs" align="top"
                        >{{ copyright.version }}</q-badge
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="row q-mt-xs text-caption q-pl-lg relative-position compliance-copyright-card__meta"
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
                  class="absolute-bottom-right compliance-copyright-card__decor"
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
          <div class="text-overline demo-payment-dialog__eyebrow">订单确认</div>
          <div class="row items-center justify-between q-mt-sm q-col-gutter-md">
            <div class="col">
              <div class="text-h6 demo-payment-dialog__title">
                <q-icon name="workspace_premium" class="q-mr-sm" />
                套餐开通
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
          <div class="text-caption q-mt-sm demo-payment-dialog__note">
            请确认本次所选套餐、周期与支付方式，开通后即可按所购权益使用相关服务。
          </div>
        </q-card-section>

        <q-stepper v-model="paymentStep" ref="stepper" flat class="payment-stepper-shell">
          <q-step :name="1" title="订单确认" icon="receipt" :done="paymentStep > 1">
            <div class="q-pa-md payment-step-content">
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
                  <div class="text-h6 q-mb-md">套餐权益概览</div>
                  <div class="checkout-aside-card">
                    <div class="checkout-aside-card__head">
                      <div class="checkout-aside-card__title">本次包含内容</div>
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
                        <span>服务周期</span>
                        <strong>{{ getOfferCycleText(currentPaymentOffer) }}</strong>
                      </div>
                      <div>
                        <span>套餐金额</span>
                        <strong>¥{{ formatCurrency(paymentInfo.amount) }}</strong>
                      </div>
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
            <div class="q-pa-md payment-step-content">
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
            </div>
          </q-step>

          <q-step :name="3" title="支付完成" icon="verified">
            <div class="q-pa-xl text-center payment-step-content">
              <q-icon name="task_alt" color="positive" size="72px" />
              <div class="text-h5 text-weight-bold q-mt-md">支付已完成</div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                {{ subscriptionStatus.planName }} 已开通，可按当前套餐权益使用相关服务。
              </div>
              <q-card flat bordered class="q-mt-lg demo-success-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-medium">开通结果</div>
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
            <q-stepper-navigation class="q-pa-md payment-stepper-navigation">
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
        <q-card-section class="upgrade-dialog-card__header">
          <div class="text-h6">切换订阅套餐</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body1 q-mb-md">
            选择合适套餐后，可直接进入订单确认与支付流程。
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
          <q-btn flat round dense icon="close" v-close-popup aria-label="关闭对话框" />
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
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
import { useSubscriptionPlans } from 'src/composables/useSubscriptionPlans';

const {
  activeCertificate,
  activeTier,
  agreePaymentTerms,
  cancelPayment,
  currentHeroBullets,
  currentHeroGroup,
  currentHeroOffer,
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
  paymentAgreementTab,
  paymentInfo,
  paymentMethods,
  paymentProcessing,
  paymentStep,
  planComparisonRows,
  previewVisible,
  processPayment,
  resetCertificatePreview,
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
} = useSubscriptionPlans();
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
  border: 1px solid rgba(22, 71, 104, 0.08);
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(126, 176, 214, 0.16), transparent 32%),
    radial-gradient(circle at right center, rgba(46, 121, 138, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.98) 100%);
  box-shadow: 0 22px 54px rgba(15, 57, 87, 0.1);
}

.subscription-demo-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.24), transparent 28%),
    repeating-linear-gradient(
      135deg,
      rgba(20, 71, 104, 0.024) 0,
      rgba(20, 71, 104, 0.024) 1px,
      transparent 1px,
      transparent 20px
    );
  pointer-events: none;
}

.subscription-demo-hero {
  position: relative;
  padding: 30px;
  background: linear-gradient(
    135deg,
    rgba(245, 249, 252, 0.98) 0%,
    rgba(252, 253, 255, 0.96) 48%,
    rgba(246, 250, 249, 0.94) 100%
  );
  border-bottom: 1px solid rgba(22, 71, 104, 0.07);
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
  color: #2b6981;
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
  color: #195f74;
  text-shadow: 0 10px 18px rgba(24, 95, 116, 0.08);
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
  border: 1px solid rgba(22, 71, 104, 0.08);
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(245, 249, 252, 0.94) 100%
  );
  box-shadow: 0 18px 34px rgba(20, 70, 104, 0.09);
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
  background: radial-gradient(circle, rgba(87, 141, 170, 0.12) 0%, transparent 72%);
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
    radial-gradient(circle at top right, rgba(121, 164, 196, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(247, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.94) 100%);
}

.subscription-status-card__header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(31, 94, 126, 0.76) 0%, rgba(69, 128, 144, 0.48) 42%, transparent 100%);
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

.compliance-copyright-card {
  border: 1px solid rgba(22, 71, 104, 0.08);
  background: linear-gradient(135deg, rgba(246, 250, 252, 0.98) 0%, rgba(239, 247, 250, 0.96) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.compliance-copyright-card__title {
  color: #18445f;
}

.compliance-copyright-card__meta {
  color: #4f7288;
}

.compliance-copyright-card__decor {
  color: rgba(140, 186, 205, 0.45);
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
  max-height: min(88vh, 920px);
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 251, 253, 0.99) 100%);
  box-shadow: 0 30px 90px rgba(8, 31, 46, 0.26);
}

.demo-payment-dialog__header {
  background:
    radial-gradient(circle at top right, rgba(56, 132, 214, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(243, 249, 255, 0.98) 0%, rgba(232, 243, 255, 0.98) 100%);
  padding: 20px 24px 18px;
  border-bottom: 1px solid rgba(25, 118, 210, 0.1);
}

.demo-payment-dialog__eyebrow {
  color: #3b6f9f;
  letter-spacing: 0.08em;
}

.demo-payment-dialog__title {
  color: #163e6b;
  font-weight: 700;
}

.demo-payment-dialog__caption {
  color: #4f6f91;
}

.demo-payment-dialog__note {
  color: #365b84;
}

.demo-payment-dialog__hero-amount {
  padding: 12px 18px;
  border-radius: 20px;
  border: 1px solid rgba(25, 118, 210, 0.16);
  background: linear-gradient(135deg, #2d7dd2 0%, #1e67b1 100%);
  color: #ffffff;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 10px 24px rgba(30, 103, 177, 0.22);
}

.payment-stepper-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.payment-stepper-shell :deep(.q-stepper__header) {
  padding: 10px 18px 0;
  background: rgba(248, 251, 253, 0.94);
  border-bottom: 1px solid rgba(22, 71, 104, 0.06);
}

.payment-stepper-shell :deep(.q-stepper__tab) {
  min-height: 58px;
}

.payment-stepper-shell :deep(.q-stepper__title) {
  font-weight: 700;
}

.payment-stepper-shell :deep(.q-stepper__label) {
  color: #33556e;
}

.payment-stepper-shell :deep(.q-stepper__content),
.payment-stepper-shell :deep(.q-stepper__nav) {
  background: transparent;
}

.payment-step-content {
  max-height: min(54vh, 520px);
  overflow-y: auto;
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

.payment-confirm-btn {
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(33, 150, 83, 0.24);
}

.payment-stepper-navigation {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: linear-gradient(180deg, rgba(248, 251, 253, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
  border-top: 1px solid rgba(22, 71, 104, 0.07);
  backdrop-filter: blur(12px);
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
  border: 1px solid rgba(22, 71, 104, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 251, 253, 0.99) 100%);
  box-shadow: 0 24px 72px rgba(8, 31, 46, 0.22);
}

.upgrade-dialog-card__header {
  color: white;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 30%),
    linear-gradient(135deg, rgba(24, 66, 90, 0.98) 0%, rgba(36, 94, 116, 0.98) 100%);
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
  box-shadow: 0 14px 24px rgba(28, 78, 103, 0.12);
}

.copyright-card:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
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
  .payment-method-card,
  .compliance-copyright-card {
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
  .compliance-copyright-card__meta,
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
    background: linear-gradient(135deg, rgba(45, 125, 210, 0.86) 0%, rgba(30, 103, 177, 0.88) 100%) !important;
    border-color: rgba(96, 165, 250, 0.28) !important;
    color: #fff !important;
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

  .payment-stepper-navigation {
    background: rgba(15, 23, 42, 0.92) !important;
    border-color: var(--app-border-default) !important;
  }
}
</style>
