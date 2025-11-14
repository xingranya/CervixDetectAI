<template>
  <q-page class="flex flex-center bg-grey-2">
    <div class="q-pa-md" style="width: 400px; max-width: 400px">
      <div class="text-center q-mb-xl">
        <div class="flex flex-center q-mb-sm">
          <img src="/logo.svg" alt="CervixDetectAI" style="width: 80px; height: 80px;" />
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

            <div class="q-mt-xl">
              <q-btn
                color="primary"
                :loading="authStore.isAuthenticating"
                unelevated
                rounded
                size="lg"
                style="width: 100%"
                type="submit"
                :disabled="authStore.isAuthenticating"
              >
                <span v-if="!authStore.isAuthenticating">注册</span>
                <q-spinner-hourglass v-else />
              </q-btn>
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="q-mb-sm">已有账户？</p>
          <q-btn flat no-caps color="primary" to="/login" label="立即登录" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { useQuasar } from 'quasar';

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
