<template>
  <section class="saas-pricing-shell">
    <div v-if="durationGroups.length" class="saas-pricing-shell__plans">
      <article
        v-for="group in durationGroups"
        :key="group.tier"
        class="saas-plan-card"
        :class="[
          `saas-plan-card--${group.tier}`,
          { 'saas-plan-card--featured': group.tier === 'premium' },
        ]"
      >
        <div v-if="group.tier === 'premium'" class="saas-plan-card__floating-tag">主推方案</div>

        <div class="saas-plan-card__head">
          <div class="saas-plan-card__meta">
            <span :class="['saas-plan-card__eyebrow', group.accentTextClass]">{{ group.eyebrow }}</span>
            <q-badge :color="group.badgeColor">{{ group.badge }}</q-badge>
          </div>
          <q-avatar :color="group.avatarColor" text-color="white" size="48px">
            <q-icon :name="group.icon" size="24px" />
          </q-avatar>
        </div>

        <div class="saas-plan-card__title">{{ group.title }}</div>
        <div class="saas-plan-card__summary">{{ group.summary }}</div>

        <div
          v-if="isMonthlyDualOffer(group)"
          class="saas-plan-card__monthly-switch"
        >
          <button
            v-for="offer in group.visibleOffers"
            :key="offer.code"
            type="button"
            class="saas-plan-card__monthly-option"
            :class="{
              'saas-plan-card__monthly-option--active':
                selectedOfferByTier[group.tier] === offer.code,
            }"
            @click="$emit('select-offer', group.tier, offer.code)"
          >
            <span class="saas-plan-card__monthly-option-title">{{ offer.label }}</span>
            <span class="saas-plan-card__monthly-option-meta">
              ¥{{ formatCurrency(offer.amount) }}/{{ offer.unitLabel }}
            </span>
          </button>
        </div>

        <div class="saas-plan-card__price-wrap">
          <div class="saas-plan-card__price-line">
            <div class="saas-plan-card__price">
              <span class="saas-plan-card__currency">¥</span>
              <strong>
                <CountUpNumber
                  :value="group.featuredOffer.amount"
                  :duration="760"
                  :decimals="Number.isInteger(group.featuredOffer.amount) ? 0 : 1"
                />
              </strong>
            </div>
            <div class="saas-plan-card__price-unit">/{{ group.featuredOffer.unitLabel }}</div>
          </div>

          <div
            v-if="group.featuredOffer.billingMode === 'duration' && group.featuredOffer.durationDays && group.featuredOffer.durationDays >= 365"
            class="saas-plan-card__price-caption"
          >
            折合每月 ¥<CountUpNumber
              :value="getMonthlyEquivalent(group.featuredOffer)"
              :duration="760"
              :decimals="1"
            />
          </div>
          <div
            v-else-if="group.featuredOffer.billingMode === 'duration' && group.featuredOffer.originalAmount"
            class="saas-plan-card__price-caption"
          >
            {{ getOfferSavingsText(group.featuredOffer) }}
          </div>
          <div
            v-if="isDefaultContinuousOffer(group)"
            class="saas-plan-card__price-hint"
          >
            当前展示：连续包月
          </div>
          <div
            v-if="isContinuousOffer(group.featuredOffer)"
            class="saas-plan-card__promo-note"
          >
            推荐用于日常稳定筛查，开通后可持续使用并减少重复下单成本
          </div>
        </div>

        <q-btn
          unelevated
          :color="group.actionColor"
          no-caps
          class="full-width saas-plan-card__cta"
          :label="getActionLabel(group.tier)"
          @click="$emit('open-payment', group.featuredOffer)"
        />

        <div class="saas-plan-card__feature-title">
          {{ group.tier === 'premium' ? '适合高频协同场景' : '适合常规筛查场景' }}
        </div>
        <div class="saas-plan-card__features">
          <div v-for="feature in group.features" :key="feature" class="saas-plan-card__feature">
            <q-icon name="check_circle" color="positive" size="16px" />
            <span>{{ feature }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="usageOffers.length" class="saas-pricing-shell__addon">
      <div class="saas-addon-card">
        <div class="saas-addon-card__header">
          <div>
            <div class="saas-addon-card__eyebrow">低频补充方案</div>
            <div class="saas-addon-card__title">单次正式开通</div>
            <div class="saas-addon-card__subtitle">
              适合按次启用正式诊断服务，不与主套餐卡并列承担长期采购决策。
            </div>
          </div>
          <div class="saas-addon-card__price">
            ¥<CountUpNumber
              :value="usagePrimaryOffer?.amount || 0"
              :duration="760"
              :decimals="usagePrimaryOffer && Number.isInteger(usagePrimaryOffer.amount) ? 0 : 1"
            />
            <small>/{{ usagePrimaryOffer?.unitLabel }}</small>
          </div>
        </div>

        <div class="saas-addon-card__body">
          <div class="saas-addon-card__content">
            <div class="saas-addon-card__desc">{{ usagePrimaryOffer?.description }}</div>
            <div class="saas-addon-card__feature-list">
              <div
                v-for="feature in usagePrimaryOffer?.featureSummary.slice(0, 3)"
                :key="feature"
                class="saas-addon-card__feature-item"
              >
                <q-icon name="check_circle" color="positive" size="16px" />
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            color="primary"
            no-caps
            label="购买单次正式方案"
            class="saas-addon-card__cta"
            @click="$emit('open-payment', usagePrimaryOffer!)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CountUpNumber from 'src/components/common/CountUpNumber.vue';
import type { SubscriptionPlanGroupView } from 'src/composables/useSubscriptionPlans';
import type { DemoOffer, DemoPlanTier } from 'src/constants/demoSubscriptionCatalog';

const props = defineProps<{
  visiblePlanGroups: SubscriptionPlanGroupView[];
  selectedOfferByTier: Record<DemoPlanTier, string>;
  formatCurrency: (amount: number | undefined) => string;
  getActionLabel: (tier: DemoPlanTier) => string;
  getOfferSavingsText: (offer: DemoOffer) => string;
}>();

defineEmits<{
  (e: 'select-offer', tier: DemoPlanTier, offerCode: string): void;
  (e: 'open-payment', offer: DemoOffer): void;
}>();

const durationGroups = computed(() =>
  props.visiblePlanGroups.filter(
    (group) =>
      group.featuredOffer.billingMode === 'duration' &&
      group.visibleOffers.length > 0,
  ),
);

const usageOffers = computed(() =>
  props.visiblePlanGroups.flatMap((group) =>
    group.visibleOffers.filter((offer) => offer.billingMode === 'usage'),
  ),
);

const usagePrimaryOffer = computed(() => usageOffers.value[0] ?? null);

const isMonthlyDualOffer = (group: SubscriptionPlanGroupView) =>
  group.featuredOffer.billingMode === 'duration' &&
  group.visibleOffers.length > 1 &&
  group.visibleOffers.every((offer) => offer.durationDays === 30);

const isDefaultContinuousOffer = (group: SubscriptionPlanGroupView) =>
  group.featuredOffer.code.endsWith('-monthly-auto') && group.visibleOffers.length === 1;

const isContinuousOffer = (offer: DemoOffer) => offer.code.endsWith('-monthly-auto');

const getMonthlyEquivalent = (offer: DemoOffer): number => {
  if (!offer.durationDays || offer.durationDays <= 0) {
    return offer.amount;
  }

  const monthlyBase = offer.amount / (offer.durationDays / 30);
  return Number(monthlyBase.toFixed(1));
};
</script>

<style scoped lang="scss">
.saas-pricing-shell {
  display: grid;
  gap: 20px;
  width: 100%;
}

.saas-pricing-shell__plans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}

