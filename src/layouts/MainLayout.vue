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
          <ThemeToggle />

          <!-- User Profile Dropdown -->
          <q-btn
            dense
            flat
            round
            size="md"
            icon="notifications"
            aria-label="Notifications"
            class="notification-trigger"
          >
            <q-badge v-if="unreadCount > 0" color="red" text-color="white" floating>
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </q-badge>
            <q-menu
              v-model="notificationMenuVisible"
              class="notification-menu"
              anchor="bottom right"
              self="top right"
              :offset="[0, 10]"
              :style="notificationMenuStyle"
              transition-show="jump-down"
              transition-hide="jump-up"
              @before-show="handleNotificationMenuShow"
            >
              <div class="notification-panel" :class="{ 'notification-panel--dark': isDark }">
                <div class="notification-panel-header">
                  <div>
                    <div class="notification-panel-title">站内通知</div>
                    <div class="notification-panel-subtitle">随访提醒与系统消息</div>
                  </div>
                  <q-btn
                    unelevated
                    dense
                    color="white"
                    text-color="primary"
                    label="全部已读"
                    class="notification-read-all-btn"
                    :disable="notificationLoading || unreadCount === 0"
                    @click.stop="markAllNotificationsAsRead"
                  />
                </div>

                <div v-if="notificationLoading" class="notification-loading q-pa-md">
                  <q-skeleton type="rect" height="64px" class="q-mb-sm notification-skeleton" />
                  <q-skeleton type="rect" height="64px" class="q-mb-sm notification-skeleton" />
                  <q-skeleton type="rect" height="64px" class="notification-skeleton" />
                </div>

                <div v-else-if="notifications.length > 0" class="notification-list">
                  <q-item
                    v-for="item in notifications"
                    :key="item.id"
                    clickable
                    class="notification-item"
                    :class="{
                      'notification-item--unread': !item.is_read,
                      'notification-item--dark': isDark,
                    }"
                    @click="handleNotificationClick(item)"
                  >
                    <q-item-section avatar>
                      <div
                        class="notification-type-icon"
                        :class="`notification-type-icon--${getNotificationStyle(item.type).tone}`"
                      >
                        <q-icon :name="getNotificationIcon(item.type)" size="18px" />
                      </div>
                    </q-item-section>
                    <q-item-section>
                      <div class="notification-item-title-row">
                        <q-item-label class="notification-item-title">
                          {{ item.title }}
                        </q-item-label>
                        <q-badge
                          :label="getNotificationStyle(item.type).label"
                          rounded
                          class="notification-type-badge"
                          :class="`notification-type-badge--${getNotificationStyle(item.type).tone}`"
                        />
                      </div>
                      <q-item-label caption class="ellipsis-2-lines notification-item-content">
                        {{ item.content }}
                      </q-item-label>
                      <div class="notification-item-meta">
                        <span>{{ formatNotificationTime(item.created_at) }}</span>
                        <span v-if="!item.is_read" class="notification-unread-dot">未读</span>
                      </div>
                    </q-item-section>
                    <q-item-section side top>
                      <q-btn
                        v-if="!item.is_read"
                        flat
                        dense
                        round
                        icon="done"
                        color="primary"
                        @click.stop="markNotificationAsRead(item.id)"
                      >
                        <q-tooltip>标记已读</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </div>

                <div v-else class="notification-empty">
                  <q-icon name="notifications_none" size="42px" color="grey-5" />
                  <div class="notification-empty-title">当前没有新通知</div>
                  <div class="notification-empty-subtitle">有新的随访提醒时，会第一时间显示在这里</div>
                </div>

                <div class="notification-panel-footer">
                  <q-btn
                    flat
                    no-caps
                    icon="open_in_new"
                    label="前往随访管理"
                    color="primary"
                    class="notification-jump-btn"
                    @click.stop="goToFollowUps"
                  />
                </div>
              </div>
            </q-menu>
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

    <!-- Footer -->
    <AppFooter />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useQuasar } from 'quasar';
import { getImageUrl } from 'src/utils/mappers';
import EssentialLink from 'components/EssentialLink.vue';
import AppFooter from 'components/AppFooter.vue';
import ThemeToggle from 'src/components/common/ThemeToggle.vue';
import { HOSPITALS } from 'src/constants/hospitals';
import { notificationAPI, type NotificationItem, type NotificationType } from 'src/services/api';

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
  return HOSPITALS.find((h) => h.id === authStore.user?.hospital_id);
});

// 处理头像URL
const avatarUrl = computed(() => {
  return getImageUrl(authStore.user?.avatar_url) || '';
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
    title: '随访管理',
    caption: '复查计划',
    icon: 'event_note',
    route: '/app/follow-ups',
  },
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

const notificationMenuVisible = ref(false);
const notificationLoading = ref(false);
const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);

const formatNotificationTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

const getNotificationIcon = (type: NotificationType) => {
  if (type === 'followup_overdue') return 'warning';
  if (type === 'followup_high_attention') return 'priority_high';
  if (type === 'followup_due') return 'event_available';
  return 'notifications';
};

const getNotificationStyle = (type: NotificationType): { tone: string; label: string } => {
  if (type === 'followup_overdue') return { tone: 'danger', label: '已逾期' };
  if (type === 'followup_high_attention') return { tone: 'warning', label: '高关注' };
  if (type === 'followup_due') return { tone: 'info', label: '即将到期' };
  return { tone: 'neutral', label: '系统' };
};

const isDark = computed(() => $q.dark.isActive);
const notificationMenuStyle = computed(() => {
  if ($q.screen.lt.sm) {
    return 'width: calc(100vw - 24px); max-width: calc(100vw - 24px);';
  }
  return 'width: 420px; max-width: calc(100vw - 24px);';
});

const refreshUnreadCount = async () => {
  try {
    const response = await notificationAPI.getUnreadCount();
    unreadCount.value = response.data.unreadCount;
  } catch (error) {
    console.error('获取未读通知失败:', error);
  }
};

const loadNotifications = async () => {
  notificationLoading.value = true;
  try {
    const response = await notificationAPI.getNotifications({ page: 1, limit: 8 });
    notifications.value = response.data.notifications;
  } catch (error) {
    console.error('加载通知列表失败:', error);
    $q.notify({
      type: 'negative',
      message: '加载通知列表失败',
      position: 'top',
    });
  } finally {
    notificationLoading.value = false;
  }
};

const handleNotificationMenuShow = async () => {
  await Promise.all([loadNotifications(), refreshUnreadCount()]);
};

const handleNotificationUpdated = () => {
  void refreshUnreadCount();
  if (notificationMenuVisible.value) {
    void loadNotifications();
  }
};

const markNotificationAsRead = async (id: number) => {
  try {
    await notificationAPI.markAsRead(id);
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
    );
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (error) {
    console.error('标记通知已读失败:', error);
  }
};

const markAllNotificationsAsRead = async () => {
  try {
    await notificationAPI.markAllAsRead();
    notifications.value = notifications.value.map((item) => ({
      ...item,
      is_read: true,
      read_at: item.read_at || new Date().toISOString(),
    }));
    unreadCount.value = 0;
  } catch (error) {
    console.error('全部标记已读失败:', error);
  }
};

const handleNotificationClick = async (item: NotificationItem) => {
  if (!item.is_read) {
    await markNotificationAsRead(item.id);
  }

  notificationMenuVisible.value = false;

  if (item.type === 'followup_overdue') {
    void router.push({ path: '/app/follow-ups', query: { status: 'overdue' } });
    return;
  }
  if (item.type === 'followup_high_attention') {
    void router.push({ path: '/app/follow-ups', query: { high_attention: 'true' } });
    return;
  }
  if (item.type === 'followup_due') {
    void router.push({ path: '/app/follow-ups', query: { status: 'pending' } });
  }
};

const goToFollowUps = () => {
  notificationMenuVisible.value = false;
  void router.push('/app/follow-ups');
};

const goToProfile = () => {
  void router.push('/app/profile');
};

const goToSettings = () => {
  void router.push('/app/settings');
};

const logout = async () => {
  await authStore.logout();
  void router.push('/login');
};

onMounted(() => {
  void refreshUnreadCount();
  window.addEventListener('notification-updated', handleNotificationUpdated);
});

onUnmounted(() => {
  window.removeEventListener('notification-updated', handleNotificationUpdated);
});
</script>

<style scoped>
/* 侧边栏样式优化 */
:deep(.q-drawer) {
  max-width: 200px;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-trigger {
  transition: background-color 0.2s ease;
}

.notification-trigger:hover {
  background: rgba(255, 255, 255, 0.12);
}

:deep(.q-menu.notification-menu) {
  border-radius: var(--app-radius-xl) !important;
  overflow: hidden !important;
  background: transparent;
}

.notification-panel {
  background: var(--app-glass-bg);
  border: 1px solid var(--app-glass-border);
  border-radius: var(--app-radius-xl);
  overflow: hidden;
  box-shadow: var(--app-shadow-lg);
  backdrop-filter: blur(var(--app-glass-blur-lg));
  -webkit-backdrop-filter: blur(var(--app-glass-blur-lg));
}

.notification-panel--dark {
  background: var(--app-glass-bg);
  border-color: var(--app-glass-border);
}

.notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--app-radius-xl) var(--app-radius-xl) 0 0;
  color: #ffffff;
  background: #1976d2;
}

