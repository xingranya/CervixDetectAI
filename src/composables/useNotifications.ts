import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { notificationAPI, type NotificationItem, type NotificationType } from 'src/services/api';

interface NotificationStyleMeta {
  tone: 'danger' | 'warning' | 'info' | 'neutral';
  label: string;
  icon: string;
}

export function getNotificationStyle(type: NotificationType): NotificationStyleMeta {
  if (type === 'followup_overdue') {
    return { tone: 'danger', label: '已逾期', icon: 'warning' };
  }
  if (type === 'followup_high_attention') {
    return { tone: 'warning', label: '高关注', icon: 'priority_high' };
  }
  if (type === 'followup_due') {
    return { tone: 'info', label: '即将到期', icon: 'event_available' };
  }

  return { tone: 'neutral', label: '系统', icon: 'notifications' };
}

/**
 * 统一管理站内通知的读取、已读与跳转逻辑。
 */
export function useNotifications() {
  const router = useRouter();
  const $q = useQuasar();

  const notificationMenuVisible = ref(false);
  const notificationLoading = ref(false);
  const notifications = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);

  const notificationMenuStyle = computed(() => {
    if ($q.screen.lt.sm) {
      return 'width: calc(100vw - 24px); max-width: calc(100vw - 24px);';
    }

    return 'width: 420px; max-width: calc(100vw - 24px);';
  });

  const isDark = computed(() => $q.dark.isActive);

  const formatNotificationTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

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

    if (item.related_type === 'study' && item.related_id) {
      void router.push(`/app/studies/${item.related_id}`);
      return;
    }

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

  onMounted(() => {
    void refreshUnreadCount();
    window.addEventListener('notification-updated', handleNotificationUpdated);
  });

  onUnmounted(() => {
    window.removeEventListener('notification-updated', handleNotificationUpdated);
  });

  return {
    formatNotificationTime,
    getNotificationStyle,
    goToFollowUps,
    handleNotificationClick,
    handleNotificationMenuShow,
    isDark,
    loadNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    notificationLoading,
    notificationMenuStyle,
    notificationMenuVisible,
    notifications,
    refreshUnreadCount,
    unreadCount,
  };
}
