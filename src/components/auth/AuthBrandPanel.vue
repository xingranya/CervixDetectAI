<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, onMounted, onUnmounted } from 'vue';
import {
  SORTED_SOFTWARE_COPYRIGHTS,
  type SoftwareCopyrightItem,
} from 'src/constants/softwareCopyrights';

interface BrandFeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface BrandWorkflowStep {
  title: string;
  description: string;
  icon: string;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    badgeText?: string;
  }>(),
  {
    title: '重塑数字病理，赋能早期筛查',
    subtitle: '利用 AI 视觉能力，为医疗机构提供稳定、可信、可追溯的宫颈筛查辅助工作流。',
    badgeText: '专业 AI 辅助诊断平台',
  },
);

const workflowSteps: BrandWorkflowStep[] = [
  {
    title: '采集与上传',
    description: '将宫颈影像与基础病例信息统一录入，避免检查资料在多个系统间分散。',
    icon: 'photo_camera_back',
  },
  {
    title: '分析与复核',
    description: 'AI 先完成风险提示，医生再结合临床判断进行复核，提升筛查效率与稳定性。',
    icon: 'biotech',
  },
  {
    title: '报告与归档',
    description: '分析结论、报告导出、随访提醒形成闭环，方便后续追踪与院内管理。',
    icon: 'assignment_turned_in',
  },
];

const defaultFeatures: BrandFeatureItem[] = [
  {
    icon: 'manage_search',
    title: '快速风险分层',
    description: '优先识别需要重点关注的病例，帮助一线人员更快进入有效判断。',
  },
  {
    icon: 'hub',
    title: '统一协作链路',
    description: '影像、病例、分析、报告放在同一工作台内流转，减少信息跳转与遗漏。',
  },
  {
    icon: 'description',
    title: '结构化报告输出',
    description: '关键结果清晰沉淀，支持院内存档、复盘和后续患者沟通。',
  },
  {
    icon: 'verified_user',
    title: '过程可追溯',
    description: '关键节点和操作记录清楚保留，便于质控检查与合规审计。',
  },
];

const $q = useQuasar();
const sortedSoftwareCopyrights = SORTED_SOFTWARE_COPYRIGHTS;
const previewVisible = ref(false);
const activeCertificate = ref<SoftwareCopyrightItem | null>(null);

const processedCount = ref(5);
let counterTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  counterTimer = setInterval(() => {
    if (Math.random() > 0.4) {
      processedCount.value += 1;
    }
  }, 10000);
});

onUnmounted(() => {
  if (counterTimer) {
    clearInterval(counterTimer);
  }
});

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
</script>