.notification-panel-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.notification-panel-subtitle {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.9;
}

.notification-read-all-btn {
  min-width: 84px;
  border-radius: var(--app-radius-md);
  font-weight: 600;
}

.notification-loading {
  border-bottom: 1px solid #eef3fb;
}

.notification-skeleton {
  border-radius: var(--app-radius-md);
}

.notification-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;
}

.notification-item {
  margin-bottom: 8px;
  border-radius: var(--app-radius-md);
  border: 1px solid #e9eff8;
  background: #f9fbff;
  transition: all 0.2s ease;
}

.notification-item:last-child {
  margin-bottom: 0;
}

.notification-item:hover {
  border-color: #bfd6f3;
  background: #f1f7ff;
  transform: translateY(-1px);
}

.notification-item--unread {
  border-color: #b8d7f8;
  background: #eef6ff;
}

.notification-item--dark {
  border-color: #33445b;
  background: #273345;
}

.notification-item--dark:hover {
  border-color: #4f6690;
  background: #2e3c52;
}

.notification-item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notification-item-title {
  font-size: 14px;
  color: #1f2d3d;
  font-weight: 600;
  line-height: 1.3;
}

.notification-panel--dark .notification-item-title {
  color: #eef3ff;
}

.notification-item-content {
  margin-top: 4px;
  color: #526074;
}

.notification-panel--dark .notification-item-content {
  color: #b2c1d6;
}

.notification-item-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #7a869a;
}

.notification-panel--dark .notification-item-meta {
  color: #9fb0c9;
}

.notification-unread-dot {
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
  color: #1e72c5;
  background: #d9ebff;
}

.notification-panel--dark .notification-unread-dot {
  color: #9fc6f8;
  background: rgba(73, 131, 197, 0.22);
}

.notification-type-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--app-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-type-icon--danger {
  color: #c62828;
  background: #ffebee;
}

.notification-type-icon--warning {
  color: #ef6c00;
  background: #fff3e0;
}

.notification-type-icon--info {
  color: #1565c0;
  background: #e3f2fd;
}

.notification-type-icon--neutral {
  color: #616161;
  background: #f5f5f5;
}

.notification-panel--dark .notification-type-icon--danger {
  color: #ffcdd2;
  background: rgba(198, 40, 40, 0.25);
}

.notification-panel--dark .notification-type-icon--warning {
  color: #ffd7a5;
  background: rgba(239, 108, 0, 0.25);
}

.notification-panel--dark .notification-type-icon--info {
  color: #b7d4ff;
  background: rgba(21, 101, 192, 0.25);
}

.notification-panel--dark .notification-type-icon--neutral {
  color: #d3d8e1;
  background: rgba(145, 150, 160, 0.25);
}

.notification-type-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.notification-type-badge--danger {
  color: #b71c1c;
  background: #ffdde1;
}

.notification-type-badge--warning {
  color: #e65100;
  background: #ffe7cc;
}

.notification-type-badge--info {
  color: #0d47a1;
  background: #dbefff;
}

.notification-type-badge--neutral {
  color: #455a64;
  background: #eceff1;
}

.notification-panel--dark .notification-type-badge--danger {
  color: #ffd9dd;
  background: rgba(183, 28, 28, 0.4);
}

.notification-panel--dark .notification-type-badge--warning {
  color: #ffe1c0;
  background: rgba(230, 81, 0, 0.4);
}

.notification-panel--dark .notification-type-badge--info {
  color: #d4e5ff;
  background: rgba(13, 71, 161, 0.45);
}

.notification-panel--dark .notification-type-badge--neutral {
  color: #d7dce4;
  background: rgba(69, 90, 100, 0.45);
}

.notification-empty {
  padding: 28px 16px 24px;
  text-align: center;
  border-bottom: 1px solid #eef3fb;
}

.notification-empty-title {
  margin-top: 10px;
  color: #36495e;
  font-size: 14px;
  font-weight: 600;
}

.notification-empty-subtitle {
  margin-top: 6px;
  color: #7a8798;
  font-size: 12px;
}

.notification-panel--dark .notification-empty {
  border-bottom-color: #32425b;
}

.notification-panel--dark .notification-empty-title {
  color: #e4ecf8;
}

.notification-panel--dark .notification-empty-subtitle {
  color: #9fb0c9;
}

.notification-panel-footer {
  padding: 8px 12px 12px;
  display: flex;
  justify-content: flex-end;
}

.notification-jump-btn {
  border-radius: var(--app-radius-md);
}

.user-menu-list {
  min-width: 200px;
}
</style>

<style>
/* 修正通知弹层最外壳：去掉默认方形白底与阴影，保持与内部圆角一致 */
.q-menu.notification-menu {
  border-radius: var(--app-radius-xl) !important;
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
</style>
