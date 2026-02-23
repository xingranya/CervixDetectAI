<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="text-h4 text-weight-bold q-mb-xs">个人资料</div>
        <p class="text-grey-7 text-body1">管理您的个人信息和偏好设置</p>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- 左侧：用户信息卡片 -->
      <div class="col-lg-4 col-md-5 col-xs-12">
        <!-- 用户头像卡片 -->
        <q-card flat class="profile-card q-mb-lg">
          <q-card-section class="text-center q-pa-xl">
            <q-avatar
              size="120px"
              class="q-mb-lg avatar-wrapper"
              color="primary"
              text-color="white"
            >
              <template v-if="avatarUrl">
                <img :src="avatarUrl" alt="用户头像" />
              </template>
              <template v-else>
                <div class="text-h3">{{ userInitial }}</div>
              </template>
            </q-avatar>

            <div class="text-h5 text-weight-bold q-mb-sm">
              {{ user?.real_name || user?.username || '用户' }}
            </div>

            <q-badge
              :color="
                user?.role === 'admin' ? 'red' : user?.role === 'doctor' ? 'primary' : 'grey-6'
              "
              class="q-pa-sm"
              rounded
            >
              {{
                user?.role === 'doctor' ? '医生' : user?.role === 'admin' ? '管理员' : '普通用户'
              }}
            </q-badge>

            <div class="q-mt-lg">
              <q-btn
                label="更改头像"
                color="primary"
                outline
                rounded
                size="sm"
                icon="photo_camera"
                @click="changeAvatar"
                class="q-px-md"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- 账户信息卡片 -->
        <q-card flat class="profile-card q-mb-lg">
          <q-card-section class="q-pa-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-md">账户信息</div>

            <div class="info-item" v-if="currentHospital">
              <div class="info-icon bg-blue-1">
                <q-icon :name="currentHospital.icon" color="primary" size="sm" />
              </div>
              <div class="info-content">
                <div class="info-label">所属医院</div>
                <div class="info-value">{{ currentHospital.name }}</div>
              </div>
            </div>

            <div class="info-item" v-if="user?.employee_id">
              <div class="info-icon bg-purple-1">
                <q-icon name="badge" color="purple" size="sm" />
              </div>
              <div class="info-content">
                <div class="info-label">工号</div>
                <div class="info-value">{{ user.employee_id }}</div>
              </div>
            </div>

            <div class="info-item" v-if="currentDepartment">
              <div class="info-icon bg-teal-1">
                <q-icon name="medical_services" color="teal" size="sm" />
              </div>
              <div class="info-content">
                <div class="info-label">科室</div>
                <div class="info-value">{{ currentDepartment.name }}</div>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon bg-orange-1">
                <q-icon name="event" color="orange" size="sm" />
              </div>
              <div class="info-content">
                <div class="info-label">注册日期</div>
                <div class="info-value">{{ formattedRegisterDate }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 统计信息卡片 -->
        <q-card flat class="profile-card">
          <q-card-section class="q-pa-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-lg">活动统计</div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="stat-box bg-blue-1">
                  <div class="stat-value text-primary">{{ profileData.stats.totalCases }}</div>
                  <div class="stat-label">总病例</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stat-box bg-green-1">
                  <div class="stat-value text-green">{{ profileData.stats.thisMonth }}</div>
                  <div class="stat-label">本月病例</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 右侧：表单卡片 -->
      <div class="col-lg-8 col-md-7 col-xs-12">
        <!-- 编辑资料卡片 -->
        <q-card flat class="profile-card q-mb-lg">
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-mb-lg">
              <q-icon name="edit" size="sm" color="primary" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">编辑资料</div>
            </div>

            <q-form class="form-container" @submit.prevent="saveProfile">
              <!-- 基本信息区块 -->
              <div class="form-section">
                <div class="form-section-title">基本信息</div>
                <q-input
                  v-model="profileData.firstName"
                  outlined
                  label="姓名"
                  placeholder="请输入您的真实姓名"
                  class="form-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="person" color="grey-6" />
                  </template>
                </q-input>
              </div>

              <!-- 联系方式区块 -->
              <div class="form-section">
                <div class="form-section-title">联系方式</div>
                <div class="row q-col-gutter-lg">
                  <div class="col-md-6 col-12">
                    <q-field
                      outlined
                      label="邮箱（在下方邮箱安全模块更换）"
                      stack-label
                      class="form-input readonly-field"
                    >
                      <template v-slot:prepend>
                        <q-icon name="email" color="grey-6" />
                      </template>
                      <template v-slot:control>
                        <div class="self-center full-width q-pl-xs">
                          {{ profileData.email || '-' }}
                        </div>
                      </template>
                    </q-field>
                  </div>
                  <div class="col-md-6 col-12">
                    <q-input
                      v-model="profileData.phone"
                      outlined
                      label="手机号"
                      type="tel"
                      placeholder="请输入手机号码"
                      class="form-input"
                      maxlength="11"
                      :rules="[(val) => !val || /^1[3-9]\d{9}$/.test(val) || '手机号格式不正确']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" color="grey-6" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>

              <!-- 工作信息区块 -->
              <div class="form-section" v-if="currentHospital || user?.employee_id">
                <div class="form-section-title">工作信息</div>

                <q-field
                  v-if="currentHospital"
                  outlined
                  label="所属医院"
                  stack-label
                  class="form-input readonly-field"
                >
                  <template v-slot:prepend>
                    <q-icon :name="currentHospital.icon" color="primary" />
                  </template>
                  <template v-slot:control>
                    <div class="self-center full-width q-pl-xs">
                      {{ currentHospital.name }}
                    </div>
                  </template>
                  <template v-slot:append>
                    <q-icon name="lock" color="grey-4" size="xs" />
                  </template>
                </q-field>

                <div class="row q-col-gutter-lg" v-if="user?.employee_id">
                  <div class="col-md-6 col-12">
                    <q-field outlined label="工号" stack-label class="form-input readonly-field">
                      <template v-slot:prepend>
                        <q-icon name="badge" color="purple" />
                      </template>
                      <template v-slot:control>
                        <div class="self-center full-width q-pl-xs">
                          {{ user.employee_id }}
                        </div>
                      </template>
                      <template v-slot:append>
                        <q-icon name="lock" color="grey-4" size="xs" />
                      </template>
                    </q-field>
                  </div>
                  <div class="col-md-6 col-12">
                    <q-field
                      v-if="currentDepartment"
                      outlined
                      label="科室"
                      stack-label
                      class="form-input readonly-field"
                    >
                      <template v-slot:prepend>
                        <q-icon name="medical_services" color="teal" />
                      </template>
                      <template v-slot:control>
                        <div class="self-center full-width q-pl-xs">
                          {{ currentDepartment.name }}
                        </div>
                      </template>
                      <template v-slot:append>
                        <q-icon name="lock" color="grey-4" size="xs" />
                      </template>
                    </q-field>
                  </div>
                </div>
              </div>

              <!-- 职业信息区块 -->
              <div class="form-section">
                <div class="form-section-title">职业信息</div>
                <div class="row q-col-gutter-lg">
                  <div class="col-md-6 col-12">
                    <q-input
                      v-model="profileData.position"
                      outlined
                      label="职称"
                      placeholder="如：主任医师、副主任医师"
                      class="form-input"
                    >
                      <template v-slot:prepend>
                        <q-icon name="workspace_premium" color="grey-6" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-md-6 col-12">
                    <q-input
                      v-model="profileData.title"
                      outlined
                      label="职务"
                      placeholder="如：科室主任、副主任"
                      class="form-input"
                    >
                      <template v-slot:prepend>
                        <q-icon name="work" color="grey-6" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="row q-mt-xl q-pt-lg form-actions">
                <q-space />
                <q-btn
                  color="grey-6"
                  label="重置"
                  flat
                  rounded
                  @click="resetForm"
                  class="q-mr-md q-px-lg"
                  :disable="loading"
                  icon="refresh"
                />
                <q-btn
                  color="primary"
                  label="保存更改"
                  rounded
                  unelevated
                  type="submit"
                  :loading="loading"
                  class="q-px-xl"
                  icon-right="check"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <EmailSecurityCard
          class="q-mb-lg"
          :current-email="profileData.email"
          :disabled="loading"
          @email-updated="handleEmailUpdated"
        />

        <!-- 安全设置卡片 -->
        <q-card flat class="profile-card">
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-mb-md">
              <q-icon name="security" size="sm" color="orange" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">安全设置</div>
            </div>

            <q-list class="security-list">
              <q-item clickable v-ripple @click="showChangePassword" class="security-item">
                <q-item-section avatar>
                  <div class="security-icon bg-orange-1">
                    <q-icon name="lock" color="orange" size="sm" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">修改密码</q-item-label>
                  <q-item-label caption class="text-grey-6"
                    >定期更换密码以保护账户安全</q-item-label
                  >
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey-5" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <q-dialog v-model="passwordDialog" persistent>
      <q-card style="min-width: 420px" class="password-dialog">
        <q-card-section class="row items-center q-pb-none q-pt-lg q-px-lg">
          <div class="text-h6 text-weight-bold">修改密码</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <q-form @submit.prevent="changePassword" class="q-gutter-lg">
            <q-input
              v-model="passwordForm.currentPassword"
              outlined
              label="当前密码"
              :type="showCurrentPwd ? 'text' : 'password'"
              :rules="[(val) => !!val || '请输入当前密码']"
              class="form-input"
            >
              <template v-slot:append>
                <q-icon
                  :name="showCurrentPwd ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showCurrentPwd = !showCurrentPwd"
                />
              </template>
            </q-input>

            <q-input
              v-model="passwordForm.newPassword"
              outlined
              label="新密码"
              :type="showNewPwd ? 'text' : 'password'"
              :rules="[
                (val) => !!val || '请输入新密码',
                (val) => val.length >= 6 || '密码长度至少6位',
              ]"
              class="form-input"
            >
              <template v-slot:append>
                <q-icon
                  :name="showNewPwd ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showNewPwd = !showNewPwd"
                />
              </template>
            </q-input>

            <q-input
              v-model="passwordForm.confirmPassword"
              outlined
              label="确认新密码"
              :type="showConfirmPwd ? 'text' : 'password'"
              :rules="[
                (val) => !!val || '请确认新密码',
                (val) => val === passwordForm.newPassword || '两次输入的密码不一致',
              ]"
              class="form-input"
            >
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPwd ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showConfirmPwd = !showConfirmPwd"
                />
              </template>
            </q-input>

            <div class="row justify-end q-mt-lg q-pt-md">
              <q-btn
                label="取消"
                flat
                color="grey-7"
                v-close-popup
                class="q-mr-md q-px-lg"
                rounded
              />
              <q-btn
                label="确认修改"
                color="primary"
                type="submit"
                :loading="passwordLoading"
                rounded
                unelevated
                class="q-px-lg"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/authStore';