<template>
  <div class="auth-brand-panel">
    <!-- Decorative Ambient Glowing Spheres Container -->
    <div class="brand-glow-container">
      <div class="brand-glow-sphere brand-glow-sphere--1"></div>
      <div class="brand-glow-sphere brand-glow-sphere--2"></div>
    </div>

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
    </header>

    <main class="auth-brand-content">
      <div class="hero-text-group">
        <div class="badge-row">
          <div class="hero-badge">
            <q-icon name="auto_awesome" />
            <span>{{ props.badgeText }}</span>
          </div>
          <div class="hero-badge live-status-badge">
            <span class="live-indicator"></span>
            <span>今日已安全处理 AI 筛查: <strong class="counter-num">{{ processedCount }}</strong> 例</span>
          </div>
        </div>
        <h1 class="hero-title">{{ props.title }}</h1>
        <p class="hero-subtitle">{{ props.subtitle }}</p>
      </div>

      <section class="workflow-panel">
        <div class="section-eyebrow">工作链路</div>
        <div class="workflow-list">
          <article
            v-for="(step, index) in workflowSteps"
            :key="step.title"
            class="workflow-item"
            :class="`workflow-item--step-${index + 1}`"
          >
            <div class="workflow-visual-box">
              <q-icon :name="step.icon" size="24px" class="workflow-visual-icon" />
              <!-- Special animation overlay nodes -->
              <div v-if="index === 0" class="scanner-line"></div>
              <div v-if="index === 1" class="radar-pulse-ring ring-1"></div>
              <div v-if="index === 1" class="radar-pulse-ring ring-2"></div>
              <div v-if="index === 2" class="checkmark-glow"></div>
            </div>
            <div class="workflow-body">
              <div class="workflow-title">
                <span class="workflow-step-num">0{{ index + 1 }}</span>
                {{ step.title }}
              </div>
              <p class="workflow-desc">{{ step.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="feature-section">
        <div class="section-eyebrow">核心能力</div>
        <div class="feature-grid">
          <article v-for="feature in defaultFeatures" :key="feature.title" class="feature-card">
            <div class="feature-icon-box">
              <q-icon :name="feature.icon" size="28px" />
            </div>
            <div class="feature-info">
              <div class="feature-title">{{ feature.title }}</div>
              <div class="feature-desc">{{ feature.description }}</div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="auth-brand-footer">
      <div class="auth-brand-footer-title">软件著作权</div>
      <div class="copyright-grid">
        <article
          v-for="copyright in sortedSoftwareCopyrights"
          :key="copyright.id"
          class="copyright-card copyright-card--clickable"
          @click="openCertificatePreview(copyright)"
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

    <q-dialog v-model="previewVisible" @hide="resetCertificatePreview">
      <q-card style="width: min(92vw, 960px); max-width: 960px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold">
            {{ activeCertificate?.name }}
          </div>
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
  </div>
</template>

<style>
.auth-brand-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 48px;
  background: transparent;
  color: #0f172a;
}

/* Decorative Ambient Glowing Spheres Container */
.brand-glow-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* Decorative Ambient Glowing Spheres */
.brand-glow-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.06;
  pointer-events: none;
  z-index: 0;
}

.brand-glow-sphere--1 {
  top: 10%;
  left: -10%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, var(--q-primary, #2563eb) 0%, transparent 70%);
}

.brand-glow-sphere--2 {
  bottom: 20%;
  right: -5%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, #38bdf8 0%, transparent 70%);
}

body.body--dark .brand-glow-sphere {
  opacity: 0.1;
  filter: blur(120px);
}

.auth-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(59, 130, 246, 0.8) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}

.auth-brand-panel > *:not(.brand-glow-container) {
  position: relative;
  z-index: 1;
}

.auth-brand-header {
  display: flex;
  align-items: center;
  margin-bottom: 34px;
}

.brand-logo-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.logo-box:hover {
  transform: scale(1.04);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
}

.logo-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.logo-box:hover::before {
  opacity: 1;
}

.logo-img {
  width: 32px;
  height: 32px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-box:hover .logo-img {
  transform: scale(1.08) rotate(6deg);
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #0f172a;
}

.brand-team {
  font-size: 0.8rem;
  color: #2563eb;
  font-weight: 600;
}

.auth-brand-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-text-group {
  max-width: 760px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.12), rgba(37, 99, 235, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.32);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0369a1;
}

.live-status-badge {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08));
  border-color: rgba(16, 185, 129, 0.3);
  color: #065f46;
}

.live-indicator {
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-green 2s infinite;
}

