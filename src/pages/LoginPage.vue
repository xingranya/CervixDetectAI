<template>
  <q-page class="flex flex-center bg-grey-2">
    <div class="q-pa-md" style="width: 400px; max-width: 400px;">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">CervixDetectAI</div>
        <div class="text-subtitle1 text-grey">AI驱动的宫颈癌筛查系统</div>
      </div>

      <q-card flat bordered>
        <q-card-section class="text-center bg-primary text-white">
          <div class="text-h5">欢迎回来</div>
          <div class="text-subtitle2">登录您的账户</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="email"
              outlined
              label="邮箱"
              type="email"
              lazy-rules
              :rules="[val => val && val.length > 0 || '请输入您的邮箱']"
            />

            <q-input
              v-model="password"
              outlined
              label="密码"
              :type="isPwd ? 'password' : 'text'"
              lazy-rules
              :rules="[val => val && val.length > 0 || '请输入您的密码']"
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
                <span v-if="!authStore.isAuthenticating">登录</span>
                <q-spinner-hourglass v-else />
              </q-btn>
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="q-mb-sm">还没有账户？</p>
          <q-btn flat no-caps color="primary" to="/register" label="立即注册" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('doctor@example.com'); // Demo credential
const password = ref('password123'); // Demo credential
const isPwd = ref(true);
const rememberMe = ref(true);

const onSubmit = async () => {
  try {
    const result = await authStore.login(email.value, password.value);
    
    if (result.success) {
      // Redirect to dashboard after successful login
      const redirectPath = router.currentRoute.value.query.redirect as string || '/app';
      void router.push(redirectPath);
    } else {
      // Handle login error
      alert(result.error || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('登录过程中发生错误');
  }
};
</script>