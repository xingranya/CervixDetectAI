<template>
  <AuthSplitLayout class="auth-page forgot-password-page">
    <template #brand>
      <AuthBrandPanel
        title="安全找回访问权限，保障业务连续性"
        subtitle="通过多通道验证流程，确保账号恢复过程可审计、可追踪、可控。"
      />
    </template>

    <template #workspace>
      <AuthWorkspaceShell title="找回密码" subtitle="请选择找回方式并完成身份验证">
        <q-tabs
          v-model="resetChannel"
          dense
          class="auth-dual-channel-tabs"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="email" label="邮箱通道" />
          <q-tab name="phone" label="短信通道" />
        </q-tabs>

        <q-banner rounded class="auth-channel-banner">
          <template v-if="resetChannel === 'email'">
            邮箱通道已启用，请先获取邮箱验证码，再完成密码重置。
          </template>
          <template v-else>
            短信通道用于手机号找回，请确保手机号可接收验证码。
          </template>
        </q-banner>

        <div class="auth-channel-stage">
          <transition name="auth-channel">
            <q-form
              v-if="resetChannel === 'email'"
              key="email"
              class="auth-form q-gutter-md"
              @submit.prevent="onResetByEmail"
            >
              <q-input
                v-model="email"
                outlined
                label="邮箱"
                type="text"
                inputmode="email"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '邮箱为必填项',
                  (val) => EMAIL_PATTERN.test(val) || '邮箱格式不正确',
                ]"
              >
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="emailCode"
                outlined
                label="邮箱验证码"
                maxlength="6"
                lazy-rules
                :rules="[(val) => (val && val.length === 6) || '请输入6位验证码']"
              >
                <template #prepend>
                  <q-icon name="shield" />
                </template>
                <template #append>
                  <q-btn
                    :label="emailCountdownText"
                    :disable="!canSendEmailCode"
                    :loading="sendingEmailCode"
                    flat
                    dense
                    color="primary"
                    no-caps
                    @click="handleSendEmailCode"
                  />
                </template>
              </q-input>

              <q-input
                v-model="emailNewPassword"
                outlined
                label="新密码"
                :type="showEmailNewPassword ? 'text' : 'password'"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '请输入新密码',
                  (val) => (val && val.length >= MIN_PASSWORD_LENGTH) || `密码长度至少${MIN_PASSWORD_LENGTH}位`,
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showEmailNewPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showEmailNewPassword = !showEmailNewPassword"
                  />
                </template>
              </q-input>

              <q-input
                v-model="emailConfirmPassword"
                outlined
                label="确认新密码"
                :type="showEmailConfirmPassword ? 'text' : 'password'"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '请确认新密码',
                  (val) => val === emailNewPassword || '两次输入的密码不一致',
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showEmailConfirmPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showEmailConfirmPassword = !showEmailConfirmPassword"
                  />
                </template>
              </q-input>

              <q-btn
                color="primary"
                unelevated
                rounded
                size="lg"
                class="full-width auth-primary-cta"
                type="submit"
                :loading="resettingEmailPassword"
              >
                重置密码
              </q-btn>
            </q-form>

            <q-form
              v-else
              key="phone"
              class="auth-form q-gutter-md"
              @submit.prevent="onResetByPhone"
            >
              <q-input
                v-model="phone"
                outlined
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
                label="短信验证码"
                maxlength="6"
                lazy-rules
                :rules="[(val) => (val && val.length === 6) || '请输入6位验证码']"
              >
                <template #prepend>
                  <q-icon name="shield" />
                </template>
                <template #append>
                  <q-btn
                    :label="smsCountdownText"
                    :disable="!canSendSmsCode"
                    :loading="sendingSmsCode"
                    flat
                    dense
                    color="primary"
                    no-caps
                    @click="sendSmsCode"
                  />
                </template>
              </q-input>

              <q-input
                v-model="newPassword"
                outlined
                label="新密码"
                :type="showNewPassword ? 'text' : 'password'"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '请输入新密码',
                  (val) => (val && val.length >= MIN_PASSWORD_LENGTH) || `密码长度至少${MIN_PASSWORD_LENGTH}位`,
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showNewPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showNewPassword = !showNewPassword"
                  />
                </template>
              </q-input>

              <q-input
                v-model="confirmPassword"
                outlined
                label="确认新密码"
                :type="showConfirmPassword ? 'text' : 'password'"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '请确认新密码',
                  (val) => val === newPassword || '两次输入的密码不一致',
                ]"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </q-input>

              <q-btn
                color="primary"
                unelevated
                rounded
                size="lg"
                class="full-width auth-primary-cta"
                type="submit"
                :loading="resettingPassword"
              >
                重置密码
              </q-btn>
            </q-form>
          </transition>
        </div>

        <template #footer>
          <div class="auth-footer-links">
            <span class="text-grey-6">记起密码了？</span>
            <q-btn flat dense no-caps color="primary" to="/login" label="返回登录" />
          </div>
        </template>
      </AuthWorkspaceShell>
    </template>
  </AuthSplitLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AuthBrandPanel from 'src/components/auth/AuthBrandPanel.vue';
import AuthSplitLayout from 'src/components/auth/AuthSplitLayout.vue';
import AuthWorkspaceShell from 'src/components/auth/AuthWorkspaceShell.vue';
import { authAPI } from 'src/services/api';

const $q = useQuasar();
const router = useRouter();

const resetChannel = ref<'email' | 'phone'>('email');

