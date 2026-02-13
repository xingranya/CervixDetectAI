<template>
  <q-page class="payment-result-page">
    <div class="result-card">
      <div v-if="loading" class="text-center">
        <div class="spinner"></div>
        <div class="title">正在查询支付结果...</div>
        <div class="subtitle">请稍候，系统正在确认您的订单状态</div>
      </div>

      <div v-else-if="status === 'success'" class="text-center">
        <div class="icon success">✓</div>
        <div class="title success-text">支付成功</div>
        <div class="order-name">{{ order?.name }}</div>
        <div class="amount">¥{{ order?.money }}</div>

        <div class="info-list">
          <div class="info-item">
            <span class="label">订单号</span>
            <span class="value">{{ order?.out_trade_no }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付时间</span>
            <span class="value">{{ formatDate(order?.pay_time) }}</span>
          </div>
          <div class="info-item">
            <span class="label">获得权益</span>
            <span class="value highlight">{{ getBenefitText(order) }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" @click="goTo('/app')">返回控制台</button>
          <button class="btn outline" @click="goTo('/app/models')">返回订阅页</button>
        </div>
      </div>

      <div v-else class="text-center">
        <div class="icon error">✕</div>
        <div class="title error-text">支付未完成</div>
        <div class="subtitle">{{ errorMessage || '未能确认订单支付状态' }}</div>
        <div class="hint">如果您已完成支付，请点击刷新按钮或联系客服。</div>

        <div class="actions">
          <button class="btn primary" @click="checkStatus" :disabled="checking">
            {{ checking ? '查询中...' : '刷新状态' }}
          </button>
          <a href="/app/models" class="btn outline">返回订阅页</a>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const goTo = (path: string) => {
  void router.push(path);
};

// 从 URL 获取参数（兼容 Hash Mode）
// Hash Mode 下 URL 格式: http://localhost:9000/#/payment/result?out_trade_no=xxx
// 参数在 hash 中而不是 search 中
const getOutTradeNo = () => {
  // 先尝试从 hash 中获取参数
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf('?');
  if (hashQueryIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(hashQueryIndex));
    const fromHash = hashParams.get('out_trade_no');
    if (fromHash) return fromHash;
  }
  // 兜底：尝试从 search 中获取
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('out_trade_no') || '';
};
const outTradeNo = getOutTradeNo();

const loading = ref(true);
const checking = ref(false);
const status = ref<'loading' | 'success' | 'failed'>('loading');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const order = ref<any>(null);
const errorMessage = ref('');

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollCount = 0;
const MAX_POLL_COUNT = 15;

// API 基础路径
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const formatDate = (val: string) => {
  if (!val) return '-';
  const d = new Date(val);
  return d.toLocaleString('zh-CN');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBenefitText = (order: any) => {
  if (!order) return '';
  if (order.plan_type === 'monthly') return '月度订阅会员 (30天)';
  if (order.plan_type === 'yearly') return '年度订阅会员 (365天)';
  return `${order.credits}次 AI分析点数`;
};

const checkStatus = async () => {
  if (!outTradeNo) {
    status.value = 'failed';
    errorMessage.value = '无效的订单号';
    loading.value = false;
    return;
  }

  checking.value = true;
  try {
    // 直接使用 axios，不经过任何拦截器
    const response = await axios.get(`${API_BASE}/payment/check/${outTradeNo}`);
    const data = response.data;

    console.log('[PaymentResult] 查询结果:', data);

    if (data.success && data.data) {
      order.value = data.data;

      if (order.value.status === 'paid') {
        status.value = 'success';
        loading.value = false;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      } else if (!loading.value) {
        status.value = 'failed';
        errorMessage.value = '订单尚未支付';
      }
    } else {
      if (!loading.value) {
        status.value = 'failed';
        errorMessage.value = data.message || '查询失败';
      }
    }
  } catch (error: unknown) {
    console.error('[PaymentResult] 查询订单失败', error);
    if (!loading.value) {
      status.value = 'failed';
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
      errorMessage.value =
        axiosError.response?.data?.message || axiosError.response?.data?.error || '查询失败';
    }
  } finally {
    checking.value = false;
  }
};

onMounted(() => {
  console.log('[PaymentResult] 页面加载, 订单号:', outTradeNo);

  if (!outTradeNo) {
    status.value = 'failed';
    errorMessage.value = '缺少订单号参数';
    loading.value = false;
    return;
  }

  // 立即查询一次
  void checkStatus();

  // 开始轮询
  pollTimer = setInterval(() => {
    pollCount++;
    console.log('[PaymentResult] 轮询次数:', pollCount);

    if (pollCount > MAX_POLL_COUNT) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (status.value !== 'success') {
        loading.value = false;
        status.value = 'failed';
        errorMessage.value = '查询超时，请手动刷新';
      }
      return;
    }
    void checkStatus();
  }, 2000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style scoped>
.payment-result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 20px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.text-center {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 20px;
  color: white;
}

.icon.success {
  background: #21ba45;
}

.icon.error {
  background: #c10015;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.success-text {
  color: #21ba45;
}

.error-text {
  color: #c10015;
}

.subtitle {
  color: #666;
  margin-bottom: 10px;
}

.hint {
  color: #999;
  font-size: 14px;
  margin: 20px 0;
}

.order-name {
  font-size: 18px;
  color: #666;
  margin: 10px 0;
}

.amount {
  font-size: 36px;
  font-weight: bold;
  color: #1976d2;
  margin: 20px 0;
}

.info-list {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #999;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item .value.highlight {
  color: #1976d2;
  font-weight: 600;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.btn.primary {
  background: #1976d2;
  color: white;
}

.btn.primary:hover {
  background: #1565c0;
}

.btn.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn.outline {
  background: white;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn.outline:hover {
  background: #e3f2fd;
}
</style>

<style lang="scss">
body.body--dark {
  .payment-result-page {
    background: var(--app-bg-primary) !important;
  }

  .result-card {
    background: var(--app-surface) !important;
    box-shadow: var(--app-shadow-lg) !important;
  }

  .spinner {
    border-color: var(--app-border-default) !important;
    border-top-color: var(--q-primary) !important;
  }

  .title {
    color: var(--app-text-primary) !important;
  }

  .subtitle {
    color: var(--app-text-secondary) !important;
  }

  .hint {
    color: var(--app-text-tertiary) !important;
  }

  .order-name {
    color: var(--app-text-secondary) !important;
  }

  .info-list {
    background: var(--app-elevated-bg) !important;
  }

  .info-item {
    border-bottom-color: var(--app-border-default) !important;

    .label {
      color: var(--app-text-tertiary) !important;
    }

    .value {
      color: var(--app-text-primary) !important;
    }
  }

  .btn.outline {
    background: var(--app-surface) !important;
    border-color: var(--q-primary) !important;

    &:hover {
      background: var(--app-primary-soft-bg) !important;
    }
  }

  .btn.primary:disabled {
    background: var(--app-border-default) !important;
  }
}
</style>
