<template>
  <q-page class="flex flex-center bg-grey-2">
    <div class="q-pa-md" style="width: 400px; max-width: 400px">
      <div class="text-center q-mb-xl">
        <div class="flex flex-center q-mb-sm">
          <img src="/logo.svg" alt="CervixDetectAI" style="width: 80px; height: 80px" />
        </div>
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">CervixDetect AI</div>
        <div class="text-subtitle1 text-grey">
          <span class="text-weight-medium text-primary">云端智诊团队</span>
          <span class="q-mx-sm text-grey-4">|</span>
          <span>AI驱动的宫颈癌筛查系统</span>
        </div>
      </div>

      <q-card flat bordered>
        <q-card-section class="text-center bg-primary text-white">
          <div class="text-h5">欢迎回来</div>
          <div class="text-subtitle2">登录您的账户</div>
        </q-card-section>

        <!-- 登录方式切换 -->
        <q-card-section class="q-pb-none">
          <q-tabs
            v-model="loginType"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
          >
            <q-tab name="email" label="邮箱登录" />
            <q-tab name="phone" label="手机登录" />
          </q-tabs>
          <div v-if="loginType === 'phone'" class="text-caption text-grey-6 q-mt-sm text-center">
            输入手机号和验证码，新用户将自动注册
          </div>
        </q-card-section>

        <q-card-section>
          <!-- 邮箱登录 -->
          <q-form v-if="loginType === 'email'" @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="email"
              outlined
              label="邮箱"
              type="email"
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || '请输入您的邮箱']"
            />

            <q-input
              v-model="password"
              outlined
              label="密码"
              :type="isPwd ? 'password' : 'text'"
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || '请输入您的密码']"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <div class="row q-mt-md">
              <q-checkbox v-model="rememberMe" label="记住我" />
              <q-space />
              <q-btn flat no-caps label="忘记密码？" to="/forgot-password" />
            </div>

            <!-- 协议复选框 -->
            <div class="agreement-checkbox q-mt-sm">
              <q-checkbox v-model="agreeTerms" dense>
                <span class="text-body2 text-grey-8">
                  我已阅读并同意
                  <span class="agreement-link" @click.stop.prevent="showAgreement('agreement')">
                    《用户协议》
                  </span>
                  和
                  <span class="agreement-link" @click.stop.prevent="showAgreement('privacy')">
                    《隐私政策》
                  </span>
                </span>
              </q-checkbox>
            </div>

            <div class="q-mt-lg">
              <q-btn
                color="primary"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                style="width: 100%"
                type="submit"
                :disabled="!agreeTerms || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">登录</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="text-caption text-orange text-center q-mt-xs">
                请先同意用户协议和隐私政策
              </div>
            </div>
          </q-form>

          <!-- 短信登录 -->
          <q-form v-else @submit.prevent="onSmsLogin" class="q-gutter-md">
            <q-input
              v-model="phone"
              outlined
              label="手机号"
              type="tel"
              maxlength="11"
              lazy-rules
              :rules="[(val) => /^1[3-9]\d{9}$/.test(val) || '请输入正确的手机号']"
            >
              <template v-slot:prepend>
                <q-icon name="phone" />
              </template>
            </q-input>

            <q-input
              v-model="smsCode"
              outlined
              label="验证码"
              maxlength="6"
              lazy-rules
              :rules="[(val) => (val && val.length === 6) || '请输入6位验证码']"
            >
              <template v-slot:prepend>
                <q-icon name="shield" />
              </template>
              <template v-slot:append>
                <q-btn
                  :label="countdownText"
                  :disable="!canSendSms"
                  :loading="isSendingSms"
                  flat
                  dense
                  color="primary"
                  @click="sendSmsCode"
                />
              </template>
            </q-input>

            <!-- 协议复选框 -->
            <div class="agreement-checkbox q-mt-sm">
              <q-checkbox v-model="agreeTerms" dense>
                <span class="text-body2 text-grey-8">
                  我已阅读并同意
                  <span class="agreement-link" @click.stop.prevent="showAgreement('agreement')">
                    《用户协议》
                  </span>
                  和
                  <span class="agreement-link" @click.stop.prevent="showAgreement('privacy')">
                    《隐私政策》
                  </span>
                </span>
              </q-checkbox>
            </div>

            <div class="q-mt-lg">
              <q-btn
                color="primary"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                style="width: 100%"
                type="submit"
                :disabled="!agreeTerms || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">登录 / 注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="text-caption text-orange text-center q-mt-xs">
                请先同意用户协议和隐私政策
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="q-mb-sm">还没有账户？</p>
          <q-btn flat no-caps color="primary" to="/register" label="立即注册" />
        </q-card-section>
      </q-card>
    </div>

    <!-- 协议弹窗 -->
    <AgreementDialog
      v-model="showAgreementDialog"
      :initial-tab="agreementTab"
      :show-agree-button="true"
      @agree="agreeTerms = true"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { authAPI } from 'src/services/api';