import { userAPI } from 'src/services/api';
import { HOSPITALS, DEPARTMENTS } from 'src/constants/hospitals';
import { setItem, STORAGE_KEYS } from 'src/utils/storage';
import { getImageUrl } from 'src/utils/mappers';
import EmailSecurityCard from 'src/components/settings/EmailSecurityCard.vue';

const $q = useQuasar();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

const currentHospital = computed(() => {
  if (!user.value?.hospital_id) return null;
  return HOSPITALS.find((h) => h.id === user.value?.hospital_id);
});

const currentDepartment = computed(() => {
  if (!user.value?.employee_id) return null;
  const deptCode = user.value.employee_id.substring(0, 2);
  return DEPARTMENTS.find((d) => d.code === deptCode);
});

const formattedRegisterDate = computed(() => {
  if (!profileData.value.registeredDate) return '-';
  return new Date(profileData.value.registeredDate).toLocaleDateString('zh-CN');
});

const avatarUrl = computed(() => {
  return getImageUrl(user.value?.avatar_url) || '';
});

const userInitial = computed(() => {
  if (user.value?.real_name) {
    return user.value.real_name.charAt(0).toUpperCase();
  }
  if (user.value?.username) {
    return user.value.username.charAt(0).toUpperCase();
  }
  return 'U';
});

