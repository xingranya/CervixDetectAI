<template>
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
            <div class="notification-panel-subtitle">随访提醒、分析结果与系统消息</div>
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
                <q-icon :name="getNotificationStyle(item.type).icon" size="18px" />
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
</template>

<script setup lang="ts">
import { useNotifications } from 'src/composables/useNotifications';

const {
  formatNotificationTime,
  getNotificationStyle,
  goToFollowUps,
  handleNotificationClick,
  handleNotificationMenuShow,
  isDark,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationLoading,
  notificationMenuStyle,
  notificationMenuVisible,
  notifications,
  unreadCount,
} = useNotifications();
</script>

<style scoped>
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
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-lg));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-lg));
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
</style>

<style>
.q-menu.notification-menu {
  border-radius: var(--app-radius-xl) !important;
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
</style>
