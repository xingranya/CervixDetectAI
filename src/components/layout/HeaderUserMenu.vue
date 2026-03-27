<template>
  <q-btn-dropdown stretch flat>
    <template #label>
      <div class="row items-center no-wrap">
        <q-avatar size="32px" color="primary" text-color="white" class="q-mr-sm">
          <template v-if="avatarUrl">
            <img :src="avatarUrl" alt="用户头像" />
          </template>
          <template v-else>
            {{ userInitial }}
          </template>
        </q-avatar>
        <div>{{ userName }}</div>
      </div>
    </template>
    <q-list class="user-menu-list">
      <q-item clickable v-ripple @click="goToProfile">
        <q-item-section avatar>
          <q-icon name="account_circle" />
        </q-item-section>
        <q-item-section>
          <q-item-label>个人资料</q-item-label>
          <q-item-label caption>查看个人资料</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="goToSettings">
        <q-item-section avatar>
          <q-icon name="settings" />
        </q-item-section>
        <q-item-section>
          <q-item-label>设置</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="goToPatientMiniProgramPreview">
        <q-item-section avatar>
          <q-icon name="phone_iphone" />
        </q-item-section>
        <q-item-section>
          <q-item-label>患者端微信小程序</q-item-label>
          <q-item-label caption>直接预览演示</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-ripple @click="logout">
        <q-item-section avatar>
          <q-icon name="logout" />
        </q-item-section>
        <q-item-section>
          <q-item-label>退出登录</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { getImageUrl } from 'src/utils/mappers';

const router = useRouter();
const authStore = useAuthStore();

const userName = computed(() => authStore.user?.real_name || authStore.user?.username || '用户');
const avatarUrl = computed(() => getImageUrl(authStore.user?.avatar_url) || '');
const userInitial = computed(() => {
  if (authStore.user?.real_name) {
    return authStore.user.real_name.charAt(0).toUpperCase();
  }
  if (authStore.user?.username) {
    return authStore.user.username.charAt(0).toUpperCase();
  }

  return 'U';
});

const goToProfile = () => {
  void router.push('/app/profile');
};

const goToSettings = () => {
  void router.push('/app/settings');
};

const goToPatientMiniProgramPreview = () => {
  void router.push({ name: 'patient-mini-program', params: { screen: 'home' } });
};

const logout = async () => {
  await authStore.logout();
  void router.push('/login');
};
</script>

<style scoped>
.user-menu-list {
  min-width: 200px;
}
</style>

