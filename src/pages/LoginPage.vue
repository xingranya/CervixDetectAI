<template>
  <AuthSplitLayout class="auth-page login-page">
    <template #brand>
      <AuthBrandPanel
        title="重塑数字病理，赋能早期筛查"
        subtitle="利用领先的计算机视觉技术，为医疗机构提供高效稳定的宫颈筛查辅助工作流。"
      />
    </template>

    <template #workspace>
      <AuthWorkspaceShell title="工作台安全登录" subtitle="请通过受信任的医疗终端访问平台系统">
        <template #mobile-logo>
          <div class="auth-login-brand-meta">
            <img src="/logo.svg" alt="CervixDetect AI" class="auth-login-brand-meta__logo" />
            <div class="auth-login-brand-meta__text">
              <div class="auth-login-brand-meta__name">CervixDetect AI</div>
              <p class="auth-login-brand-meta__team">
                <strong>云端智诊团队</strong>｜AI驱动的宫颈癌筛查系统
              </p>
            </div>
          </div>
        </template>

        <q-tabs
          v-model="loginType"
          dense
          class="auth-login-tabs bg-grey-2 text-grey-7 rounded-borders q-pa-xs"
          active-color="primary"
          indicator-color="transparent"
          align="justify"
          :inline-label="!isCompactTabs"
        >
          <q-tab name="employee" icon="badge" :label="isCompactTabs ? '工号' : '工号登录'" />
          <q-tab name="email" icon="mail" :label="isCompactTabs ? '邮箱' : '电子邮箱'" />
          <q-tab name="phone" icon="smartphone" :label="isCompactTabs ? '短信' : '移动终端'" />
        </q-tabs>

        <div class="auth-login-tip auth-login-tip--stable">
          {{
            loginType === 'phone'
              ? '输入手机号和验证码，新用户将自动注册'
              : loginType === 'employee'
                ? '请选择所属医院并输入工号'
                : ' '
          }}
        </div>

        <div class="auth-channel-stage">
          <transition name="auth-channel">
          <!-- 邮箱登录 -->
          <q-form
            v-if="loginType === 'email'"
            key="email"
            class="auth-form q-gutter-y-md"
            @submit="onSubmit"
          >
            <q-input
              v-model="email"
              outlined
              rounded
              label="邮箱"
              type="text"
              inputmode="email"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入您的邮箱',
                (val) => EMAIL_PATTERN.test(val) || '请输入正确的邮箱格式',
              ]"
            >
              <template #prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              outlined
              rounded
              label="密码"
              :type="isPwd ? 'password' : 'text'"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入您的密码',
                (val) => (val && val.length >= MIN_PASSWORD_LENGTH) || `密码长度至少${MIN_PASSWORD_LENGTH}位`,
              ]"
            >
              <template #prepend>
                <q-icon name="key" />
              </template>
              <template #append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <div class="row items-center q-mt-sm">
              <q-space />
              <q-btn flat dense no-caps color="grey-7" label="找回密码" to="/forgot-password" />
            </div>

            <div class="auth-agreement-wrapper">
              <q-checkbox v-model="agreeTerms" dense>
                <span class="text-body2 text-grey-8">
                  我已阅读并同意
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('agreement')">
                    《用户协议》
                  </span>
                  和
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('privacy')">
                    《隐私政策》
                  </span>
                </span>
              </q-checkbox>
            </div>

            <div v-if="agreeTerms && !captchaVerified" class="auth-captcha-wrapper">
              <div class="auth-login-tip">请完成安全验证</div>
              <AliCaptcha
                ref="captchaRef"
                instance-id="login-email"
                @success="onCaptchaSuccess"
                @fail="onCaptchaFail"
              />
            </div>

            <div v-if="captchaVerified" class="auth-captcha-verified">
              <q-icon name="verified" color="positive" size="20px" />
              <span class="q-ml-xs text-positive">验证已通过</span>
            </div>

            <div class="q-mt-md">
              <q-btn
                class="full-width auth-login-cta"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                type="submit"
                :disabled="!agreeTerms || !captchaVerified || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">进入云端工作站</span>
                <q-spinner-hourglass v-else />
              </q-btn>

              <div v-if="!agreeTerms" class="auth-warning-text">请先同意用户协议和隐私政策</div>
              <div v-else-if="!captchaVerified" class="auth-warning-text">请完成安全验证</div>
            </div>
          </q-form>

          <!-- 短信登录 -->
          <q-form
            v-else-if="loginType === 'phone'"
            key="phone"
            class="auth-form q-gutter-y-md"
            @submit.prevent="onSmsLogin"
          >
            <q-input
              v-model="phone"
              outlined
              rounded
              label="手机号"
              type="tel"
              maxlength="11"
              lazy-rules
              :rules="[(val) => /^1[3-9]\d{9}$/.test(val) || '请输入正确的手机号']"
            >
              <template #prepend>
                <q-icon name="phone" />
              </template>
            </q-input>

            <q-input
              v-model="smsCode"
              outlined
              rounded
              label="验证码"
              maxlength="6"
              lazy-rules
              :rules="[(val) => (val && val.length === 6) || '请输入6位验证码']"
            >
              <template #prepend>
                <q-icon name="shield" />
              </template>
              <template #append>
                <q-btn
                  :label="countdownText"
                  :disable="!canSendSms"
                  :loading="isSendingSms"
                  flat
                  dense
                  color="primary"
                  no-caps
                  @click="triggerSmsCaptcha"
                />
              </template>
            </q-input>

            <q-dialog
              v-model="showSmsCaptchaDialog"
              persistent
              transition-show="fade"
              transition-hide="fade"
              @hide="onSmsCaptchaDialogHide"
            >
              <q-card style="min-width: 320px">
                <q-card-section class="row items-center q-pb-none">
                  <div class="text-h6">安全验证</div>
                  <q-space />
                  <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section class="text-center">
                  <div class="text-caption text-grey-6 q-mb-md">请完成图像验证后发送验证码</div>
                  <AliCaptcha
                    v-if="showSmsCaptchaDialog"
                    ref="smsCaptchaRef"
                    instance-id="login-sms"
                    scene-id="1dynwu1h"
                    @success="onSmsCaptchaSuccess"
                    @fail="onSmsCaptchaFail"
                  />
                </q-card-section>
              </q-card>
            </q-dialog>

            <div class="auth-agreement-wrapper">
              <q-checkbox v-model="agreeTerms" dense>
                <span class="text-body2 text-grey-8">
                  我已阅读并同意
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('agreement')">
                    《用户协议》
                  </span>
                  和
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('privacy')">
                    《隐私政策》
                  </span>
                </span>
              </q-checkbox>
            </div>

            <div class="q-mt-md">
              <q-btn
                class="full-width auth-login-cta"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                type="submit"
                :disabled="!agreeTerms || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">登录 / 注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="auth-warning-text">请先同意用户协议和隐私政策</div>
            </div>
          </q-form>

          <!-- 工号登录 -->
          <q-form
            v-else
            key="employee"
            class="auth-form q-gutter-y-md"
            @submit="onEmployeeLogin"
          >
            <q-select
              v-model="hospital"
              outlined
              rounded
              :options="HOSPITALS"
              option-label="name"
              option-value="id"
              label="所属医院"
              popup-content-class="auth-select-menu"
              :rules="[(val) => !!val || '请选择医院']"
            >
              <template #prepend>
                <q-icon name="local_hospital" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar v-if="scope.opt.iconUrl" size="24px" class="hospital-logo">
                      <img :src="scope.opt.iconUrl" :alt="scope.opt.name" />
                    </q-avatar>
                    <q-icon v-else :name="scope.opt.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-model="employeeId"
              outlined
              rounded
              label="员工编号"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入工号',
                (val) => EMPLOYEE_ID_PATTERN.test(val) || '工号需为4-32位字母、数字、下划线或中划线',
              ]"
            >
              <template #prepend>
                <q-icon name="badge" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              outlined
              rounded
              label="安全密码"
              :type="isPwd ? 'password' : 'text'"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入密码',
                (val) => (val && val.length >= MIN_PASSWORD_LENGTH) || `密码长度至少${MIN_PASSWORD_LENGTH}位`,
              ]"
            >
              <template #prepend>
                <q-icon name="key" />
              </template>
              <template #append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <div class="auth-agreement-wrapper">
              <q-checkbox v-model="agreeTerms" dense>
                <span class="text-body2 text-grey-8">
                  我已阅读并同意
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('agreement')">
                    《用户协议》
                  </span>
                  和
                  <span class="auth-agreement-link" @click.stop.prevent="showAgreement('privacy')">
                    《隐私政策》
                  </span>
                </span>
              </q-checkbox>
            </div>

            <div v-if="agreeTerms && !captchaVerified" class="auth-captcha-wrapper">
              <div class="auth-login-tip">请完成安全验证</div>
              <AliCaptcha
                ref="captchaRef"
                instance-id="login-employee"
                @success="onCaptchaSuccess"
                @fail="onCaptchaFail"
              />
            </div>

            <div v-if="captchaVerified" class="auth-captcha-verified">
              <q-icon name="verified" color="positive" size="20px" />
              <span class="q-ml-xs text-positive">验证已通过</span>
            </div>

            <div class="q-mt-md">
              <q-btn
                class="full-width auth-login-cta"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                type="submit"
                :disabled="!agreeTerms || !captchaVerified || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">进入云端工作站</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="auth-warning-text">请先同意用户协议和隐私政策</div>
              <div v-else-if="!captchaVerified" class="auth-warning-text">请完成安全验证</div>
            </div>
          </q-form>
        </transition>
      </div>

        <template #footer>
          <div class="auth-footer-links">
            <span class="text-grey-6">首次使用？</span>
            <q-btn flat dense no-caps color="primary" to="/register" label="开始注册" />
          </div>
        </template>
      </AuthWorkspaceShell>
    </template>
  </AuthSplitLayout>

  <AgreementDialog
    v-model="showAgreementDialog"
    :initial-tab="agreementTab"
    :show-agree-button="true"
    @agree="agreeTerms = true"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AuthBrandPanel from 'src/components/auth/AuthBrandPanel.vue';