import { useQuasar } from 'quasar';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const loginType = ref<'email' | 'phone'>('email');
const email = ref('');
const password = ref('');
const phone = ref('');
const smsCode = ref('');
const isPwd = ref(true);
const rememberMe = ref(true);
const countdown = ref(0);
const isSendingSms = ref(false);

// 协议相关状态
const agreeTerms = ref(false);
const showAgreementDialog = ref(false);
const agreementTab = ref<'agreement' | 'privacy'>('agreement');

/**
 * 显示协议弹窗
 * @param tab 要显示的协议类型
 */
const showAgreement = (tab: 'agreement' | 'privacy') => {
  agreementTab.value = tab;
  showAgreementDialog.value = true;
};

// 倒计时文本
const countdownText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}秒后重试`;
  }
  return '获取验证码';
});

// 是否可以发送短信
const canSendSms = computed(() => {
  return countdown.value === 0 && !isSendingSms.value && phone.value.length === 11;
});

// 发送短信验证码（登录/注册通用）
const sendSmsCode = async () => {
  if (!canSendSms.value) return;

  // 验证手机号格式
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
    console.log('📱 发送短信验证码到:', phone.value);
    // 发送验证码时不区分登录/注册，统一使用login类型
    const response = await authAPI.sendSmsCode(phone.value, 'login');

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送，请注意查收',
        position: 'top',
      });

      // 开始倒计时
      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
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

// 邮箱登录
const onSubmit = async () => {
  try {
    const result = await authStore.login(email.value, password.value);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      const redirectPath = (router.currentRoute.value.query.redirect as string) || '/app';
      void router.push(redirectPath);
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

// 短信登录/注册（自动判断）
const onSmsLogin = async () => {
  if (!phone.value || !smsCode.value) {
    $q.notify({
      type: 'warning',
      message: '请输入手机号和验证码',
      position: 'top',
    });
    return;
  }

  try {
    console.log('📱 短信登录/注册:', phone.value, smsCode.value);

    // 先尝试登录
    let result = await authStore.smsLogin(phone.value, smsCode.value);

    // 如果登录失败且提示手机号未注册，则自动注册
    if (!result.success && result.error?.includes('未注册')) {
      console.log('📝 手机号未注册，自动注册...');
      $q.notify({
        type: 'info',
        message: '检测到新用户，正在为您注册...',
        position: 'top',
      });

      // 自动注册
      result = await authStore.smsRegister(phone.value, smsCode.value);
    }

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      const redirectPath = (router.currentRoute.value.query.redirect as string) || '/app';
      void router.push(redirectPath);
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
</script>

<style scoped>
/* 协议复选框样式 */
.agreement-checkbox {
  margin-top: 8px;
}

.agreement-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.agreement-link:hover {
  text-decoration: underline;
}
</style>
