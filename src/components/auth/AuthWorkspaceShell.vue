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
          <q-icon name="info" size="14px" class="auth-workspace-shell__subtitle-icon" />
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
  background: var(--auth-surface);
  border: 1px solid var(--auth-border);
  border-radius: 24px;
  box-shadow: var(--auth-shadow-soft);
  color: var(--auth-text-strong);
  padding: 34px 28px 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default);
}

.auth-workspace-shell__mobile-logo {
  margin-bottom: 18px;
  display: flex;
  justify-content: center;
}

.auth-workspace-shell__mobile-logo-image {
  width: 48px;
  height: 48px;
}

.auth-workspace-shell__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-workspace-shell__title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.auth-workspace-shell__title {
  margin: 0;
  font-size: 2.02rem;
  line-height: 1.08;
  font-weight: 820;
  letter-spacing: -0.02em;
  color: var(--auth-text-strong);
  text-wrap: balance;
}

.auth-workspace-shell__title::after {
  content: '';
  display: block;
  width: 52px;
  height: 3px;
  margin: 10px auto 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--auth-primary-500), rgba(37, 99, 235, 0.35));
}

.auth-workspace-shell__subtitle {
  margin: 0;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(248, 250, 252, 0.6);
  color: var(--auth-text-secondary, #64748b);
  font-size: 0.85rem;
  line-height: 1.4;
  max-width: 95%;
  text-wrap: balance;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.auth-workspace-shell__subtitle-icon {
  color: currentColor;
  opacity: 0.75;
  flex-shrink: 0;
}

.auth-workspace-shell__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 2px;
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
  background: var(--auth-surface);
  border-color: var(--auth-border);
  box-shadow: var(--auth-shadow-soft);
}

body.body--dark .auth-workspace-shell__title {
  color: var(--auth-text-strong);
  text-shadow: 0 4px 12px rgba(14, 116, 144, 0.22);
}

body.body--dark .auth-workspace-shell__subtitle {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: var(--auth-text-secondary, #94a3b8);
}

@media (max-width: 1023px) {
  .auth-workspace-shell {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .auth-workspace-shell {
    width: 100%;
    max-width: 100%;
    padding: 18px 10px 16px;
    border-radius: var(--auth-radius-card);
    gap: 18px;
  }

  .auth-workspace-shell__mobile-logo {
    margin-bottom: 12px;
  }

  .auth-workspace-shell__title {
    font-size: 1.7rem;
    line-height: 1.12;
  }

  .auth-workspace-shell__title::after {
    width: 44px;
    margin-top: 8px;
  }

  .auth-workspace-shell__subtitle {
    width: 100%;
    text-align: center;
    font-size: 0.82rem;
    line-height: 1.35;
    white-space: normal;
    max-width: 100%;
  }
}
</style>
