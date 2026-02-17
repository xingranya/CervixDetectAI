<script setup lang="ts">
interface AuthWorkspaceShellProps {
  title: string;
  subtitle?: string;
  cardClass?: string;
}

const props = withDefaults(defineProps<AuthWorkspaceShellProps>(), {
  subtitle: '',
  cardClass: '',
});
</script>

<template>
  <div :class="['auth-workspace-shell', props.cardClass]">
    <header class="auth-workspace-shell__header">
      <slot name="mobile-logo">
        <div class="auth-workspace-shell__mobile-logo lg-hide">
          <img
            src="/logo.svg"
            alt="CervixDetectAI"
            class="auth-workspace-shell__mobile-logo-image"
          />
        </div>
      </slot>

      <div class="auth-workspace-shell__title-block text-center">
        <h2 class="auth-workspace-shell__title">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="auth-workspace-shell__subtitle">
          <q-icon name="shield" size="14px" class="auth-workspace-shell__subtitle-icon" />
          <span>{{ props.subtitle }}</span>
        </p>
      </div>
    </header>

    <main class="auth-workspace-shell__content">
      <slot />
    </main>

    <footer class="auth-workspace-shell__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style>
/* =========================================
   BASE THEME (Light Mode Default)
   ========================================= */
.auth-workspace-shell {
  width: 100%;
  max-width: 460px;
  box-sizing: border-box;
  max-height: calc(100vh - 48px);
  overflow: auto;
  /* Light Mode Glass Card */
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 24px;
  box-shadow:
    0 22px 42px -10px rgba(148, 163, 184, 0.18),
    0 0 0 1px rgba(148, 163, 184, 0.08);
  color: #1e293b;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.auth-workspace-shell__mobile-logo {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.auth-workspace-shell__mobile-logo-image {
  width: 48px;
  height: 48px;
}

.auth-workspace-shell__title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.auth-workspace-shell__title {
  margin: 0;
  font-size: 1.82rem;
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: -0.015em;
  color: #0f172a;
}

.auth-workspace-shell__subtitle {
  margin: 0;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.24);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.68), rgba(239, 246, 255, 0.92));
  color: #1d4ed8;
  font-size: 0.85rem;
  line-height: 1.3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.auth-workspace-shell__subtitle-icon {
  color: #2563eb;
}

.auth-workspace-shell__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-workspace-shell__footer {
  padding-top: 4px;
  display: flex;
  justify-content: center;
}

/* =========================================
   DARK MODE OVERRIDES (Quasar body--dark)
   ========================================= */
body.body--dark .auth-workspace-shell {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow:
    0 20px 40px -8px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(148, 163, 184, 0.08);
}

body.body--dark .auth-workspace-shell__title {
  color: #f8fafc;
  text-shadow: 0 4px 12px rgba(14, 116, 144, 0.22);
}

body.body--dark .auth-workspace-shell__subtitle {
  color: #bfdbfe;
  border-color: rgba(96, 165, 250, 0.34);
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.24), rgba(30, 58, 138, 0.16));
}

body.body--dark .auth-workspace-shell__subtitle-icon {
  color: #93c5fd;
}

@media (max-width: 1023px) {
  .auth-workspace-shell {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 600px) {
  .auth-workspace-shell {
    width: 100%;
    max-width: 100%;
    max-height: none;
    overflow: visible;
    padding: 16px 10px;
    border-radius: 16px;
  }

  .auth-workspace-shell__title {
    font-size: 1.35rem;
  }

  .auth-workspace-shell__subtitle {
    width: 100%;
    justify-content: center;
    text-align: center;
    padding: 6px 8px;
    font-size: 0.74rem;
    line-height: 1.25;
    white-space: normal;
  }
}
</style>