.saas-plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 57, 87, 0.06);
  transition:
    transform 0.26s ease,
    box-shadow 0.3s ease,
    border-color 0.26s ease,
    background 0.3s ease;
}

.saas-plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 40px rgba(15, 57, 87, 0.1);
}

.saas-plan-card--featured {
  transform: translateY(-10px);
  border-color: rgba(59, 130, 246, 0.16);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.92) 0%, #ffffff 52%);
  box-shadow:
    0 24px 50px rgba(37, 99, 235, 0.12),
    0 0 0 1px rgba(59, 130, 246, 0.04);
}

.saas-plan-card--featured:hover {
  transform: translateY(-12px);
  box-shadow:
    0 28px 56px rgba(37, 99, 235, 0.15),
    0 0 0 1px rgba(59, 130, 246, 0.08);
}

.saas-plan-card__floating-tag {
  position: absolute;
  top: -12px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
  animation: featuredTagFloat 3.6s ease-in-out infinite;
}

.saas-plan-card__head,
.saas-addon-card__header,
.saas-addon-card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.saas-plan-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.saas-plan-card__eyebrow,
.saas-addon-card__eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.saas-plan-card__title,
.saas-addon-card__title {
  color: #153852;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.16;
}

.saas-plan-card__summary,
.saas-addon-card__subtitle,
.saas-addon-card__desc {
  color: #5b758a;
  font-size: 14px;
  line-height: 1.72;
}

.saas-plan-card__monthly-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.saas-plan-card__monthly-option {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background-color 0.22s ease;
}

