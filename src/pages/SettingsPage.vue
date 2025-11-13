<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">系统设置</div>
        <p>管理您的账户和应用程序偏好设置。</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-md-8 col-xs-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">通知偏好设置</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-toggle
                v-model="notificationForm.emailNotifications"
                label="分析完成时的邮件通知"
                left-label
              />
              
              <q-toggle
                v-model="notificationForm.pushNotifications"
                label="紧急情况的推送通知"
                left-label
              />
              
              <q-toggle
                v-model="notificationForm.weeklyReports"
                label="周汇总报告"
                left-label
              />
              
              <div class="row q-mt-lg">
                <q-space />
                <q-btn color="primary" label="保存偏好设置" @click="saveNotifications" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-md-4 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-avatar size="100px" color="primary" text-color="white" class="q-mb-md">
              <template v-if="user?.avatar_url">
                <img :src="user.avatar_url" alt="用户头像">
              </template>
              <template v-else>
                <div class="text-h2">{{ userInitial }}</div>
              </template>
            </q-avatar>
            <div class="text-h6">{{ userName }}</div>
            <div class="text-subtitle2">{{ user?.email || user?.phone || '' }}</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <q-list>
              <q-item clickable v-ripple @click="showChangePasswordDialog = true">
                <q-item-section avatar>
                  <q-icon color="primary" name="lock" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>修改密码</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
              
              <q-item clickable v-ripple>
                <q-item-section avatar>
                  <q-icon color="secondary" name="notifications" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>通知设置</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
              
              <q-item clickable v-ripple @click="showPrivacyDialog = true">
                <q-item-section avatar>
                  <q-icon color="accent" name="security" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>隐私设置</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">应用信息</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="q-gutter-sm">
              <div><strong>版本:</strong> 1.0.0</div>
              <div><strong>AI模型:</strong> CervixDetectAI v2.1</div>
              <div><strong>发布日期:</strong> 2024年11月</div>
              <div><strong>许可证:</strong> 医疗使用</div>
            </div>
            
            <q-btn 
              label="检查更新" 
              color="primary" 
              class="full-width q-mt-md"
              flat
              @click="checkForUpdates"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <q-dialog v-model="showChangePasswordDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">修改密码</div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input
              v-model="passwordForm.currentPassword"
              type="password"
              label="当前密码"
              outlined
              dense
            />
            <q-input
              v-model="passwordForm.newPassword"
              type="password"
              label="新密码"
              outlined
              dense
            />
            <q-input
              v-model="passwordForm.confirmPassword"
              type="password"
              label="确认新密码"
              outlined
              dense
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="确认" color="primary" @click="changePassword" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 隐私设置对话框 -->
    <q-dialog v-model="showPrivacyDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">隐私设置</div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-toggle
              v-model="privacyForm.shareData"
              label="允许数据用于研究目的（匿名化）"
              left-label
            />
            <q-toggle
              v-model="privacyForm.allowAnalytics"
              label="允许使用分析数据改进服务"
              left-label
            />
            <q-toggle
              v-model="privacyForm.twoFactorAuth"
              label="启用双因素认证"
              left-label
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="savePrivacySettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/authStore'

const $q = useQuasar()
const authStore = useAuthStore()

// 获取当前用户
const user = computed(() => authStore.user)

// 用户名称
const userName = computed(() => {
  return user.value?.real_name || user.value?.username || '用户'
})

// 用户名称首字母（用于默认头像）
const userInitial = computed(() => {
  if (user.value?.real_name) {
    return user.value.real_name.charAt(0).toUpperCase()
  }
  if (user.value?.username) {
    return user.value.username.charAt(0).toUpperCase()
  }
  return 'U'
})

// Notification preferences
const notificationForm = ref({
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: false
});

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Privacy form
const privacyForm = ref({
  shareData: false,
  allowAnalytics: true,
  twoFactorAuth: false
});

// Dialog states
const showChangePasswordDialog = ref(false);
const showPrivacyDialog = ref(false);

// Save notification preferences
const saveNotifications = () => {
  $q.notify({
    type: 'positive',
    message: '通知偏好设置保存成功！',
    position: 'top'
  });
};

// Change password
const changePassword = () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    $q.notify({
      type: 'warning',
      message: '请填写所有密码字段',
      position: 'top'
    });
    return;
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    $q.notify({
      type: 'negative',
      message: '新密码和确认密码不匹配',
      position: 'top'
    });
    return;
  }
  
  // In a real app, this would call an API
  showChangePasswordDialog.value = false;
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  $q.notify({
    type: 'positive',
    message: '密码修改成功！',
    position: 'top'
  });
};

// Save privacy settings
const savePrivacySettings = () => {
  showPrivacyDialog.value = false;
  $q.notify({
    type: 'positive',
    message: '隐私设置保存成功！',
    position: 'top'
  });
};

// Check for updates
const checkForUpdates = () => {
  $q.notify({
    type: 'info',
    message: '正在检查更新...',
    position: 'top'
  });
  
  // Simulate update check
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: '您使用的已是最新版本！',
      position: 'top'
    });
  }, 1500);
};
</script>