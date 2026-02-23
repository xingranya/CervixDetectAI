<template>
  <AuthSplitLayout class="auth-page register-page">
    <template #brand>
      <AuthBrandPanel
        title="构建可信筛查入口，连接机构与临床场景"
        subtitle="通过标准化账号体系和安全验证流程，保障医疗数据接入质量与可追溯性。"
      />
    </template>

    <template #workspace>
      <AuthWorkspaceShell
        title="创建新账户"
        subtitle="请填写基础信息完成注册"
        card-class="auth-register-shell"
      >
        <q-form @submit="onRegister" class="auth-form q-gutter-md">
          <div class="auth-section-title">身份信息</div>

          <q-select
            v-model="hospital"
            outlined
            :options="HOSPITALS"
            option-label="name"
            option-value="id"
            label="所属医院（工号注册时必填）"
            popup-content-class="auth-select-menu"
            :rules="[(val) => val || (!department && !entryYear && !sequenceNumber) || '请选择所属医院']"
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

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="department"
                outlined
                :options="DEPARTMENTS"
                option-label="name"
                option-value="code"
                label="科室"
                popup-content-class="auth-select-menu"
              />
            </div>
            <div class="col-6 col-sm-4">
              <q-input
                v-model="entryYear"
                outlined
                label="入职年份"
                mask="####"
                :rules="[
                  (val) => !val || val.length === 4 || '4位年份',
                  (val) =>
                    !val ||
                    (parseInt(val) > 1900 && parseInt(val) <= new Date().getFullYear()) ||
                    '无效年份',
                ]"
              />
            </div>
            <div class="col-6 col-sm-4">
              <q-input
                v-model="sequenceNumber"
                outlined
                label="顺序号"
                mask="##"
                :rules="[(val) => !val || val.length === 2 || '2位数字']"
              />
            </div>
          </div>

          <div class="auth-employee-preview text-caption text-grey-6">
            预览工号: {{ department ? department.code : 'XX' }}{{ entryYear || 'YYYY'
            }}{{ sequenceNumber || 'NN' }}
          </div>

          <q-separator class="q-my-sm" />
          <div class="text-caption text-grey-6 text-center q-mb-sm">或使用邮箱注册</div>

          <div class="auth-section-title">账户信息</div>

          <q-input
            v-model="phone"
            outlined
            label="手机号（可选）"
            type="tel"
            maxlength="11"
            lazy-rules
            :rules="[(val) => !val || val.length === 0 || /^1[3-9]\d{9}$/.test(val) || '手机号格式不正确']"
          >
            <template #prepend>
              <q-icon name="phone" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            outlined
            label="邮箱（可选）"
            type="text"
            inputmode="email"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            lazy-rules
            :rules="[
              (val) => !val || val.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确',
            ]"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-if="email"
            v-model="emailCode"
            outlined
            label="邮箱验证码"
            maxlength="6"
            lazy-rules
            :rules="[() => !email || !!emailCode || '请输入验证码']"
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

          <q-input v-model="realName" outlined label="姓名（可选）" lazy-rules>
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <div class="auth-section-title">安全信息</div>

          <q-input
            v-model="password"
            outlined
            label="密码"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[
              (val) => (val && val.length > 0) || '请输入密码',
              (val) => (val && val.length >= MIN_PASSWORD_LENGTH) || `密码长度至少${MIN_PASSWORD_LENGTH}位`,
            ]"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <q-input
            v-model="confirmPassword"
            outlined
            label="确认密码"
            :type="isConfirmPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[
              (val) => (val && val.length > 0) || '请确认密码',
              (val) => val === password || '两次输入的密码不一致',
            ]"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="isConfirmPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isConfirmPwd = !isConfirmPwd"
              />
            </template>
          </q-input>

          <div class="auth-agreement-wrapper q-mt-sm">
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

          <div class="auth-captcha-wrapper q-mt-md" v-if="agreeTerms && !captchaVerified">
            <div class="text-caption text-grey-6 q-mb-sm text-center">请完成安全验证</div>
            <AliCaptcha
              instance-id="register"
              @success="onCaptchaSuccess"
              @fail="onCaptchaFail"
            />
          </div>
          <div v-if="captchaVerified" class="auth-captcha-verified q-mt-md text-center">
            <q-icon name="verified" color="positive" size="20px" />
            <span class="q-ml-xs text-positive">验证已通过</span>
          </div>

          <q-dialog v-model="showEmailCaptcha" persistent transition-show="fade" transition-hide="fade">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">安全验证</div>
                <div class="text-caption text-grey-7">发送验证码前需要完成安全验证</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <AliCaptcha
                  instance-id="email-code"
                  @success="onEmailCaptchaSuccess"
                  @fail="onEmailCaptchaFail"
                />
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat label="取消" color="grey" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <div class="q-mt-lg">
            <q-btn
              color="primary"
              :loading="authStore.isAuthenticating"
              unelevated
              rounded
              size="lg"
              class="full-width auth-primary-cta"
              type="submit"
              :disabled="!agreeTerms || !captchaVerified || authStore.isAuthenticating"
            >
              <span v-if="!authStore.isAuthenticating">注册</span>
              <q-spinner-hourglass v-else />
            </q-btn>
            <div v-if="!agreeTerms" class="auth-warning-text">请先同意用户协议和隐私政策</div>
            <div v-else-if="!captchaVerified" class="auth-warning-text">请完成安全验证</div>
          </div>
        </q-form>

        <template #footer>
          <div class="auth-footer-links">
            <span class="text-grey-6">已有账户？</span>
            <q-btn flat dense no-caps color="primary" to="/login" label="立即登录" />
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
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { useQuasar } from 'quasar';
import AuthBrandPanel from 'src/components/auth/AuthBrandPanel.vue';
import AuthSplitLayout from 'src/components/auth/AuthSplitLayout.vue';
import AuthWorkspaceShell from 'src/components/auth/AuthWorkspaceShell.vue';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
import AliCaptcha from 'src/components/common/AliCaptcha.vue';
import { HOSPITALS, DEPARTMENTS, type Hospital, type Department } from 'src/constants/hospitals';
import { authAPI } from 'src/services/api';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const hospital = ref<Hospital | null>(null);
const department = ref<Department | null>(null);
const entryYear = ref('');
const sequenceNumber = ref('');
const phone = ref('');
const email = ref('');
const emailCode = ref('');
const emailCountdown = ref(0);
const sendingEmailCode = ref(false);
const emailCountdownTimer = ref<number | null>(null);
const showEmailCaptcha = ref(false);
const realName = ref('');
const password = ref('');
const confirmPassword = ref('');
const isPwd = ref(true);
const isConfirmPwd = ref(true);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// 协议相关状态
const agreeTerms = ref(false);
const showAgreementDialog = ref(false);
const agreementTab = ref<'agreement' | 'privacy'>('agreement');