import AuthSplitLayout from 'src/components/auth/AuthSplitLayout.vue';
import AuthWorkspaceShell from 'src/components/auth/AuthWorkspaceShell.vue';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
import AliCaptcha from 'src/components/common/AliCaptcha.vue';
import { HOSPITALS, type Hospital } from 'src/constants/hospitals';
import { authAPI } from 'src/services/api';
import { useAuthStore } from 'stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const loginType = ref<'email' | 'phone' | 'employee'>('employee');
const email = ref('');
const password = ref('');
const phone = ref('');
const smsCode = ref('');
const hospital = ref<Hospital | null>(null);
const employeeId = ref('');
const isPwd = ref(true);
const countdown = ref(0);
const isSendingSms = ref(false);
const smsCountdownTimer = ref<number | null>(null);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPLOYEE_ID_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;
const MIN_PASSWORD_LENGTH = 6;

const agreeTerms = ref(false);
const showAgreementDialog = ref(false);
const agreementTab = ref<'agreement' | 'privacy'>('agreement');

const captchaToken = ref('');
const captchaVerified = ref(false);
const captchaRef = ref<InstanceType<typeof AliCaptcha> | null>(null);

const showSmsCaptchaDialog = ref(false);
const smsCaptchaRef = ref<InstanceType<typeof AliCaptcha> | null>(null);

