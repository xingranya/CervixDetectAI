<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

interface BrandFeatureItem {
  icon: string;
  tag: string;
  title: string;
  description: string;
}

interface BrandRealtimeMetric {
  label: string;
  value: number;
  description: string;
  color: string;
}

interface BrandCopyrightItem {
  name: string;
  version: string;
  registrationNo: string;
  certificateNo: string;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    badgeText?: string;
  }>(),
  {
    title: '重塑数字病理，赋能早期筛查',
    subtitle: '利用 AI 视觉能力，为医疗机构提供稳定、可信的宫颈筛查辅助工作流。',
    badgeText: '专业 AI 辅助诊断平台',
  },
);

const defaultFeatures: BrandFeatureItem[] = [
  {
    icon: 'manage_search',
    tag: 'AI CORE',
    title: '智能影像分析',
    description: '自动识别宫颈影像并输出风险提示。',
  },
  {
    icon: 'folder_shared',
    tag: 'WORKFLOW',
    title: '病例协同闭环',
    description: '采集、分析、复核一体化协作流。',
  },
  {
    icon: 'description',
    tag: 'REPORT',
    title: '结构化报告',
    description: '自动生成可追溯、可归档报告。',
  },
  {
    icon: 'verified_user',
    tag: 'COMPLIANCE',
    title: '合规审计追踪',
    description: '关键操作全链路可审计记录。',
  },
];

const defaultCopyrights: BrandCopyrightItem[] = [
  {
    name: '宫颈智能阅片与分级管理系统',
    version: 'V1.0.0',
    registrationNo: '2026SR0224083',
    certificateNo: '软著登字第17438364号',
  },
  {
    name: '宫颈护航智能辅助筛查系统',
    version: 'V1.0.0',
    registrationNo: '2026SR0207339',
    certificateNo: '软著登字第17421620号',
  },
];

const precisionRate = ref(99.82);
const partnerCount = ref(412);
const dailyLoad = ref(1284);
const loadChange = ref(12);
const loadBars = ref<number[]>([44, 58, 53, 78, 66, 90]);
const turnoverRate = ref(92);
const recallRate = ref(96);
const updatedAt = ref(new Date());

