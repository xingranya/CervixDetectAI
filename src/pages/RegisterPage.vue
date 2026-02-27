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
        subtitle="请按步骤完成注册"
        card-class="auth-register-shell"
      >
        <q-form @submit="onRegister" class="auth-form auth-register-form q-gutter-y-md">
          <div class="auth-register-stepper" role="tablist" aria-label="注册步骤">
            <button
              type="button"
              class="auth-register-step"
              :class="{ 'is-active': currentStep === 1, 'is-complete': currentStep === 2 }"
              @click="currentStep = 1"
            >
              <span class="auth-register-step__index">1</span>
              <span class="auth-register-step__label">选择方式</span>
            </button>
            <button
              type="button"
              class="auth-register-step"
              :class="{ 'is-active': currentStep === 2 }"
              @click="currentStep = 2"
            >
              <span class="auth-register-step__index">2</span>
              <span class="auth-register-step__label">填写信息</span>
            </button>
          </div>

          <section v-if="currentStep === 1" class="auth-register-step-panel">
            <div class="auth-register-step-title">步骤 1：选择注册方式</div>
            <p class="auth-register-step-subtitle">先确定注册路径，再填写对应必填字段。</p>

            <div class="auth-register-mode-grid">
              <button
                type="button"
                class="auth-register-mode-card"
                :class="{ 'is-active': registerMode === 'employee' }"
                @click="registerMode = 'employee'"
              >
                <q-icon name="badge" size="22px" />
                <div class="auth-register-mode-card__body">
                  <div class="auth-register-mode-card__title">工号注册</div>
                  <div class="auth-register-mode-card__desc">医院 + 工号信息 + 密码</div>
                </div>
              </button>

              <button
                type="button"
                class="auth-register-mode-card"
                :class="{ 'is-active': registerMode === 'contact' }"
                @click="registerMode = 'contact'"
              >
                <q-icon name="mail" size="22px" />
                <div class="auth-register-mode-card__body">
                  <div class="auth-register-mode-card__title">邮箱注册</div>
                  <div class="auth-register-mode-card__desc">邮箱 + 验证码 + 密码</div>
                </div>
              </button>
            </div>

            <div class="auth-register-step-actions">
              <q-btn
                class="auth-register-next-btn"
                color="primary"
                unelevated
                rounded
                no-caps
                label="下一步，填写信息"
                @click="currentStep = 2"
              />
            </div>
          </section>

          <section v-else class="auth-register-step-panel">
            <div class="auth-register-step-title">步骤 2：填写注册信息</div>
            <div class="auth-register-mode-tip">
              <span>
                当前方式：
                <strong>{{ registerMode === 'employee' ? '工号注册' : '邮箱注册' }}</strong>
              </span>
              <q-btn flat dense no-caps color="primary" label="切换方式" @click="currentStep = 1" />
            </div>

            <div v-if="registerMode === 'employee'" class="q-gutter-y-sm">
              <div class="auth-register-section-heading">工号信息（必填）</div>
              <q-select
                v-model="employeeDraft.hospital"
                outlined
                :options="HOSPITALS"
                option-label="name"
                option-value="id"
                label="所属医院"
                popup-content-class="auth-select-menu"
                :rules="[(val) => !!val || '请选择所属医院']"
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
                    v-model="employeeDraft.department"
                    outlined
                    :options="DEPARTMENTS"
                    option-label="name"
                    option-value="code"
                    label="科室"
                    popup-content-class="auth-select-menu"
                    :rules="[(val) => !!val || '请选择科室']"
                  />
                </div>
                <div class="col-6 col-sm-4">
                  <q-input
                    v-model="employeeDraft.entryYear"
                    outlined
                    label="入职年份"
                    mask="####"
                    :rules="[
                      (val) => !!val || '请输入入职年份',
                      (val) => val.length === 4 || '4位年份',
                      (val) =>
                        (parseInt(val) > 1900 && parseInt(val) <= new Date().getFullYear()) ||
                        '无效年份',
                    ]"
                  />
                </div>
                <div class="col-6 col-sm-4">
                  <q-input
                    v-model="employeeDraft.sequenceNumber"
                    outlined
                    label="顺序号"
                    mask="##"
                    :rules="[(val) => !!val || '请输入顺序号', (val) => val.length === 2 || '2位数字']"
                  />
                </div>
              </div>

              <div class="auth-employee-preview text-caption text-grey-6">
                预览工号: {{ employeeIdPreview }}
              </div>
            </div>

            <div v-else class="q-gutter-y-sm">
              <div class="auth-register-section-heading">邮箱信息（必填）</div>
              <q-input
                v-model="contactDraft.email"
                outlined
                label="邮箱"
                type="text"
                inputmode="email"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || '请输入邮箱',
                  (val) => EMAIL_PATTERN.test(val) || '邮箱格式不正确',
                ]"
              >
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="contactDraft.emailCode"
                outlined
                label="邮箱验证码"
                maxlength="6"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '请输入验证码']"
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

              <div class="auth-register-secondary-entry">
                <q-btn
                  outline
                  no-caps
                  color="primary"
                  class="auth-register-secondary-entry__btn"
                  icon="sms"
                  label="使用手机号验证码注册"
                  @click="goToPhoneRegister"
                />
                <p class="auth-register-secondary-entry__tip">
                  将跳转到短信通道，新用户可在登录页自动完成手机号注册。
                </p>
              </div>
            </div>

            <q-expansion-item
              class="auth-register-extra"
              icon="notes"
              expand-icon="expand_more"
              label="补充资料（可选）"
              caption="手机号仅用于联系资料，不作为本页面注册凭据"
              switch-toggle-side
              dense-toggle
            >
              <div class="q-pt-sm q-gutter-y-sm">
                <q-input
                  v-model="profileDraft.phone"
                  outlined
                  label="手机号（仅资料）"
                  type="tel"
                  maxlength="11"
                  lazy-rules
                  :rules="[
                    (val) => !val || /^1[3-9]\\d{9}$/.test(val) || '手机号格式不正确',
                  ]"
                >
                  <template #prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>

                <q-input v-model="profileDraft.realName" outlined label="姓名（可选）" lazy-rules>
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>
            </q-expansion-item>

            <div class="auth-register-section-heading q-mt-xs">安全信息（必填）</div>

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
              <AliCaptcha instance-id="register" @success="onCaptchaSuccess" @fail="onCaptchaFail" />
            </div>
            <div v-if="captchaVerified" class="auth-captcha-verified q-mt-md text-center">
              <q-icon name="verified" color="positive" size="20px" />
              <span class="q-ml-xs text-positive">验证已通过</span>
            </div>

            <div class="q-mt-md auth-register-action-row">
              <q-btn
                flat
                no-caps
                color="primary"
                class="auth-register-back-btn"
                label="返回上一步"
                @click="currentStep = 1"
              />
              <q-space />
              <q-btn
                color="primary"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                class="auth-primary-cta auth-register-submit full-width"
                type="submit"
                :disabled="!agreeTerms || !captchaVerified || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
            </div>

            <div v-if="!agreeTerms" class="auth-warning-text">请先同意用户协议和隐私政策</div>
            <div v-else-if="!captchaVerified" class="auth-warning-text">请完成安全验证</div>
          </section>

          <q-dialog
            v-model="showEmailCaptcha"
            persistent
            transition-show="fade"
            transition-hide="fade"
          >
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
import { computed, onBeforeUnmount, ref, watch } from 'vue';
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

