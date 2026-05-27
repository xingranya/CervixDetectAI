<script setup lang="ts">
/**
 * 认证页面双栏布局骨架 - Modern Medical Tech Edition
 * - 桌面端：品牌区 + 工作台区 (52/48 Split)
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
    linear-gradient(rgba(56, 189, 248, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.56;
  pointer-events: none;
  z-index: 0;
}

/* 氛围光晕 */
.auth-background-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 16% 20%, rgba(37, 99, 235, 0.16), transparent 42%),
    radial-gradient(circle at 86% 80%, rgba(56, 189, 248, 0.08), transparent 45%);
  pointer-events: none;
  z-index: 0;
}

.auth-split-layout__brand-panel {
  display: none;
}

.auth-split-layout__workspace-panel {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 20px;
  position: relative;
  z-index: 1;
  background: transparent;
}

.workspace-content-wrapper {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  animation: workspace-enter var(--app-motion-duration-enter, 250ms) cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes workspace-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1023px) {
  .auth-split-layout {
    overflow-y: auto;
  }

  .auth-background-mesh,
  .auth-background-glow {
    display: none;
  }

  .auth-split-layout__workspace-panel {
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }
}

@media (max-width: 600px) {
  .auth-split-layout {
    overflow-y: auto;
  }

  .auth-split-layout__workspace-panel {
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    padding: 8px;
  }

  .workspace-content-wrapper {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0;
  }
}

@media (min-width: 1024px) {
  .auth-split-layout {
    grid-template-columns: 52fr 48fr;
  }

  .auth-split-layout__brand-panel {
    display: block;
    min-height: 100%;
    position: relative;
    z-index: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .auth-split-layout__workspace-panel {
    background: var(--auth-workspace-overlay);
    backdrop-filter: saturate(var(--app-glass-saturate)) blur(12px);
    -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(12px);
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
    linear-gradient(rgba(148, 163, 184, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.028) 1px, transparent 1px);
  opacity: 0.5;
}

body.body--dark .auth-background-glow {
  background:
    radial-gradient(circle at 16% 20%, rgba(37, 99, 235, 0.26), transparent 42%),
    radial-gradient(circle at 86% 80%, rgba(14, 165, 233, 0.11), transparent 45%);
}

@media (min-width: 1024px) {
  body.body--dark .auth-split-layout__workspace-panel {
    background: var(--auth-workspace-overlay);
    backdrop-filter: saturate(var(--app-glass-saturate)) blur(12px);
    -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(12px);
  }
}
</style>