const profileData = ref({
  firstName: '',
  email: '',
  phone: '',
  position: '',
  title: '',
  registeredDate: '',
  stats: {
    totalCases: 0,
    thisMonth: 0,
  },
});
const loading = ref(false);

const passwordDialog = ref(false);
const passwordLoading = ref(false);
const showCurrentPwd = ref(false);
const showNewPwd = ref(false);
const showConfirmPwd = ref(false);
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

onMounted(async () => {
  if (!authStore.hasInitialized) {
    authStore.initializeAuth();
  }
  await loadUserData();
});

const loadUserData = async () => {
  try {
    await authStore.fetchCurrentUser();
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }

  if (user.value) {
    profileData.value.email = user.value.email || '';
    profileData.value.phone = user.value.phone || '';
    profileData.value.firstName = user.value.real_name || '';
    profileData.value.registeredDate = user.value.last_login_at || new Date().toISOString();
  }
};

const saveProfile = async () => {
  loading.value = true;
  try {
    const updateData: { real_name?: string; phone?: string } = {
      real_name: profileData.value.firstName.trim(),
      phone: profileData.value.phone.trim(),
    };

    const response = await userAPI.updateProfile(updateData);

    if (response.success) {
      const mergedUser = {
        ...(authStore.user || {}),
        ...response.data.user,
      };
      authStore.user = mergedUser;
      setItem(STORAGE_KEYS.USER_INFO, mergedUser);
      profileData.value.email = mergedUser.email || '';
      profileData.value.phone = mergedUser.phone || '';
      profileData.value.firstName = mergedUser.real_name || '';

      $q.notify({
        type: 'positive',
        message: '个人资料保存成功！',
        position: 'top',
      });
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || '保存失败',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const handleEmailUpdated = (payload: { email: string }) => {
  profileData.value.email = payload.email;
  if (authStore.user) {
    const mergedUser = {
      ...authStore.user,
      email: payload.email,
    };
    authStore.user = mergedUser;
    setItem(STORAGE_KEYS.USER_INFO, mergedUser);
  }
};

const resetForm = async () => {
  await loadUserData();
  $q.notify({
    type: 'info',
    message: '已恢复原始数据',
    position: 'top',
  });
};

const changeAvatar = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/gif,image/webp';
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };
  input.click();
};

const uploadAvatar = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    $q.notify({
      type: 'negative',
      message: '图片大小不能超过 5MB',
      position: 'top',
    });
    return;
  }

  loading.value = true;
  try {
    const response = await userAPI.uploadAvatar(file);
    if (response.success) {
      await authStore.fetchCurrentUser();
      $q.notify({
        type: 'positive',
        message: '头像上传成功！',
        position: 'top',
      });
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || '头像上传失败',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const showChangePassword = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  showCurrentPwd.value = false;
  showNewPwd.value = false;
  showConfirmPwd.value = false;
  passwordDialog.value = true;
};

const changePassword = async () => {
  passwordLoading.value = true;
  try {
    const response = await userAPI.updatePassword({
      current_password: passwordForm.value.currentPassword,
      new_password: passwordForm.value.newPassword,
    });

    if (response.success) {
      passwordDialog.value = false;
      $q.notify({
        type: 'positive',
        message: '密码修改成功！',
        position: 'top',
      });
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || '密码修改失败',
      position: 'top',
    });
  } finally {
    passwordLoading.value = false;
  }
};