type RegisterMode = 'employee' | 'contact';

interface EmployeeDraft {
  hospital: Hospital | null;
  department: Department | null;
  entryYear: string;
  sequenceNumber: string;
}

interface ContactDraft {
  email: string;
  emailCode: string;
}

interface ProfileDraft {
  phone: string;
  realName: string;
}

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const registerMode = ref<RegisterMode>('employee');
const currentStep = ref<1 | 2>(1);

const employeeDraft = ref<EmployeeDraft>({
  hospital: null,
  department: null,
  entryYear: '',
  sequenceNumber: '',
});

const contactDraft = ref<ContactDraft>({
  email: '',
  emailCode: '',
});

const profileDraft = ref<ProfileDraft>({
  phone: '',
  realName: '',
});

const emailCountdown = ref(0);
const sendingEmailCode = ref(false);
const emailCountdownTimer = ref<number | null>(null);
const showEmailCaptcha = ref(false);
const password = ref('');
const confirmPassword = ref('');
const isPwd = ref(true);
const isConfirmPwd = ref(true);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const MIN_PASSWORD_LENGTH = 6;

const agreeTerms = ref(false);
const showAgreementDialog = ref(false);
const agreementTab = ref<'agreement' | 'privacy'>('agreement');

const captchaToken = ref('');
const captchaVerified = ref(false);

const employeeIdPreview = computed(() => {
  return `${employeeDraft.value.department?.code || 'XX'}${employeeDraft.value.entryYear || 'YYYY'}${
    employeeDraft.value.sequenceNumber || 'NN'
  }`;
});

const isValidEmail = computed(() => EMAIL_PATTERN.test(contactDraft.value.email));

const canSendEmailCode = computed(() => {
  return isValidEmail.value && emailCountdown.value === 0 && !sendingEmailCode.value;
});

const emailCountdownText = computed(() => {
  return emailCountdown.value > 0 ? `${emailCountdown.value}秒后重试` : '获取验证码';
});

watch(
  () => contactDraft.value.email,
  (newEmail, oldEmail) => {
    if (newEmail === oldEmail) return;
    contactDraft.value.emailCode = '';
    clearEmailCountdownTimer();
    emailCountdown.value = 0;
  },
);

