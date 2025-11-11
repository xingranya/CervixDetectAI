<template>
  <q-page padding>
    <div class="row flex-center">
      <div class="text-center">
        <div class="text-h6">注册</div>
        <p>创建账户以访问CervixDetectAI</p>
        
        <!-- Registration form would go here -->
        <q-card style="width: 400px; max-width: 90vw;" class="q-mt-xl">
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input 
                outlined 
                label="姓名" 
                v-model="name"
              />
              <q-input 
                outlined 
                label="邮箱" 
                v-model="email"
                type="email"
              />
              <q-input 
                outlined 
                label="密码" 
                v-model="password"
                :type="isPwd ? 'password' : 'text'"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </q-input>
              <q-input 
                outlined 
                label="机构" 
                v-model="institution"
              />
              <q-btn 
                color="primary" 
                label="注册" 
                class="full-width" 
                @click="register"
              />
            </q-form>
          </q-card-section>
        </q-card>
        
        <div class="q-mt-md">
          已有账户？
          <q-btn flat no-caps color="primary" to="/login" label="登录" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const password = ref('');
const institution = ref('');
const isPwd = ref(true);

const register = () => {
  // In a real app, this would register the user
  console.log('注册用户:', { name: name.value, email: email.value, institution: institution.value });
  alert('注册功能将在实际应用中实现');
};
</script>