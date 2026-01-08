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
            <q-input
              v-model="email"
              outlined
              label="邮箱"
              type="email"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || '请输入邮箱',
                (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确',
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

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

            <q-input v-model="realName" outlined label="姓名（可选）" lazy-rules>
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

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
                <span v-if="!authStore.isAuthenticating">注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
              <div v-if="!agreeTerms" class="text-caption text-orange text-center q-mt-xs">
                请先同意用户协议和隐私政策
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

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const realName = ref('');
const phone = ref('');
const isPwd = ref(true);
const isConfirmPwd = ref(true);

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

const onRegister = async () => {
  try {
    // 构建注册数据
    const userData: {
      email: string;
      password: string;
      real_name?: string;
      phone?: string;
    } = {
      email: email.value,
      password: password.value,
    };

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