// 验证码相关状态
const captchaToken = ref('');
const captchaVerified = ref(false);

// 计算属性：邮箱格式是否有效
const isValidEmail = computed(() => {
  return email.value && EMAIL_PATTERN.test(email.value);
});

// 计算属性：是否可以发送邮箱验证码
const canSendEmailCode = computed(() => {
  return isValidEmail.value && emailCountdown.value === 0 && !sendingEmailCode.value;
});

// 计算属性：邮箱验证码倒计时文本
const emailCountdownText = computed(() => {
  return emailCountdown.value > 0 ? `${emailCountdown.value}秒后重试` : '获取验证码';
});

/**
 * 发送邮箱验证码（触发AI验证）
 */
const handleSendEmailCode = () => {
  if (!isValidEmail.value) {
    $q.notify({
      type: 'warning',
      message: '请输入有效的邮箱地址',
      position: 'top',
    });
    return;
  }
  showEmailCaptcha.value = true;
};

/**
 * 邮箱验证码AI验证成功回调
 */
const onEmailCaptchaSuccess = async () => {
  try {
    sendingEmailCode.value = true;

    const result = await authAPI.sendEmailCode(email.value, 'register');

    if (result.success || result.message) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送，若未收到请检查垃圾箱',
        caption: '邮件已发送，5分钟内有效',
        position: 'top',
        timeout: 5000,
      });

      // 开始倒计时
      startEmailCountdown();

      // 关闭弹窗
      showEmailCaptcha.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: '发送验证码失败',
        position: 'top',
      });
    }
  } catch (error: unknown) {
    console.error('发送邮箱验证码失败:', error);
    let errorMessage = '发送验证码失败，请稍后重试';
    // 解析后端返回的错误消息
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    sendingEmailCode.value = false;
  }
};