.saas-plan-card__monthly-option:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow: 0 12px 20px rgba(15, 57, 87, 0.05);
}

.saas-plan-card__monthly-option:active {
  transform: scale(0.988);
}

.saas-plan-card__monthly-option--active {
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(239, 246, 255, 0.95);
  box-shadow: 0 14px 22px rgba(37, 99, 235, 0.08);
}

.saas-plan-card__monthly-option-title {
  color: #18364d;
  font-size: 14px;
  font-weight: 700;
}

.saas-plan-card__monthly-option-meta {
  color: #5f798e;
  font-size: 12px;
  font-weight: 600;
}

.saas-plan-card__price-wrap {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: linear-gradient(135deg, rgba(247, 250, 253, 0.94) 0%, rgba(255, 255, 255, 0.98) 100%);
  transition:
    transform 0.24s ease,
    box-shadow 0.28s ease,
    border-color 0.24s ease;
}

.saas-plan-card:hover .saas-plan-card__price-wrap {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 14px 24px rgba(15, 57, 87, 0.06);
}

.saas-plan-card__price-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 2px;
}

.saas-plan-card__price {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  color: #14324a;
}

.saas-plan-card__currency {
  font-size: 22px;
  font-weight: 700;
}

.saas-plan-card__price strong {
  font-size: 52px;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.saas-plan-card__price-unit,
.saas-addon-card__price small {
  color: #698296;
  font-size: 15px;
  font-weight: 600;
  padding-top: 0;
  margin-left: 2px;
}

.saas-plan-card__price-caption {
  color: #698296;
  font-size: 12px;
  font-weight: 600;
}

.saas-plan-card__price-hint {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.saas-plan-card__promo-note {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4f91;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.saas-plan-card__cta,
.saas-addon-card__cta {
  min-height: 44px;
  border-radius: 16px;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(25, 118, 210, 0.16);
  transition:
    transform 0.16s ease,
    box-shadow 0.24s ease,
    filter 0.24s ease;
}

.saas-plan-card__cta:hover,
.saas-addon-card__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(25, 118, 210, 0.22);
  filter: brightness(1.03);
}

.saas-plan-card__cta:active,
.saas-addon-card__cta:active {
  transform: scale(0.985);
}

.saas-plan-card__cta:focus-visible,
.saas-addon-card__cta:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.12),
    0 18px 32px rgba(25, 118, 210, 0.22);
}

.saas-plan-card__feature-title {
  color: #18364d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.saas-plan-card__features,
.saas-addon-card__feature-list {
  display: grid;
  gap: 10px;
}

.saas-plan-card__feature,
.saas-addon-card__feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #33556e;
  font-size: 14px;
  line-height: 1.6;
  transition: transform 0.2s ease, color 0.2s ease;
}

.saas-plan-card:hover .saas-plan-card__feature,
.saas-addon-card:hover .saas-addon-card__feature-item {
  transform: translateX(2px);
}

.saas-pricing-shell__addon {
  max-width: 1120px;
}

.saas-addon-card {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px dashed rgba(17, 76, 114, 0.14);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12px 22px rgba(15, 57, 87, 0.05);
  transition:
    transform 0.24s ease,
    box-shadow 0.28s ease,
    border-color 0.24s ease;
}

.saas-addon-card:hover {
  transform: translateY(-3px);
  border-color: rgba(37, 99, 235, 0.18);
  box-shadow: 0 18px 30px rgba(15, 57, 87, 0.08);
}

.saas-addon-card__price {
  color: #153852;
  font-size: 26px;
  font-weight: 800;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.saas-addon-card__content {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.saas-addon-card__cta {
  min-width: 220px;
}

@media (max-width: 1023px) {
  .saas-pricing-shell__plans {
    grid-template-columns: 1fr;
  }

  .saas-plan-card--featured {
    transform: none;
  }

  .saas-plan-card--featured:hover,
  .saas-plan-card:hover,
  .saas-addon-card:hover {
    transform: none;
  }

  .saas-addon-card__body {
    flex-direction: column;
    align-items: stretch;
  }

  .saas-addon-card__cta {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .saas-plan-card,
  .saas-addon-card {
    padding: 18px;
    border-radius: 20px;
  }

  .saas-plan-card__title,
  .saas-addon-card__title {
    font-size: 24px;
  }

  .saas-plan-card__price strong {
    font-size: 42px;
  }

  .saas-addon-card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .saas-plan-card__monthly-switch {
    grid-template-columns: 1fr;
  }

  .saas-plan-card__floating-tag {
    right: 18px;
  }
}

@keyframes featuredTagFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
</style>