let realtimeTimer: number | null = null;

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const randomDelta = (range: number): number => {
  return (Math.random() - 0.5) * range;
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const updateRealtimeData = (): void => {
  precisionRate.value = Number(
    clampNumber(precisionRate.value + randomDelta(0.12), 99.55, 99.95).toFixed(2),
  );
  partnerCount.value = Math.round(clampNumber(partnerCount.value + randomInt(-1, 2), 408, 468));

  const loadIncrease = randomInt(8, 30);
  dailyLoad.value += loadIncrease;
  loadChange.value = Math.round(clampNumber(loadIncrease / 2 + randomInt(4, 10), 6, 28));

  const lastBar = loadBars.value[loadBars.value.length - 1] ?? 88;
  const nextBar = Math.round(clampNumber(lastBar + randomInt(-8, 12), 38, 100));
  loadBars.value = [...loadBars.value.slice(1), nextBar];

  turnoverRate.value = Math.round(clampNumber(turnoverRate.value + randomDelta(2.2), 86, 97));
  recallRate.value = Math.round(clampNumber(recallRate.value + randomDelta(2.2), 92, 99));

  updatedAt.value = new Date();
};

const updatedTimeText = computed(() => {
  const hours = String(updatedAt.value.getHours()).padStart(2, '0');
  const minutes = String(updatedAt.value.getMinutes()).padStart(2, '0');
  const seconds = String(updatedAt.value.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
});

const formattedDailyLoad = computed(() => {
  return dailyLoad.value.toLocaleString('zh-CN');
});

const loadChangePositive = computed(() => {
  return loadChange.value >= 0;
});

const loadChangeText = computed(() => {
  return `${Math.abs(loadChange.value)}%`;
});

const realtimeMetrics = computed<BrandRealtimeMetric[]>(() => {
  return [
    {
      label: '病例周转效率',
      value: turnoverRate.value,
      description: '采集到报告平均 27 分钟',
      color: '#38bdf8', // Light Blue
    },
    {
      label: '高危检出召回率',
      value: recallRate.value,
      description: '重点病例复核闭环率持续稳定',
      color: '#818cf8', // Indigo
    },
  ];
});

const accuracyProgress = computed(() => {
  return clampNumber(precisionRate.value, 95, 100);
});

onMounted(() => {
  realtimeTimer = window.setInterval(updateRealtimeData, 1400);
});

onBeforeUnmount(() => {
  if (realtimeTimer !== null) {
    window.clearInterval(realtimeTimer);
  }
});
</script>

<template>
  <div class="auth-brand-panel">
    <!-- Header -->
    <header class="auth-brand-header">
      <div class="brand-logo-group">
        <div class="logo-box">
          <img src="/logo.svg" alt="CervixDetectAI" class="logo-img" />
        </div>
        <div class="brand-text">
          <div class="brand-name">CervixDetect AI</div>
          <div class="brand-team">云端智诊团队</div>
        </div>
      </div>

      <div class="header-tags">
        <div class="status-pill">
          <span class="status-dot"></span>
          <span class="status-text">在线 {{ partnerCount }} 家</span>
        </div>
        <div class="status-pill status-pill--glass">
          <q-icon name="update" size="14px" class="q-mr-xs" />
          {{ updatedTimeText }}
        </div>
      </div>
    </header>

    <!-- Main HUD Content -->
    <main class="auth-brand-content">
      <div class="hero-text-group">
        <div class="hero-badge">
          <q-icon name="auto_awesome" />
          <span>{{ props.badgeText }}</span>
        </div>
        <h1 class="hero-title">{{ props.title }}</h1>
        <p class="hero-subtitle">{{ props.subtitle }}</p>
      </div>

      <!-- Realtime Dashboard HUD -->
      <div class="hud-dashboard">
        <div class="hud-header">
          <span class="hud-label">REALTIME MONITOR</span>
          <div class="hud-line"></div>
        </div>

        <div class="hud-grid">
          <!-- Load Card -->
          <div class="hud-card">
            <div class="hud-card-head">
              <span class="label">今日处理量 (LOAD)</span>
              <q-icon name="analytics" class="icon" />
            </div>
            <div class="hud-card-value-row">
              <span class="value">{{ formattedDailyLoad }}</span>
              <div class="trend" :class="loadChangePositive ? 'trend-up' : 'trend-down'">
                <q-icon :name="loadChangePositive ? 'arrow_upward' : 'arrow_downward'" />
                {{ loadChangeText }}
              </div>
            </div>
            <div class="hud-chart-mini">
              <div
                v-for="(bar, i) in loadBars"
                :key="i"
                class="bar"
                :style="{ height: `${bar}%`, opacity: 0.4 + i * 0.1 }"
              ></div>
            </div>
          </div>

          <!-- Accuracy Card -->
          <div class="hud-card accent-card">
            <div class="hud-card-head">
              <span class="label">AI 辅助准确率</span>
              <q-icon name="verified" class="icon" />
            </div>
            <div class="hud-card-value-row">
              <span class="value accent-value">{{ precisionRate.toFixed(2) }}<small>%</small></span>
            </div>
            <div class="hud-progress-bar">
              <div class="progress-fill" :style="{ width: `${accuracyProgress}%` }"></div>
            </div>
            <div class="hud-note">基于 50W+ 临床案例验证</div>
          </div>
        </div>

        <!-- Secondary Metrics -->
        <div class="hud-metrics-row">
          <div v-for="metric in realtimeMetrics" :key="metric.label" class="metric-item">
            <div class="metric-top">
              <span class="label">{{ metric.label }}</span>
              <span class="value">{{ metric.value }}%</span>
            </div>
            <div class="metric-bar-bg">
              <div
                class="metric-bar-fill"
                :style="{ width: `${metric.value}%`, background: metric.color }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="feature-grid">
        <div v-for="feature in defaultFeatures" :key="feature.title" class="feature-card">
          <div class="feature-icon-box">
            <q-icon :name="feature.icon" />
          </div>
          <div class="feature-info">
            <div class="feature-title">{{ feature.title }}</div>
            <div class="feature-desc">{{ feature.description }}</div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer: Software Copyrights -->
    <footer class="auth-brand-footer">
      <div class="auth-brand-footer-title">软件著作权</div>
      <div class="copyright-grid">
        <article
          v-for="copyright in defaultCopyrights"
          :key="copyright.name"
          class="copyright-card"
        >
          <div class="copyright-head">
            <div class="copyright-icon-wrapper">
              <q-icon name="copyright" class="copyright-icon" />
            </div>
            <div class="copyright-name">{{ copyright.name }}</div>
            <q-badge class="copyright-badge">{{ copyright.version }}</q-badge>
          </div>
          <div class="copyright-meta-row">
            <span class="meta-label">登记号：</span>
            <span class="meta-value">{{ copyright.registrationNo }}</span>
          </div>
          <div class="copyright-meta-row">
            <span class="meta-label">证书号：</span>
            <span class="meta-value">{{ copyright.certificateNo }}</span>
          </div>
        </article>
      </div>
    </footer>
  </div>
</template>

<style>
/* =========================================
   BASE THEME (Light Mode Default)
   ========================================= */
.auth-brand-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 48px;
  /* Light Mode Background */
  background: linear-gradient(90deg, #f0f9ff 0%, #e8f4fe 72%, #e3f2fd 100%);
  color: #0f172a; /* Slate 900 */
}

/* Header */
.auth-brand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.brand-logo-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.logo-img {
  width: 32px;
  height: 32px;
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #0f172a;
}

.brand-team {
  font-size: 0.8rem;
  color: #3b82f6; /* Blue 500 */
  font-weight: 600;
}

.header-tags {
  display: flex;
  gap: 8px;
}

.status-pill {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
}

.status-pill--glass {
  background: rgba(255, 255, 255, 0.58);
  border-color: rgba(148, 163, 184, 0.24);
  color: #334155;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  margin-right: 6px;
  box-shadow: 0 0 8px #10b981;
}

/* Hero */
.hero-text-group {
  margin-bottom: 32px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(37, 99, 235, 0.1));
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
  margin-bottom: 16px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 12px;
  color: #0f172a;
}

.hero-subtitle {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
  max-width: 90%;
  margin: 0;
}

.auth-brand-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.status-text {
  color: inherit;
}

/* HUD Dashboard */
.hud-dashboard {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.hud-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.hud-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #475569;
}

.hud-line {
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.2);
}