/**
 * 邮箱验证码AI验证失败回调
 */
const onEmailCaptchaFail = (error: string) => {
  $q.notify({
    type: 'negative',
    message: error || '验证失败，请重试',
    position: 'top',
  });
};

const clearEmailCountdownTimer = (): void => {
  if (emailCountdownTimer.value !== null) {
    window.clearInterval(emailCountdownTimer.value);
    emailCountdownTimer.value = null;
  }
};

const startEmailCountdown = () => {
  clearEmailCountdownTimer();
  emailCountdown.value = 60;

  emailCountdownTimer.value = window.setInterval(() => {
    emailCountdown.value--;
    if (emailCountdown.value <= 0) {
      emailCountdown.value = 0;
      clearEmailCountdownTimer();
    }
  }, 1000);
};

/**
 * 验证码验证成功回调
 */
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

/**
 * 验证码验证失败回调
 */
const onCaptchaFail = (error: string) => {
  // 避免第三方脚本在成功后再次回调失败，导致按钮“概率性置灰”
  if (captchaVerified.value) return;
  captchaToken.value = '';
  captchaVerified.value = false;
  $q.notify({
    type: 'negative',
    message: error || '验证失败，请重试',
    position: 'top',
  });
};

/**
 * 显示协议弹窗
 * @param tab 要显示的协议类型
 */
const showAgreement = (tab: 'agreement' | 'privacy') => {
  agreementTab.value = tab;
  showAgreementDialog.value = true;
};

onBeforeUnmount(() => {
  clearEmailCountdownTimer();
});

const onRegister = async () => {
  try {
    // 验证：邮箱和工号至少需要一个
    const hasEmail = !!email.value;
    const hasEmployeeId = !!(department.value && entryYear.value && sequenceNumber.value);

    if (password.value.length < MIN_PASSWORD_LENGTH) {
      $q.notify({
        type: 'warning',
        message: `密码长度至少${MIN_PASSWORD_LENGTH}位`,
        position: 'top',
      });
      return;
    }

    if (!hasEmail && !hasEmployeeId) {
      $q.notify({
        type: 'warning',
        message: '请填写邮箱或工号信息（至少需要一种）',
        position: 'top',
      });
      return;
    }

    // 验证：如果填写了邮箱，必须填写验证码
    if (hasEmail && !emailCode.value) {
      $q.notify({
        type: 'warning',
        message: '请输入邮箱验证码',
        position: 'top',
      });
      return;
    }

    // 验证：如果填写了工号，必须选择医院
    if (hasEmployeeId && !hospital.value) {
      $q.notify({
        type: 'warning',
        message: '工号注册需要选择所属医院',
        position: 'top',
      });
      return;
    }

    // 构建注册数据
    const userData: {
      password: string;
      hospital_id?: string;
      employee_id?: string;
      email?: string;
      emailCode?: string;
      real_name?: string;
      phone?: string;
    } = {
      password: password.value,
    };

    // 添加工号信息（如果提供）
    if (hasEmployeeId && hospital.value) {
      userData.hospital_id = hospital.value.id;
      userData.employee_id = `${department.value!.code}${entryYear.value}${sequenceNumber.value}`;
    }

    // 添加邮箱信息（如果提供）
    if (hasEmail) {
      userData.email = email.value;
      userData.emailCode = emailCode.value;
    }

    // 添加可选字段
    if (realName.value) {
      userData.real_name = realName.value;
    }
    if (phone.value) {
      userData.phone = phone.value;
    }

    const result = await authStore.register(userData);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '注册成功！即将跳转到主页...',
        position: 'top',
      });
      setTimeout(() => {
        void router.push('/app');
      }, 1000);
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || '注册失败',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('注册错误:', error);
    $q.notify({
      type: 'negative',
      message: '注册过程中发生错误',
      position: 'top',
    });
  }
};
</script>

<style scoped>
.auth-section-title {
  margin: 8px 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-secondary);
}

.auth-employee-preview {
  padding: 2px 2px 0;
}
</style>