const email = ref('');
const emailCode = ref('');
const emailCountdown = ref(0);
const sendingEmailCode = ref(false);
const emailTimer = ref<number | null>(null);
const emailNewPassword = ref('');
const emailConfirmPassword = ref('');
const showEmailNewPassword = ref(false);
const showEmailConfirmPassword = ref(false);
const resettingEmailPassword = ref(false);

const phone = ref('');
const smsCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const sendingSmsCode = ref(false);
const smsCountdown = ref(0);
const resettingPassword = ref(false);
const smsTimer = ref<number | null>(null);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const emailCountdownText = computed(() =>
  emailCountdown.value > 0 ? `${emailCountdown.value}秒后重试` : '获取验证码',
);

const canSendEmailCode = computed(
  () => emailCountdown.value === 0 && !sendingEmailCode.value && EMAIL_PATTERN.test(email.value),
);

const smsCountdownText = computed(() =>
  smsCountdown.value > 0 ? `${smsCountdown.value}秒后重试` : '获取验证码',
);

const canSendSmsCode = computed(
  () => smsCountdown.value === 0 && !sendingSmsCode.value && /^1[3-9]\d{9}$/.test(phone.value),
);

const clearEmailTimer = () => {
  if (emailTimer.value !== null) {
    clearInterval(emailTimer.value);
    emailTimer.value = null;
  }
};

const clearSmsTimer = () => {
  if (smsTimer.value !== null) {
    clearInterval(smsTimer.value);
    smsTimer.value = null;
  }
};

const startEmailCountdown = () => {
  clearEmailTimer();
  emailCountdown.value = 60;
  emailTimer.value = window.setInterval(() => {
    emailCountdown.value -= 1;
    if (emailCountdown.value <= 0) {
      clearEmailTimer();
    }
  }, 1000);
};

const startSmsCountdown = () => {
  clearSmsTimer();
  smsCountdown.value = 60;
  smsTimer.value = window.setInterval(() => {
    smsCountdown.value -= 1;
    if (smsCountdown.value <= 0) {
      clearSmsTimer();
    }
  }, 1000);
};

const handleSendEmailCode = async () => {
  if (!canSendEmailCode.value) return;

  try {
    sendingEmailCode.value = true;
    const result = await authAPI.sendEmailCode(email.value, 'reset_password');

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送到邮箱，请注意查收',
        position: 'top',
      });
      startEmailCountdown();
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || '验证码发送失败',
        position: 'top',
      });
    }
  } catch (error: unknown) {
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '验证码发送失败，请稍后重试';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    sendingEmailCode.value = false;
  }
};

const onResetByEmail = async () => {
  if (!email.value || !emailCode.value || !emailNewPassword.value || !emailConfirmPassword.value) {
    $q.notify({
      type: 'warning',
      message: '请完整填写重置信息',
      position: 'top',
    });
    return;
  }

  if (emailNewPassword.value.length < MIN_PASSWORD_LENGTH) {
    $q.notify({
      type: 'warning',
      message: `密码长度至少${MIN_PASSWORD_LENGTH}位`,
      position: 'top',
    });
    return;
  }

  if (emailNewPassword.value !== emailConfirmPassword.value) {
    $q.notify({
      type: 'warning',
      message: '两次输入的密码不一致',
      position: 'top',
    });
    return;
  }

  try {
    resettingEmailPassword.value = true;
    const result = await authAPI.resetPasswordByEmail(
      email.value,
      emailCode.value,
      emailNewPassword.value,
    );

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '密码重置成功，请重新登录',
        position: 'top',
      });
      void router.push('/login');
      return;
    }

    $q.notify({
      type: 'negative',
      message: result.message || '密码重置失败',
      position: 'top',
    });
  } catch (error: unknown) {
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '密码重置失败，请稍后重试';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    resettingEmailPassword.value = false;
  }
};

const sendSmsCode = async () => {
  if (!canSendSmsCode.value) return;

  try {
    sendingSmsCode.value = true;
    const result = await authAPI.sendSmsCode(phone.value, 'reset_password');

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送，请注意查收',
        position: 'top',
      });
      startSmsCountdown();
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || '验证码发送失败',
        position: 'top',
      });
    }
  } catch (error: unknown) {
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '验证码发送失败，请稍后重试';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    sendingSmsCode.value = false;
  }
};

const onResetByPhone = async () => {
  if (!phone.value || !smsCode.value || !newPassword.value || !confirmPassword.value) {
    $q.notify({
      type: 'warning',
      message: '请完整填写重置信息',
      position: 'top',
    });
    return;
  }

  if (newPassword.value.length < MIN_PASSWORD_LENGTH) {
    $q.notify({
      type: 'warning',
      message: `密码长度至少${MIN_PASSWORD_LENGTH}位`,
      position: 'top',
    });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    $q.notify({
      type: 'warning',
      message: '两次输入的密码不一致',
      position: 'top',
    });
    return;
  }

  try {
    resettingPassword.value = true;
    const result = await authAPI.resetPassword(phone.value, smsCode.value, newPassword.value);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '密码重置成功，请重新登录',
        position: 'top',
      });
      void router.push('/login');
      return;
    }

    $q.notify({
      type: 'negative',
      message: result.message || '密码重置失败',
      position: 'top',
    });
  } catch (error: unknown) {
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '密码重置失败，请稍后重试';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    resettingPassword.value = false;
  }
};

onBeforeUnmount(() => {
  clearEmailTimer();
  clearSmsTimer();
});
</script>
