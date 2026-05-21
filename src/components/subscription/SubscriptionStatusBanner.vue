<template>
  <q-card flat bordered class="subscription-status-banner">
    <q-card-section class="subscription-status-banner__section">
      <div class="subscription-status-banner__identity">
        <div class="subscription-status-banner__icon-shell">
          <q-icon :name="subscriptionStatus.icon" :color="subscriptionStatus.color" size="22px" />
        </div>
        <div class="subscription-status-banner__copy">
          <div class="subscription-status-banner__eyebrow">当前状态</div>
          <div class="subscription-status-banner__title-row">
            <div class="subscription-status-banner__title">{{ subscriptionStatus.title }}</div>
            <q-chip
              dense
              class="subscription-status-banner__chip subscription-status-banner__chip--primary"
            >
              {{ subscriptionStatus.badge }}
            </q-chip>
          </div>
        </div>
      </div>

      <div class="subscription-status-banner__summary">
        <div class="subscription-status-banner__summary-item">
          <span>当前套餐</span>
          <strong>{{ subscriptionStatus.planName }}</strong>
        </div>
        <div class="subscription-status-banner__summary-item">
          <span>到期时间</span>
          <strong>{{ subscriptionStatus.expireDate }}</strong>
        </div>
        <div class="subscription-status-banner__summary-item">
          <span>{{ subscriptionStatus.quotaLabel }}</span>
          <strong class="subscription-status-banner__summary-item--accent">
            {{ subscriptionStatus.remainingCount }}
          </strong>
        </div>
      </div>

      <q-btn
        unelevated
        color="primary"
        icon-right="arrow_forward"
        no-caps
        class="subscription-status-banner__action"
        :label="actionLabel"
        @click="$emit('open-upgrade')"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DemoSubscriptionStatus } from 'src/composables/useSubscriptionPlans';

const props = defineProps<{
  subscriptionStatus: DemoSubscriptionStatus;
}>();

defineEmits<{
  (e: 'open-upgrade'): void;
}>();

const actionLabel = computed(() =>
  props.subscriptionStatus.type === 'trial' ? '选择订阅套餐' : '查看可升级套餐',
);
</script>

<style scoped lang="scss">
.subscription-status-banner {
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 22px;
  background: #f8fbff;
  box-shadow: 0 12px 24px rgba(15, 57, 87, 0.05);
}

.subscription-status-banner__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
}

.subscription-status-banner__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.subscription-status-banner__icon-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.96);
}

.subscription-status-banner__copy {
  min-width: 0;
}

.subscription-status-banner__eyebrow {
  color: #678095;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-status-banner__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.subscription-status-banner__title {
  color: #153852;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.subscription-status-banner__chip {
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.subscription-status-banner__chip--primary {
  color: #0f6caa;
  background: rgba(15, 108, 170, 0.1);
  border: 1px solid rgba(15, 108, 170, 0.14);
}

.subscription-status-banner__summary {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1;
  justify-content: flex-start;
  min-width: 0;
}

.subscription-status-banner__summary-item {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.subscription-status-banner__summary-item span {
  color: #6d8498;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.subscription-status-banner__summary-item strong {
  color: #18364d;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.subscription-status-banner__summary-item--accent {
  color: #0f6caa !important;
}

.subscription-status-banner__action {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 1023px) {
  .subscription-status-banner__section {
    flex-wrap: wrap;
  }

  .subscription-status-banner__summary {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 16px;
  }

  .subscription-status-banner__action {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .subscription-status-banner__section {
    align-items: flex-start;
    padding: 16px;
  }

  .subscription-status-banner__summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