.counter-num {
  font-weight: 800;
  font-family: monospace;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.hero-title {
  margin: 0 0 14px;
  font-size: clamp(2.5rem, 3.3vw, 3.18rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.025em;
  text-wrap: balance;
  background: linear-gradient(
    120deg,
    #0f172a 20%,
    #1e3a8a 40%,
    #2563eb 50%,
    #38bdf8 60%,
    #1e3a8a 70%,
    #0f172a 80%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  text-shadow: 0 4px 12px rgba(37, 99, 235, 0.04);
  animation: shimmer-flow 6s linear infinite;
}

@keyframes shimmer-flow {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.hero-subtitle {
  margin: 0;
  max-width: 68ch;
  font-size: 1rem;
  line-height: 1.7;
  color: #334155;
}

.section-eyebrow {
  margin-bottom: 12px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.workflow-panel,
.feature-section {
  background: rgba(255, 255, 255, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 20px;
  padding: 22px 24px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.workflow-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  position: relative;
}

.workflow-item {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  z-index: 1;
}

/* Horizontal timeline connector */
@media (min-width: 1181px) {
  .workflow-item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 26px; /* middle of 52px workflow-visual-box */
    left: calc(52px + 12px);
    width: calc(100% - 52px - 24px);
    height: 2px;
    background: linear-gradient(90deg, var(--q-primary, #2563eb) 0%, #38bdf8 50%, rgba(37, 99, 235, 0.15) 100%);
    background-size: 200% 100%;
    animation: flow-line-h 2.5s linear infinite;
    opacity: 0.6;
    z-index: 0;
  }
}

/* Vertical timeline connector */
@media (max-width: 1180px) {
  .workflow-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 26px; /* middle of 52px workflow-visual-box */
    top: calc(52px + 12px);
    width: 2px;
    height: calc(100% - 52px);
    background: linear-gradient(180deg, var(--q-primary, #2563eb) 0%, #38bdf8 50%, rgba(37, 99, 235, 0.15) 100%);
    background-size: 100% 200%;
    animation: flow-line-v 2.5s linear infinite;
    opacity: 0.6;
    z-index: 0;
  }
}

@keyframes flow-line-h {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@keyframes flow-line-v {
  0% {
    background-position: 0 200%;
  }
  100% {
    background-position: 0 0;
  }
}

.workflow-visual-box {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.04) 100%);
  color: var(--q-primary, #2563eb);
  border: 1px solid rgba(37, 99, 235, 0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.workflow-item:hover .workflow-visual-box {
  transform: translateY(-2px);
  background: var(--q-primary, #2563eb);
  color: #ffffff;
  border-color: var(--q-primary, #2563eb);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
}

.workflow-step-num {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--q-primary, #2563eb);
  margin-right: 6px;
  font-family: monospace;
}

body.body--dark .workflow-step-num {
  color: #38bdf8;
}

.workflow-visual-icon {
  z-index: 1;
}

/* Animations for step 1: Scanner */
.scanner-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  box-shadow: 0 0 6px #38bdf8;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.workflow-item--step-1:hover .scanner-line {
  opacity: 1;
  animation: scan-move 1.5s linear infinite;
}

@keyframes scan-move {
  0% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 10%;
  }
}

/* Animations for step 2: Radar */
.radar-pulse-ring {
  position: absolute;
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

.workflow-item--step-2:hover .radar-pulse-ring {
  animation: radar-pulse 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
}

.workflow-item--step-2:hover .radar-pulse-ring.ring-2 {
  animation-delay: 1s;
}

@keyframes radar-pulse {
  0% {
    width: 10px;
    height: 10px;
    opacity: 0.8;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
  }
}

/* Animations for step 3: Checkmark glow */
.checkmark-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.workflow-item--step-3:hover .checkmark-glow {
  opacity: 1;
  animation: pulse-glow 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.workflow-body {
  min-width: 0;
  padding-top: 4px;
}

.workflow-title {
  margin-bottom: 6px;
  font-size: 0.96rem;
  font-weight: 700;
  color: #0f172a;
}

.workflow-desc {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.6;
  color: #475569;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-card {
  min-height: 112px;
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 16px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.feature-icon-box {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.04) 100%);
  color: var(--q-primary, #2563eb);
  border: 1px solid rgba(37, 99, 235, 0.15);
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
}

.feature-card:hover .feature-icon-box {
  transform: scale(1.06);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0.08) 100%);
  border-color: rgba(37, 99, 235, 0.28);
}

.feature-info {
  min-width: 0;
}

.feature-title {
  margin-bottom: 6px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.feature-desc {
  font-size: 0.78rem;
  line-height: 1.6;
  color: #475569;
}

.auth-brand-footer {
  margin-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 16px;
}

.auth-brand-footer-title {
  margin-bottom: 10px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #475569;
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

.copyright-card--clickable {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.copyright-card--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.copyright-card--clickable:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
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
  color: #6366f1;
}

.copyright-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
}

.copyright-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.6rem;
  background: rgba(56, 189, 248, 0.12);
  color: #0284c7;
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
  margin-left: 2px;
  font-family: monospace;
  font-weight: 500;
}

.certificate-preview-image {
  max-height: 72vh;
  border-radius: 8px;
  background: #f8fafc;
}

body.body--dark .auth-brand-panel {
  background: transparent !important;
  color: #f8fafc !important;
}

body.body--dark .hero-title {
  background: linear-gradient(
    120deg,
    #f8fafc 20%,
    #93c5fd 40%,
    #38bdf8 50%,
    #60a5fa 60%,
    #93c5fd 70%,
    #f8fafc 80%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

body.body--dark .logo-box {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

body.body--dark .logo-box:hover {
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.2);
}

body.body--dark .brand-name {
  color: #f8fafc;
}

body.body--dark .brand-team {
  color: #7dd3fc;
}

body.body--dark .hero-badge {
  background: rgba(30, 41, 59, 0.62);
  border-color: rgba(56, 189, 248, 0.24);
  color: #7dd3fc;
}

body.body--dark .hero-subtitle,
body.body--dark .workflow-desc,
body.body--dark .feature-desc,
body.body--dark .copyright-meta-row {
  color: #cbd5e1;
}

body.body--dark .section-eyebrow,
body.body--dark .auth-brand-footer-title {
  color: #94a3b8;
}

body.body--dark .live-status-badge {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.25);
  color: #34d399;
}

body.body--dark .workflow-panel,
body.body--dark .feature-section {
  background: rgba(15, 23, 42, 0.44);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

body.body--dark .workflow-item:not(:last-child)::after {
  background: linear-gradient(90deg, #60a5fa 0%, #38bdf8 50%, rgba(96, 165, 250, 0.15) 100%);
  background-size: 200% 100%;
}

@media (max-width: 1180px) {
  body.body--dark .workflow-item:not(:last-child)::after {
    background: linear-gradient(180deg, #60a5fa 0%, #38bdf8 50%, rgba(96, 165, 250, 0.15) 100%);
    background-size: 100% 200%;
  }
}

body.body--dark .workflow-visual-box {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.22);
}

body.body--dark .workflow-item:hover .workflow-visual-box {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.42);
}

body.body--dark .workflow-title,
body.body--dark .feature-title,
body.body--dark .value,
body.body--dark .copyright-name {
  color: #f8fafc;
}

body.body--dark .feature-card,
body.body--dark .copyright-card {
  background: rgba(30, 41, 59, 0.46);
  border-color: rgba(255, 255, 255, 0.08);
}

body.body--dark .feature-card:hover {
  background: rgba(30, 41, 59, 0.76);
  border-color: rgba(59, 130, 246, 0.32);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2);
}

body.body--dark .feature-icon-box {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.16) 0%, rgba(59, 130, 246, 0.08) 100%);
  color: #7dd3fc;
  border-color: rgba(56, 189, 248, 0.22);
}

body.body--dark .feature-card:hover .feature-icon-box {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.24) 0%, rgba(59, 130, 246, 0.12) 100%);
  border-color: rgba(56, 189, 248, 0.34);
}

body.body--dark .auth-brand-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .copyright-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
}

body.body--dark .certificate-preview-image {
  background: rgba(15, 23, 42, 0.6);
}

@media (max-width: 1400px) {
  .auth-brand-panel {
    padding: 30px;
  }

  .hero-title {
    font-size: 2.18rem;
  }
}

@media (min-width: 1024px) and (max-height: 860px) {
  .auth-brand-panel {
    padding: 24px 28px;
  }

  .auth-brand-header {
    margin-bottom: 24px;
  }

  .auth-brand-content {
    gap: 18px;
  }

  .workflow-panel,
  .feature-section {
    padding: 18px;
  }

  .workflow-list,
  .feature-grid,
  .copyright-grid {
    gap: 10px;
  }

  @media (min-width: 1181px) {
    .workflow-item:not(:last-child)::after {
      left: calc(52px + 10px);
      width: calc(100% - 52px - 20px);
    }
  }

  .feature-card,
  .copyright-card {
    padding: 10px 12px;
  }

  .auth-brand-footer {
    margin-top: 18px;
    padding-top: 12px;
  }
}

@media (max-width: 1180px) {
  .workflow-list,
  .feature-grid,
  .copyright-grid {
    grid-template-columns: 1fr;
  }
}
</style>