<script setup lang="ts">
/**
 * 认证页面双栏布局骨架 - Modern Medical Tech Edition
 * - 桌面端：品牌区 + 工作台区 (55/45 Split)
 * - 移动端：仅工作台区
 */
</script>

<template>
  <q-page class="auth-split-layout">
    <!-- Abstract Background Elements -->
    <div class="auth-background-mesh"></div>
    <div class="auth-background-glow"></div>

    <section class="auth-split-layout__brand-panel">
      <slot name="brand" />
    </section>

    <section class="auth-split-layout__workspace-panel">
      <div class="workspace-content-wrapper">
        <slot name="workspace" />
      </div>
    </section>
  </q-page>
</template>

<style>
/* =========================================
   BASE THEME (Light Mode Default)
   ========================================= */
.auth-split-layout {
  --auth-shared-bg: linear-gradient(100deg, #f0f9ff 0%, #e0f2fe 52%, #f8fafc 100%);
  --auth-workspace-overlay: linear-gradient(
    90deg,
    rgba(240, 249, 255, 0) 0%,
    rgba(248, 250, 252, 0.32) 36%,
    rgba(255, 255, 255, 0.64) 100%
  );

  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  overflow: hidden;
  /* Light Mode Background */
  background: var(--auth-shared-bg);
  color: #0f172a;
}

/* 动态网格背景 */
.auth-background-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
}

/* 氛围光晕 */
.auth-background-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.1), transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.05), transparent 40%);
  pointer-events: none;
  z-index: 0;
}

.auth-split-layout__brand-panel {
  display: none;
}

.auth-split-layout__workspace-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
  background: transparent;
}

.workspace-content-wrapper {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
  animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 1024px) {
  .auth-split-layout {
    grid-template-columns: 55fr 45fr;
  }

  .auth-split-layout__brand-panel {
    display: block;
    height: 100vh;
    position: relative;
    z-index: 1;
  }

  .auth-split-layout__workspace-panel {
    background: var(--auth-workspace-overlay);
    backdrop-filter: blur(14px);
  }
}

/* =========================================
   DARK MODE OVERRIDES (Quasar body--dark)
   ========================================= */
body.body--dark .auth-split-layout {
  --auth-shared-bg: linear-gradient(100deg, #020617 0%, #0f172a 52%, #1e293b 100%);
  --auth-workspace-overlay: linear-gradient(
    90deg,
    rgba(2, 6, 23, 0) 0%,
    rgba(15, 23, 42, 0.54) 38%,
    rgba(15, 23, 42, 0.86) 100%
  );

  background: var(--auth-shared-bg);
  color: #f8fafc;
}

body.body--dark .auth-background-mesh {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
  opacity: 0.55;
}

body.body--dark .auth-background-glow {
  background:
    radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15), transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.1), transparent 40%);
}

@media (min-width: 1024px) {
  body.body--dark .auth-split-layout__workspace-panel {
    background: var(--auth-workspace-overlay);
    backdrop-filter: blur(14px);
  }
}
</style>