const resolveSafeRedirect = (queryRedirect: unknown): string => {
  if (typeof queryRedirect !== 'string') {
    return '/app';
  }

  const trimmedRedirect = queryRedirect.trim();
  if (!trimmedRedirect.startsWith('/')) {
    return '/app';
  }

  if (trimmedRedirect.startsWith('//') || trimmedRedirect.includes('://')) {
    return '/app';
  }

  if (trimmedRedirect.startsWith('/#')) {
    const hashPath = trimmedRedirect.slice(2);
    return hashPath.startsWith('/') ? hashPath : '/app';
  }

  if (trimmedRedirect.startsWith('#/')) {
    const hashPath = trimmedRedirect.slice(1);
    return hashPath.startsWith('/') ? hashPath : '/app';
  }

  return trimmedRedirect;
};

const navigateAfterLogin = async (): Promise<void> => {
  const redirectPath = resolveSafeRedirect(router.currentRoute.value.query.redirect);
  const navigationResult = await router.push(redirectPath);

  if (navigationResult && redirectPath !== '/app') {
    await router.push('/app');
  }
};

const resetCommonAuthState = (): void => {
  agreeTerms.value = false;
  captchaToken.value = '';
  captchaVerified.value = false;
  showAgreementDialog.value = false;
};

const resetEmailLoginState = (): void => {
  email.value = '';
  password.value = '';
  captchaRef.value?.reset();
};