</script>

<style scoped>
/* 卡片基础样式 */
.profile-card {
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  background: white;
}

/* 头像样式 */
.avatar-wrapper {
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.25);
}

.avatar-wrapper img {
  object-fit: cover;
}

/* 信息项样式 */
.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #9e9e9e;
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 统计盒子样式 */
.stat-box {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #757575;
  margin-top: 8px;
}

/* 表单容器 */
.form-container {
  max-width: 100%;
}

/* 表单区块 */
.form-section {
  margin-bottom: 16px;
}

.form-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 表单输入框 */
.form-input {
  margin-bottom: 16px;
}

.form-input :deep(.q-field__control) {
  border-radius: 10px;
  min-height: 48px;
}

.form-input :deep(.q-field__native) {
  padding-top: 12px;
  padding-bottom: 12px;
}

/* 只读字段样式 */
.readonly-field :deep(.q-field__control) {
  background-color: #fafafa;
}

.readonly-field :deep(.q-field__control:before) {
  border-color: #e0e0e0;
}

/* 表单操作按钮区域 */
.form-actions {
  border-top: 1px solid #f0f0f0;
}

/* 安全设置列表 */
.security-list {
  margin: 0 -16px;
}

.security-item {
  padding: 16px;
  border-radius: 12px;
  margin: 0 8px;
}

.security-item:hover {
  background-color: #fafafa;
}

.security-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 密码对话框 */
.password-dialog {
  border-radius: 16px;
}
</style>
