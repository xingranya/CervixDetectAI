<template>
  <q-page class="flex flex-center bg-grey-2">
    <div class="q-pa-md" style="width: 400px; max-width: 400px">
      <div class="text-center q-mb-xl">
        <div class="flex flex-center q-mb-sm">
          <img src="/logo.svg" alt="CervixDetectAI" style="width: 80px; height: 80px" />
        </div>
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">CervixDetectAI</div>
        <div class="text-subtitle1 text-grey">AI驱动的宫颈癌筛查系统</div>
      </div>

      <q-card flat bordered>
        <q-card-section class="text-center bg-primary text-white">
          <div class="text-h5">创建新账户</div>
          <div class="text-subtitle2">注册以使用系统</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onRegister" class="q-gutter-md">
            <!-- 1. 所属医院（必填） -->
            <q-select
              v-model="hospital"
              outlined
              :options="HOSPITALS"
              option-label="name"
              option-value="id"
              label="所属医院"
              :rules="[(val) => !!val || '请选择所属医院']"
            >
              <template v-slot:prepend>
                <q-icon name="local_hospital" />
              </template>
              <template v-slot:option="scope">
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

            <!-- 2. 工号（必填） -->
            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <q-select
                  v-model="department"
                  outlined
                  :options="DEPARTMENTS"
                  option-label="name"
                  option-value="code"
                  label="科室"
                  :rules="[(val) => !!val || '请选择']"
                />
              </div>
              <div class="col-4">
                <q-input
                  v-model="entryYear"
                  outlined
                  label="入职年份"
                  mask="####"
                  :rules="[
                    (val) => !!val || '必填',
                    (val) => val.length === 4 || '4位年份',
                    (val) => parseInt(val) > 1900 && parseInt(val) <= new Date().getFullYear() || '无效年份'
                  ]"
                />
              </div>
              <div class="col-4">
                <q-input
                  v-model="sequenceNumber"
                  outlined
                  label="顺序号"
                  mask="##"
                  :rules="[(val) => !!val || '必填', (val) => val.length === 2 || '2位数字']"
                />
              </div>
              <div class="col-12 q-mb-md text-caption text-grey">
                预览工号: {{ department ? department.code : 'XX' }}{{ entryYear || 'YYYY' }}{{ sequenceNumber || 'NN' }}
              </div>
            </div>

            <!-- 3. 手机号（可选） -->
            <q-input
              v-model="phone"
              outlined
              label="手机号（可选）"
              type="tel"
              maxlength="11"
              lazy-rules
              :rules="[
                (val) =>
                  !val || val.length === 0 || /^1[3-9]\d{9}$/.test(val) || '手机号格式不正确',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="phone" />
              </template>
            </q-input>

            <!-- 4. 邮箱（可选） -->
            <q-input
              v-model="email"
              outlined
              label="邮箱（可选）"
              type="email"
              lazy-rules
              :rules="[
                (val) =>
                  !val || val.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <!-- 5. 姓名（可选） -->
            <q-input v-model="realName" outlined label="姓名（可选）" lazy-rules>
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <!-- 6. 密码 -->
            <q-input
              v-model="password"
              outlined
              label="密码"
              :type="isPwd ? 'password' : 'text'"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入密码',
                (val) => val.length >= 6 || '密码长度至少6位',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
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
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="isConfirmPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isConfirmPwd = !isConfirmPwd"
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

            <!-- AI 验证码 -->
            <div class="captcha-wrapper q-mt-md" v-if="agreeTerms && !captchaVerified">
              <div class="text-caption text-grey-6 q-mb-sm text-center">请完成安全验证</div>
              <AliCaptcha
                instance-id="register"
                @success="onCaptchaSuccess"
                @fail="onCaptchaFail"
              />
            </div>
            <div v-if="captchaVerified" class="captcha-verified q-mt-md text-center">
              <q-icon name="verified" color="positive" size="20px" />
              <span class="q-ml-xs text-positive">验证已通过</span>
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
                :disabled="!agreeTerms || !captchaVerified || authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="text-caption text-orange text-center q-mt-xs">
                请先同意用户协议和隐私政策
              </div>
              <div v-else-if="!captchaVerified" class="text-caption text-orange text-center q-mt-xs">
                请完成安全验证
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="q-mb-sm">已有账户？</p>
          <q-btn flat no-caps color="primary" to="/login" label="立即登录" />
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { useQuasar } from 'quasar';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
import AliCaptcha from 'src/components/common/AliCaptcha.vue';
import { HOSPITALS, DEPARTMENTS, type Hospital, type Department } from 'src/constants/hospitals';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const hospital = ref<Hospital | null>(null);
const department = ref<Department | null>(null);
const entryYear = ref('');
const sequenceNumber = ref('');
const phone = ref('');
const email = ref('');
const realName = ref('');
const password = ref('');
const confirmPassword = ref('');
const isPwd = ref(true);
const isConfirmPwd = ref(true);

// 协议相关状态
const agreeTerms = ref(false);
const showAgreementDialog = ref(false);
const agreementTab = ref<'agreement' | 'privacy'>('agreement');

// 验证码相关状态
const captchaToken = ref('');
const captchaVerified = ref(false);

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

const onRegister = async () => {
  try {
    // 构建注册数据
    const userData: {
      password: string;
      hospital_id: string;
      employee_id: string;
      email?: string;
      real_name?: string;
      phone?: string;
    } = {
      password: password.value,
      hospital_id: hospital.value!.id,
      employee_id: `${department.value!.code}${entryYear.value}${sequenceNumber.value}`,
    };

    // 添加可选字段
    if (email.value) {
      userData.email = email.value;
    }
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
