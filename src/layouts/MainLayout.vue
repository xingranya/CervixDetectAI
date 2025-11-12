<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Top Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://placehold.co/60x60/1976D2/FFFFFF?text=CD" alt="CervixDetectAI Logo">
          </q-avatar>
          CervixDetectAI
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
            <q-badge color="red" text-color="white" floating>
              3
            </q-badge>
          </q-btn>

          <q-btn-dropdown
            stretch
            flat
            label="张医生"
          >
            <q-list style="min-width: 200px;">
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
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-2"
    >
      <q-list>
        <q-item-label header class="text-weight-bold">CervixDetectAI</q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
        
        <q-separator class="q-my-sm" />
        
        <q-item-label header class="text-weight-bold">分析功能</q-item-label>
        
        <EssentialLink
          v-for="link in analysisLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <!-- Main Content Area -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'
import EssentialLink from 'components/EssentialLink.vue'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const leftDrawerOpen = ref(true)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// Main navigation links
const essentialLinks = [
  {
    title: '仪表盘',
    caption: '首页',
    icon: 'dashboard',
    route: '/app'
  },
  {
    title: '病例管理',
    caption: '患者记录',
    icon: 'folder',
    route: '/app/studies'
  },
  {
    title: '上传分析',
    caption: '新分析',
    icon: 'upload',
    route: '/app/upload'
  },
  {
    title: '报告中心',
    caption: '分析报告',
    icon: 'description',
    route: '/app/reports'
  }
]

// Analysis-specific links
const analysisLinks = [
  {
    title: 'API设置',
    caption: '模型配置',
    icon: 'api',
    route: '/app/models'
  },
  {
    title: '系统设置',
    caption: '系统配置',
    icon: 'settings',
    route: '/app/settings'
  }
]

const goToProfile = () => {
  void router.push('/app/profile')
}

const goToSettings = () => {
  void router.push('/app/settings')
}

const showNotifications = () => {
  $q.notify({
    type: 'info',
    message: '您有3条新通知',
    position: 'top',
    actions: [
      { label: '查看全部', color: 'white', handler: () => { /* 导航到通知页面 */ } }
    ]
  })
}

const logout = () => {
  authStore.logout()
  void router.push('/login')
}
</script>

<style scoped>
/* Add any layout-specific styles here if needed */
</style>