watch(registerMode, () => {
  captchaToken.value = '';
  captchaVerified.value = false;
  showEmailCaptcha.value = false;
});

const clearEmailCountdownTimer = (): void => {
  if (emailCountdownTimer.value !== null) {
    window.clearInterval(emailCountdownTimer.value);
    emailCountdownTimer.value = null;
  }
};

const startEmailCountdown = (): void => {
  clearEmailCountdownTimer();
  emailCountdown.value = 60;

  emailCountdownTimer.value = window.setInterval(() => {
    emailCountdown.value -= 1;
    if (emailCountdown.value <= 0) {
      emailCountdown.value = 0;
      clearEmailCountdownTimer();
    }
  }, 1000);
};

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

const onEmailCaptchaSuccess = async () => {
  try {
    sendingEmailCode.value = true;
    const result = await authAPI.sendEmailCode(contactDraft.value.email, 'register');

    if (result.success || result.message) {
      $q.notify({
        type: 'positive',
        message: '验证码已发送，若未收到请检查垃圾箱',
        caption: '邮件已发送，5分钟内有效',
        position: 'top',
        timeout: 5000,
      });

      startEmailCountdown();
      showEmailCaptcha.value = false;
      return;
    }

    $q.notify({
      type: 'negative',
      message: '发送验证码失败',
      position: 'top',
    });
  } catch (error: unknown) {
    console.error('发送邮箱验证码失败:', error);
    let errorMessage = '发送验证码失败，请稍后重试';

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

const onEmailCaptchaFail = (error: string) => {
  $q.notify({
    type: 'negative',
    message: error || '验证失败，请重试',
    position: 'top',
  });
};

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

const showAgreement = (tab: 'agreement' | 'privacy') => {
  agreementTab.value = tab;
  showAgreementDialog.value = true;
};

const goToPhoneRegister = async () => {
  await router.push({
    path: '/login',
    query: { mode: 'phone' },
  });
};

onBeforeUnmount(() => {
  clearEmailCountdownTimer();
});

const onRegister = async () => {
  if (currentStep.value === 1) {
    currentStep.value = 2;
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

  if (confirmPassword.value !== password.value) {
    $q.notify({
      type: 'warning',
      message: '两次输入的密码不一致',
      position: 'top',
    });
    return;
  }

  if (registerMode.value === 'employee') {
    const { hospital, department, entryYear, sequenceNumber } = employeeDraft.value;
    if (!hospital || !department || !entryYear || !sequenceNumber) {
      $q.notify({
        type: 'warning',
        message: '请完整填写工号信息',
        position: 'top',
      });
      return;
    }

    const parsedYear = parseInt(entryYear, 10);
    const currentYear = new Date().getFullYear();
    if (entryYear.length !== 4 || Number.isNaN(parsedYear) || parsedYear <= 1900 || parsedYear > currentYear) {
      $q.notify({
        type: 'warning',
        message: '请输入有效的4位入职年份',
        position: 'top',
      });
      return;
    }

    if (sequenceNumber.length !== 2) {
      $q.notify({
        type: 'warning',
        message: '顺序号需为2位数字',
        position: 'top',
      });
      return;
    }
  } else {
    if (!isValidEmail.value) {
      $q.notify({
        type: 'warning',
        message: '请输入正确的邮箱格式',
        position: 'top',
      });
      return;
    }

    if (!contactDraft.value.emailCode || contactDraft.value.emailCode.length !== 6) {
      $q.notify({
        type: 'warning',
        message: '请输入6位邮箱验证码',
        position: 'top',
      });
      return;
    }
  }

  if (profileDraft.value.phone && !PHONE_PATTERN.test(profileDraft.value.phone)) {
    $q.notify({
      type: 'warning',
      message: '手机号格式不正确',
      position: 'top',
    });
    return;
  }

  try {
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

    if (registerMode.value === 'employee') {
      const { hospital, department, entryYear, sequenceNumber } = employeeDraft.value;
      if (!hospital || !department) {
        $q.notify({
          type: 'warning',
          message: '请完整填写工号信息',
          position: 'top',
        });
        return;
      }

      userData.hospital_id = hospital.id;
      userData.employee_id = `${department.code}${entryYear}${sequenceNumber}`;
    } else {
      userData.email = contactDraft.value.email;
      userData.emailCode = contactDraft.value.emailCode;
    }

    if (profileDraft.value.realName) {
      userData.real_name = profileDraft.value.realName;
    }

    if (profileDraft.value.phone) {
      userData.phone = profileDraft.value.phone;
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
      return;
    }

    $q.notify({
      type: 'negative',
      message: result.error || '注册失败',
      position: 'top',
    });
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

<style scoped></style>
