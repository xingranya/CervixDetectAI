<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Top Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar size="40px">
            <img src="/logo.svg" alt="CervixDetectAI Logo" />
          </q-avatar>
          CervixDetectAI
          <template v-if="currentHospital">
            <span class="q-mx-sm text-grey-4">|</span>
            <q-avatar v-if="currentHospital.iconUrl" size="24px" class="q-mr-xs hospital-logo">
              <img :src="currentHospital.iconUrl" :alt="currentHospital.name" />
            </q-avatar>
            <q-icon v-else :name="currentHospital.icon" size="xs" class="q-mr-xs" />
            <span class="text-caption">{{ currentHospital.name }}</span>
          </template>
        </q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap">
          <!-- User Profile Dropdown -->
          <q-btn
            dense
            flat
            round
            size="md"
            icon="notifications"
            aria-label="Notifications"
            @click="showNotifications"
          >
            <q-badge color="red" text-color="white" floating> 3 </q-badge>
          </q-btn>

          <q-btn-dropdown stretch flat>
            <template v-slot:label>
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
            <q-list style="min-width: 200px">
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
        </div>
      </q-toolbar>
    </q-header>

    <!-- Left Sidebar Navigation -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-2" :width="200">
      <q-list>
        <q-item-label header class="text-weight-bold">CervixDetectAI</q-item-label>

        <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />

        <q-separator class="q-my-sm" />

        <q-item-label header class="text-weight-bold">分析功能</q-item-label>

        <EssentialLink v-for="link in analysisLinks" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <!-- Main Content Area -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useQuasar } from 'quasar';
import EssentialLink from 'components/EssentialLink.vue';
import { HOSPITALS } from 'src/constants/hospitals';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();
const leftDrawerOpen = ref(true);

// 用户名称
const userName = computed(() => {
  return authStore.user?.real_name || authStore.user?.username || '用户';
});

// 当前医院信息
const currentHospital = computed(() => {
  if (!authStore.user?.hospital_id) return null;
  return HOSPITALS.find(h => h.id === authStore.user?.hospital_id);
});

// 处理头像URL
const avatarUrl = computed(() => {
  if (!authStore.user?.avatar_url) return '';
  const url = authStore.user.avatar_url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (import.meta.env.DEV) {
    return `http://localhost:3000${url}`;
  }
  return url;
});

// 用户名称首字母（用于默认头像）
const userInitial = computed(() => {
  if (authStore.user?.real_name) {
    return authStore.user.real_name.charAt(0).toUpperCase();
  }
  if (authStore.user?.username) {
    return authStore.user.username.charAt(0).toUpperCase();
  }
  return 'U';
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

// Main navigation links
const essentialLinks = [
  {
    title: '仪表盘',
    caption: '首页',
    icon: 'dashboard',
    route: '/app',
  },
  {
    title: '数据报表',
    caption: '病例与报告',
    icon: 'analytics',
    route: '/app/studies',
  },
  {
    title: '患者管理',
    caption: '患者信息',
    icon: 'people',
    route: '/app/patients',
  },
  {
    title: '上传分析',
    caption: '新分析',
    icon: 'upload',
    route: '/app/upload',
  },
];

// Analysis-specific links
const analysisLinks = [
  {
    title: '订阅与AI设置',
    caption: '模型配置',
    icon: 'api',
    route: '/app/models',
  },
  {
    title: '系统设置',
    caption: '系统配置',
    icon: 'settings',
    route: '/app/settings',
  },
];

const goToProfile = () => {
  void router.push('/app/profile');
};

const goToSettings = () => {
  void router.push('/app/settings');
};

const showNotifications = () => {
  $q.notify({
    type: 'info',
    message: '您有3条新通知',
    position: 'top',
    actions: [
      {
        label: '查看全部',
        color: 'white',
        handler: () => {
          /* 导航到通知页面 */
        },
      },
    ],
  });
};

const logout = async () => {
  await authStore.logout();
  void router.push('/login');
};
</script>

<style scoped>
/* 侧边栏样式优化 */
:deep(.q-drawer) {
  max-width: 200px;
}
</style>