.hud-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.hud-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.hud-card-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 8px;
}

.hud-card-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
}

.trend {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-up {
  color: #10b981;
}
.trend-down {
  color: #ef4444;
}

.hud-chart-mini {
  height: 32px;
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.bar {
  flex: 1;
  background: #3b82f6;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
}

.accent-card {
  background: linear-gradient(145deg, rgba(238, 242, 255, 0.8), rgba(255, 255, 255, 0.6));
  border-color: rgba(99, 102, 241, 0.2);
}

.accent-value {
  color: #4f46e5;
}

.hud-progress-bar {
  height: 4px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #6366f1;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
  transition: width 0.5s ease;
}

.hud-note {
  font-size: 0.65rem;
  color: #475569;
  text-align: right;
}

.hud-metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #334155;
}

.metric-bar-bg {
  height: 4px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 2px;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 2px;
}

/* Feature Grid */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
}

.feature-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  gap: 12px;
  transition: background 0.2s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.8);
}

.feature-icon-box {
  width: 36px;
  height: 36px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.feature-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 0.7rem;
  color: #475569;
  line-height: 1.3;
}

/* Footer: Copyright Cards */
.auth-brand-footer {
  margin-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 16px;
}

.auth-brand-footer-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copyright-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.copyright-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  padding: 10px 12px;
}

.copyright-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.copyright-icon-wrapper {
  width: 20px;
  height: 20px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copyright-icon {
  font-size: 14px;
  color: #6366f1; /* Indigo */
}

.copyright-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.copyright-badge {
  font-size: 0.6rem;
  padding: 2px 6px;
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
  border-radius: 4px;
}

.copyright-meta-row {
  display: flex;
  align-items: center;
  font-size: 0.65rem;
  line-height: 1.4;
  color: #475569;
}

.meta-label {
  opacity: 0.8;
}

.meta-value {
  font-family: monospace;
  margin-left: 2px;
  font-weight: 500;
}

/* =========================================
   DARK MODE OVERRIDES (Quasar body--dark)
   ========================================= */
body.body--dark .auth-brand-panel {
  background: linear-gradient(135deg, #020617 0%, #0f172a 100%) !important;
  color: #f8fafc !important;
}

body.body--dark .logo-box {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .brand-name {
  color: #f8fafc;
}

body.body--dark .brand-team {
  color: #60a5fa;
}

body.body--dark .status-pill--glass {
  background: rgba(15, 23, 42, 0.62);
  border-color: rgba(148, 163, 184, 0.34);
  color: #e2e8f0;
}

body.body--dark .hero-badge {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(56, 189, 248, 0.3);
  color: #7dd3fc;
}

body.body--dark .hero-title {
  color: #f8fafc;
}

body.body--dark .hero-subtitle {
  color: #cbd5e1;
}

/* Dark Mode HUD */
body.body--dark .hud-dashboard {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

body.body--dark .hud-label {
  color: #94a3b8;
}

body.body--dark .hud-line {
  background: rgba(255, 255, 255, 0.1);
}

body.body--dark .hud-card {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
}

body.body--dark .hud-card-head {
  color: #cbd5e1;
}

body.body--dark .value {
  color: #f8fafc;
}

body.body--dark .bar {
  background: #0ea5e9;
}

body.body--dark .accent-card {
  background: linear-gradient(145deg, rgba(79, 70, 229, 0.15), rgba(79, 70, 229, 0.05));
  border-color: rgba(99, 102, 241, 0.2);
}

body.body--dark .accent-value {
  color: #a5b4fc;
}

body.body--dark .hud-note {
  color: #94a3b8;
}

body.body--dark .metric-top {
  color: #cbd5e1;
}

body.body--dark .metric-bar-bg {
  background: rgba(255, 255, 255, 0.1);
}

/* Dark Mode Feature Cards */
body.body--dark .feature-card {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
}

body.body--dark .feature-card:hover {
  background: rgba(30, 41, 59, 0.8);
}

body.body--dark .feature-title {
  color: #e2e8f0;
}

body.body--dark .feature-desc {
  color: #cbd5e1;
}

/* Dark Mode Footer */
body.body--dark .auth-brand-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .auth-brand-footer-title {
  color: #94a3b8;
}

body.body--dark .copyright-card {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(99, 102, 241, 0.2);
}

body.body--dark .copyright-name {
  color: #e2e8f0;
}

body.body--dark .copyright-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

body.body--dark .copyright-meta-row {
  color: #cbd5e1;
}

@media (max-width: 1400px) {
  .auth-brand-panel {
    padding: 30px;
  }
  .hero-title {
    font-size: 2rem;
  }
}
</style>
