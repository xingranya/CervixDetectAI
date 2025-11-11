<template>
  <q-page padding>
    <div class="row flex-center">
      <div class="text-center" style="width: 400px; max-width: 90vw;">
        <div class="text-h6">忘记密码</div>
        <p>输入您的邮箱以重置密码</p>
        
        <q-card class="q-mt-xl">
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input 
                outlined 
                label="邮箱" 
                v-model="email"
                type="email"
                lazy-rules
                :rules="[val => val && val.length > 0 || '邮箱为必填项']"
              />
              <q-btn 
                color="primary" 
                label="发送重置链接" 
                class="full-width" 
                @click="sendResetLink"
              />
            </q-form>
          </q-card-section>
        </q-card>
        
        <div class="q-mt-md">
          记起密码了？
          <q-btn flat no-caps color="primary" to="/login" label="登录" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');

const sendResetLink = () => {
  // In a real app, this would send a password reset email
  console.log('发送密码重置到:', email.value);
  alert(`密码重置链接将在实际应用中发送到 ${email.value}`);
};
</script>