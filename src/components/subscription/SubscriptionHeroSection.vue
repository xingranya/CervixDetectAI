<template>
  <section class="subscription-header-shell">
    <div class="subscription-header-shell__intro">
      <div class="subscription-header-shell__badge">
        <q-icon name="workspace_premium" size="15px" />
        <span>订阅服务中心</span>
      </div>

      <h1 class="subscription-header-shell__title">选择适合当前筛查规模的订阅方案</h1>
      <p class="subscription-header-shell__subtitle">
        {{
          subscriptionDisplayMode === 'duration'
            ? '面向周期授权场景，可按机构业务节奏选择按月或按年订阅方案。'
            : '适合低频正式诊断启用场景，单次授权开通后即可直接进入支付流程。'
        }}
      </p>
    </div>

    <div class="subscription-header-shell__controls">
      <div class="subscription-header-shell__control-group">
        <div class="subscription-header-shell__control-label">开通模式</div>
        <q-btn-toggle
          :model-value="subscriptionDisplayMode"
          no-caps
          unelevated
          spread
          toggle-color="primary"
          color="white"
          text-color="primary"
          class="subscription-header-shell__toggle"
          :options="displayModeOptions"
          @update:model-value="handleDisplayModeChange"
        />
      </div>

      <q-slide-transition>
        <div
          v-if="subscriptionDisplayMode === 'duration'"
          class="subscription-header-shell__control-group subscription-header-shell__control-group--animated"
        >
          <div class="subscription-header-shell__control-label">周期筛选</div>
          <q-btn-toggle
            :model-value="subscriptionBillingFilter"
            no-caps
            unelevated
            spread
            color="white"
            text-color="primary"
            toggle-color="primary"
            class="subscription-header-shell__toggle"
            :options="billingFilterOptions"
            @update:model-value="handleBillingFilterChange"
          />
        </div>
      </q-slide-transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  SubscriptionBillingFilter,
  SubscriptionDisplayMode,
} from 'src/composables/useSubscriptionPlans';

defineProps<{
  subscriptionBillingFilter: SubscriptionBillingFilter;
  subscriptionDisplayMode: SubscriptionDisplayMode;
}>();

const emit = defineEmits<{
  (e: 'update:display-mode', mode: SubscriptionDisplayMode): void;
  (e: 'update:billing-filter', filter: SubscriptionBillingFilter): void;
}>();

const displayModeOptions = computed(() => [
  { label: '周期套餐', value: 'duration' satisfies SubscriptionDisplayMode },
  { label: '单次开通', value: 'usage' satisfies SubscriptionDisplayMode },
]);

const billingFilterOptions = computed(() => [
  { label: '全部', value: 'all' satisfies SubscriptionBillingFilter },
  { label: '按月', value: 'monthly' satisfies SubscriptionBillingFilter },
  { label: '按年', value: 'yearly' satisfies SubscriptionBillingFilter },
]);

const handleDisplayModeChange = (value: string | number | null) => {
  if (value === 'duration' || value === 'usage') {
    emit('update:display-mode', value);
  }
};

const handleBillingFilterChange = (value: string | number | null) => {
  if (value === 'all' || value === 'monthly' || value === 'yearly') {
    emit('update:billing-filter', value);
  }
};
</script>

<style scoped lang="scss">
.subscription-header-shell {
  display: grid;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}

.subscription-header-shell__intro {
  display: grid;
  gap: 10px;
  text-align: center;
  justify-items: center;
}

.subscription-header-shell__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(25, 118, 210, 0.14);
  color: #0f6caa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.subscription-header-shell__title {
  margin: 0;
  color: #14324a;
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: -0.03em;
}

.subscription-header-shell__subtitle {
  max-width: 680px;
  margin: 0;
  color: #5b768a;
  font-size: 14px;
  line-height: 1.8;
  transition: color 0.28s ease, transform 0.28s ease;
}

.subscription-header-shell__controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 28px rgba(15, 57, 87, 0.05);
}

.subscription-header-shell__control-group {
  display: grid;
  gap: 10px;
}

.subscription-header-shell__control-group--animated {
  transform-origin: top center;
}

.subscription-header-shell__control-label {
  color: #607a8f;
  font-size: 13px;
  font-weight: 700;
}

.subscription-header-shell__toggle {
  :deep(.q-btn) {
    min-height: 44px;
    border-radius: 14px;
    font-weight: 700;
    transition:
      transform 0.18s ease,
      box-shadow 0.22s ease,
      border-color 0.22s ease,
      background-color 0.22s ease,
      color 0.22s ease;
  }

  :deep(.q-btn:hover) {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(37, 99, 235, 0.08);
  }

  :deep(.q-btn:active) {
    transform: translateY(0) scale(0.985);
  }

  :deep(.q-btn:focus-visible) {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.12),
      0 10px 18px rgba(37, 99, 235, 0.1);
  }

  :deep(.q-btn--rectangle) {
    border: 1px solid rgba(17, 76, 114, 0.08);
  }
}

@media (max-width: 767px) {
  .subscription-header-shell__controls {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}

@media (max-width: 599px) {
  .subscription-header-shell__title {
    font-size: 1.9rem;
  }
}
</style>
