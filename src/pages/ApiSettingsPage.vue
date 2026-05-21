<template>
  <q-page class="q-pa-md app-gradient-page api-settings-page">
    <section class="api-settings-page__content">
      <SubscriptionStatusBanner
        :subscription-status="subscriptionStatus"
        @open-upgrade="showUpgradeDialog = true"
      />

      <SubscriptionHeroSection
        :subscription-billing-filter="subscriptionBillingFilter"
        :subscription-display-mode="subscriptionDisplayMode"
        @update:display-mode="setSubscriptionDisplayMode"
        @update:billing-filter="setSubscriptionBillingFilter"
      />

      <SubscriptionPricingGrid
        :visible-plan-groups="visiblePlanGroups"
        :selected-offer-by-tier="selectedOfferByTier"
        :format-currency="formatCurrency"
        :get-action-label="getActionLabel"
        :get-offer-savings-text="getOfferSavingsText"
        @select-offer="selectOffer"
        @open-payment="openPaymentDialog"
      />

      <SubscriptionComparisonSection :plan-comparison-rows="planComparisonRows" />

      <SubscriptionTrustSection
        :sorted-software-copyrights="sortedSoftwareCopyrights"
        @preview-certificate="openCertificatePreview"
      />
    </section>

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

          <q-step :name="3" title="完成支付" icon="verified">
            <div class="q-pa-xl text-center payment-step-content">
              <q-icon
                :name="paymentStepThreeIcon"
                :color="paymentStepThreeIconColor"
                size="72px"
              />
              <div class="text-h5 text-weight-bold q-mt-md">{{ paymentStepThreeTitle }}</div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                {{ paymentStepThreeSubtitle }}
              </div>

              <q-card flat bordered class="q-mt-lg demo-success-card">
                <q-card-section>
                  <div class="text-subtitle2 text-weight-medium">订单信息</div>
                  <div class="row q-col-gutter-sm q-mt-sm">
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">套餐名称</span>
                        <span class="text-weight-medium">{{ paymentInfo.planName }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">支付方式</span>
                        <span class="text-weight-medium">{{ currentPaymentMethodLabel }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">订单金额</span>
                        <span class="text-weight-medium">¥{{ formatCurrency(paymentInfo.amount) }}</span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="demo-success-item">
                        <span class="text-grey-6">商户订单号</span>
                        <span class="text-weight-medium">
                          {{ paymentGatewayData?.outTradeNo || '支付发起后生成' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card
                v-if="paymentQrCodeDataUrl"
                flat
                bordered
                class="q-mt-lg payment-qrcode-card"
              >
                <q-card-section class="text-center">
                  <div class="text-subtitle2 text-weight-medium">{{ paymentQrCodeTitle }}</div>
                  <div class="text-caption text-grey-7 q-mt-xs">{{ paymentQrCodeHint }}</div>
                  <q-img
                    :src="paymentQrCodeDataUrl"
                    :alt="paymentQrCodeTitle"
                    fit="contain"
                    class="payment-qrcode-image q-mx-auto q-mt-md"
                  />
                </q-card-section>
              </q-card>

              <div
                v-if="paymentGatewayError"
                class="text-caption text-negative q-mt-md payment-step-error"
              >
                {{ paymentGatewayError }}
              </div>
            </div>
          </q-step>

          <template #navigation>
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
                  <template #loading>
                    <q-spinner-dots color="white" />
                  </template>
                </q-btn>
                <q-btn
                  v-else-if="paymentStep === 3 && paymentDisplayState !== 'success'"
                  flat
                  color="grey-8"
                  label="手动刷新状态"
                  icon="sync"
                  no-caps
                  @click="refreshPaymentStatus"
                  :loading="paymentChecking"
                  :disable="paymentProcessing"
                  class="q-mr-sm"
                />
                <q-btn
                  v-if="paymentStep === 3 && paymentPrimaryActionLabel"
                  unelevated
                  color="primary"
                  :label="paymentPrimaryActionLabel"
                  icon-right="arrow_forward"
                  no-caps
                  @click="openPaymentGateway"
                />
                <q-btn
                  v-else-if="paymentStep === 3 && paymentQrCodeDataUrl"
                  unelevated
                  color="primary"
                  label="复制支付链接"
                  icon="content_copy"
                  no-caps
                  @click="copyPaymentLink"
                />
                <q-btn
                  v-else-if="paymentStep === 3 && paymentDisplayState === 'success'"
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
import SubscriptionComparisonSection from 'src/components/subscription/SubscriptionComparisonSection.vue';
import SubscriptionHeroSection from 'src/components/subscription/SubscriptionHeroSection.vue';
import SubscriptionPricingGrid from 'src/components/subscription/SubscriptionPricingGrid.vue';
import SubscriptionStatusBanner from 'src/components/subscription/SubscriptionStatusBanner.vue';
import SubscriptionTrustSection from 'src/components/subscription/SubscriptionTrustSection.vue';
import { useSubscriptionPlans } from 'src/composables/useSubscriptionPlans';

const {
  activeCertificate,
  agreePaymentTerms,
  cancelPayment,
  copyPaymentLink,
  currentPaymentMethodLabel,
  currentPaymentOffer,
  demoPlanGroups,
  finishDemoPayment,
  formatCurrency,
  getActionLabel,
  getOfferCycleText,
  getOfferSavingsText,
  getSelectedOffer,
  handleUpgrade,
  openCertificatePreview,
  openPaymentDialog,
  openPaymentGateway,
  paymentAgreementTab,
  paymentChecking,
  paymentDisplayState,
  paymentGatewayData,
  paymentGatewayError,
  paymentInfo,
  paymentMethods,
  paymentPrimaryActionLabel,
  paymentProcessing,
  paymentQrCodeDataUrl,
  paymentQrCodeHint,
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
  selectedOfferByTier,
  selectedPaymentMethod,
  selectOffer,
  setSubscriptionBillingFilter,
  setSubscriptionDisplayMode,
  showPaymentAgreement,
  showPaymentAgreementDialog,
  showPaymentDialog,
  showUpgradeDialog,
  sortedSoftwareCopyrights,
  stepper,
  subscriptionBillingFilter,
  subscriptionDisplayMode,
  subscriptionStatus,
  visiblePlanGroups,
} = useSubscriptionPlans();
</script>

<style scoped>
.api-settings-page {
  padding-top: 20px;
  padding-bottom: 40px;
}

.api-settings-page__content {
  display: grid;
  gap: 22px;
  max-width: 1240px;
  margin: 0 auto;
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
  border-radius: 22px;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.upgrade-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(15, 57, 87, 0.08);
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

.certificate-preview-image {
  max-height: 72vh;
  border-radius: 12px;
  background: #f8fafc;
}

@media (max-width: 599px) {
  .demo-payment-dialog,
  .upgrade-dialog-card {
    width: 96vw;
  }

  .payment-selection-banner,
  .checkout-aside-card__head,
  .checkout-aside-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .demo-order-card,
  .demo-success-card,
  .upgrade-option-card {
    background: var(--app-surface) !important;
  }

  .checkout-aside-card,
  .checkout-aside-card__item,
  .payment-summary,
  .agreement-section,
  .payment-selection-banner,
  .payment-method-card {
    background: var(--app-elevated-bg) !important;
    border-color: var(--app-border-default) !important;
  }

  .checkout-aside-card__title,
  .checkout-aside-card__footer strong,
  .payment-selection-banner__value {
    color: var(--q-grey-2) !important;
  }

  .checkout-aside-card__footer span,
  .payment-selection-banner__label {
    color: var(--app-text-secondary) !important;
  }

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