const resetEmployeeLoginState = (): void => {
  hospital.value = null;
  employeeId.value = '';
  password.value = '';
  captchaRef.value?.reset();
};

const resetPhoneLoginState = (): void => {
  phone.value = '';
  smsCode.value = '';
  isSendingSms.value = false;
  countdown.value = 0;
  showSmsCaptchaDialog.value = false;
  smsCaptchaRef.value?.reset();
  clearSmsCountdownTimer();
};

watch(
  loginType,
  (newType, oldType) => {
    if (newType === oldType) {
      return;
    }

    resetCommonAuthState();

    if (oldType === 'email') {
      resetEmailLoginState();
      return;
    }

    if (oldType === 'employee') {
      resetEmployeeLoginState();
      return;
    }

    if (oldType === 'phone') {
      resetPhoneLoginState();
    }
  },
  { flush: 'post' },
);

const onCaptchaSuccess = (token: string) => {
  captchaToken.value = token;
  captchaVerified.value = true;
  $q.notify({
    type: 'positive',
    message: '验证成功',
    position: 'top',
    timeout: 1500,
  });
};

const onCaptchaFail = (error: string) => {
  if (captchaVerified.value) return;
  captchaToken.value = '';
  captchaVerified.value = false;
  $q.notify({
    type: 'negative',
    message: error || '验证失败，请重试',
    position: 'top',
  });
};

const triggerSmsCaptcha = () => {
  if (!canSendSms.value) return;

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone.value)) {
    $q.notify({
      type: 'negative',
      message: '请输入正确的手机号',
      position: 'top',
    });
    return;
  }

  showSmsCaptchaDialog.value = true;
};

const onSmsCaptchaSuccess = () => {
  showSmsCaptchaDialog.value = false;
  void sendSmsCode();
};

const onSmsCaptchaFail = (error: string) => {
  $q.notify({
    type: 'negative',
    message: error || '验证失败，请重试',
    position: 'top',
  });
};

const onSmsCaptchaDialogHide = () => {
  smsCaptchaRef.value = null;
};

const showAgreement = (tab: 'agreement' | 'privacy') => {
  agreementTab.value = tab;
  showAgreementDialog.value = true;
};

