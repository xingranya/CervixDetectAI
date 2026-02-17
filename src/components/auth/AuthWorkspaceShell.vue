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

      <div class="text-center">
        <h2 class="auth-workspace-shell__title">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="auth-workspace-shell__subtitle">
          {{ props.subtitle }}
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
  /* Light Mode Glass Card */
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 24px;
  box-shadow:
    0 22px 42px -10px rgba(148, 163, 184, 0.18),
    0 0 0 1px rgba(148, 163, 184, 0.08);
  color: #1e293b;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.auth-workspace-shell__title {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.auth-workspace-shell__subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

.auth-workspace-shell__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-workspace-shell__footer {
  padding-top: 8px;
  display: flex;
  justify-content: center;
}

/* =========================================
   DARK MODE OVERRIDES (Quasar body--dark)
   ========================================= */
body.body--dark .auth-workspace-shell {
  background: rgba(15, 23, 42, 0.92) !important;
  border: 1px solid rgba(148, 163, 184, 0.24) !important;
  box-shadow:
    0 20px 40px -8px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(148, 163, 184, 0.08) !important;
}

body.body--dark .auth-workspace-shell__title {
  color: #f8fafc;
}

body.body--dark .auth-workspace-shell__subtitle {
  color: #94a3b8;
}

@media (max-width: 600px) {
  .auth-workspace-shell {
    padding: 24px 20px;
    border-radius: 20px;
  }

  .auth-workspace-shell__title {
    font-size: 1.5rem;
  }
}
</style>