const countdownText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}秒后重试`;
  }
  return '获取验证码';
});

const canSendSms = computed(
  () => countdown.value === 0 && !isSendingSms.value && /^1[3-9]\d{9}$/.test(phone.value),
);

const isCompactTabs = computed(() => $q.screen.width < 420);

const clearSmsCountdownTimer = (): void => {
  if (smsCountdownTimer.value !== null) {
    window.clearInterval(smsCountdownTimer.value);
    smsCountdownTimer.value = null;
  }
};

const startSmsCountdown = (): void => {
  clearSmsCountdownTimer();
  countdown.value = 60;

  smsCountdownTimer.value = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = 0;
      clearSmsCountdownTimer();
    }
  }, 1000);
};

const sendSmsCode = async () => {
  if (!canSendSms.value) return;

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone.value)) {
    $q.notify({
      type: 'negative',
      message: '请输入正确的手机号',
      position: 'top',
    });
    return;
  }

  isSendingSms.value = true;
  try {
    const response = await authAPI.sendSmsCode(phone.value, 'login');

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送，请注意查收',
        position: 'top',
      });

      startSmsCountdown();
    } else {
      $q.notify({
        type: 'negative',
        message: response.message || '验证码发送失败',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('发送验证码错误:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '验证码发送失败';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    isSendingSms.value = false;
  }
};

const onSubmit = async () => {
  if (authStore.isAuthenticating) {
    return;
  }

  if (!EMAIL_PATTERN.test(email.value)) {
    $q.notify({
      type: 'warning',
      message: '请输入正确的邮箱格式',
      position: 'top',
    });
    return;
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    $q.notify({
      type: 'warning',
      message: `密码长度至少${MIN_PASSWORD_LENGTH}位`,
      position: 'top',
    });
    return;
  }

  try {
    const result = await authStore.login(email.value, password.value);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      await navigateAfterLogin();
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || '登录失败',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('登录错误:', error);
    $q.notify({
      type: 'negative',
      message: '登录过程中发生错误',
      position: 'top',
    });
  }
};

const onSmsLogin = async () => {
  if (authStore.isAuthenticating) {
    return;
  }

  if (!phone.value || !smsCode.value) {
    $q.notify({
      type: 'warning',
      message: '请输入手机号和验证码',
      position: 'top',
    });
    return;
  }

  try {
    let result = await authStore.smsLogin(phone.value, smsCode.value);

    if (!result.success && result.error?.includes('未注册')) {
      $q.notify({
        type: 'info',
        message: '检测到新用户，正在为您注册...',
        position: 'top',
      });

      result = await authStore.smsRegister(phone.value, smsCode.value);
    }

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      await navigateAfterLogin();
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || '登录失败',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('短信登录/注册错误:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '登录过程中发生错误';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  }
};

const onEmployeeLogin = async () => {
  if (authStore.isAuthenticating) {
    return;
  }

  if (!hospital.value) {
    return;
  }

  if (!EMPLOYEE_ID_PATTERN.test(employeeId.value)) {
    $q.notify({
      type: 'warning',
      message: '工号需为4-32位字母、数字、下划线或中划线',
      position: 'top',
    });
    return;
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    $q.notify({
      type: 'warning',
      message: `密码长度至少${MIN_PASSWORD_LENGTH}位`,
      position: 'top',
    });
    return;
  }

  try {
    const result = await authStore.employeeLogin(
      hospital.value.id,
      employeeId.value,
      password.value,
    );

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      await navigateAfterLogin();
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || '登录失败',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('工号登录错误:', error);
    $q.notify({
      type: 'negative',
      message: '登录过程中发生错误',
      position: 'top',
    });
  }
};

onBeforeUnmount(() => {
  clearSmsCountdownTimer();
  captchaRef.value?.reset();
  smsCaptchaRef.value?.reset();
});
</script>

<style scoped>
.auth-login-brand-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--app-border-default);
  border-radius: 12px;
  background: var(--app-surface-soft, var(--app-surface));
}

.auth-login-brand-meta__logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
  flex-shrink: 0;
}

.auth-login-brand-meta__text {
  min-width: 0;
}

.auth-login-brand-meta__name {
  font-size: 0.92rem;
  line-height: 1.25;
  font-weight: 700;
  color: var(--app-text-primary);
}

.auth-login-brand-meta__team :deep(strong) {
  color: var(--q-primary);
  font-weight: 700;
}

.auth-login-brand-meta__team {
  margin: 4px 0 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--app-text-secondary);
}

.auth-login-cta {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 52%, #1e40af 100%);
  border: 1px solid rgba(37, 99, 235, 0.46);
  box-shadow:
    0 10px 24px rgba(37, 99, 235, 0.28),
    0 2px 8px rgba(30, 64, 175, 0.2);
  transition:
    transform var(--app-motion-duration-fast) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-fast) var(--app-motion-ease-default),
    filter var(--app-motion-duration-fast) var(--app-motion-ease-default);
}

.auth-login-cta :deep(.q-focus-helper),
.auth-login-cta :deep(.q-btn__overlay) {
  display: none;
}

.auth-login-cta:not([disabled]):hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
  box-shadow:
    0 14px 30px rgba(37, 99, 235, 0.34),
    0 4px 12px rgba(30, 64, 175, 0.26);
}

.auth-login-cta:not([disabled]):active {
  transform: translateY(0);
  filter: brightness(0.98);
}

.auth-login-cta[disabled],
.auth-login-cta:disabled {
  color: rgba(255, 255, 255, 0.72);
  background: linear-gradient(135deg, #5b8def 0%, #4d79d8 100%);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow: none;
  filter: none;
}

@media (max-width: 600px) {
  .auth-login-brand-meta {
    padding: 8px 10px;
    gap: 8px;
  }

  .auth-login-brand-meta__logo {
    width: 32px;
    height: 32px;
  }

  .auth-login-brand-meta__name {
    font-size: 0.86rem;
  }

  .auth-login-brand-meta__team {
    font-size: 0.72rem;
    line-height: 1.35;
  }

  .auth-login-tabs {
    padding: 2px !important;
  }

  .auth-login-tabs :deep(.q-tab) {
    min-height: 34px;
    min-width: 0;
    padding: 0 4px;
    font-size: 12px;
  }

  .auth-login-tabs :deep(.q-tab__content) {
    min-width: 0;
    gap: 2px;
  }

  .auth-login-tabs :deep(.q-tab__icon) {
    margin-right: 2px;
    font-size: 16px;
  }

  .auth-login-tabs :deep(.q-tab__label) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
  }
}
</style>
