<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">个人资料</div>
        <p>管理您的个人信息和偏好设置。</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 主要信息卡片 -->
      <div class="col-md-4 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-avatar size="120px" class="q-mb-md" color="primary" text-color="white">
              <template v-if="avatarUrl">
                <img :src="avatarUrl" alt="用户头像" />
              </template>
              <template v-else>
                <div class="text-h3">{{ userInitial }}</div>
              </template>
            </q-avatar>
            <div class="text-h6">{{ user?.real_name || user?.username || '用户' }}</div>
            <div class="text-subtitle2 text-grey-6">
              {{ user?.role === 'doctor' ? '医生' : user?.role === 'admin' ? '管理员' : '用户' }}
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              {{ user?.email || user?.phone || '' }}
            </div>

            <q-btn
              label="更改头像"
              color="primary"
              flat
              dense
              class="q-mt-md"
              @click="changeAvatar"
            />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="q-gutter-sm">
              <div class="row items-center">
                <div class="col-4 text-grey-6">用户名</div>
                <div class="col-8 text-weight-medium">{{ user?.username || '-' }}</div>
              </div>
              <div class="row items-center" v-if="profileData.phone">
                <div class="col-4 text-grey-6">手机号</div>
                <div class="col-8 text-weight-medium">{{ profileData.phone }}</div>
              </div>
              <div class="row items-center" v-if="profileData.department">
                <div class="col-4 text-grey-6">科室</div>
                <div class="col-8 text-weight-medium">{{ profileData.department }}</div>
              </div>
              <div class="row items-center" v-if="profileData.registeredDate">
                <div class="col-4 text-grey-6">注册日期</div>
                <div class="col-8 text-weight-medium">
                  {{ new Date(profileData.registeredDate).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 统计信息卡片 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">活动统计</div>
            <div class="row q-col-gutter-md text-center">
              <div class="col-6">
                <div class="text-h5 text-primary">{{ profileData.stats.totalCases }}</div>
                <div class="text-caption text-grey-6">总病例</div>
              </div>
              <div class="col-6">
                <div class="text-h5 text-secondary">{{ profileData.stats.thisMonth }}</div>
                <div class="text-caption text-grey-6">本月病例</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 详细信息卡片 -->
      <div class="col-md-8 col-xs-12">
        <q-card flat bordered class="profile-form-card">
          <q-card-section class="bg-grey-1">
            <div class="row items-center">
              <q-icon name="person" size="sm" color="primary" class="q-mr-sm" />
              <div class="text-h6 text-weight-medium">基本信息</div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">更新您的个人信息和联系方式</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-lg">
            <q-form class="q-gutter-lg">
              <!-- 姓名 -->
              <div class="row q-col-gutter-md">
                <div class="col-md-6 col-12">
                  <q-input
                    v-model="profileData.firstName"
                    outlined
                    label="名字"
                    stack-label
                    placeholder="请输入名字"
                    bg-color="white"
                    class="modern-input"
                  >
                    <template v-slot:prepend>
                      <q-icon name="badge" color="grey-6" />
                    </template>
                  </q-input>
                </div>
                <div class="col-md-6 col-12">
                  <q-input
                    v-model="profileData.lastName"
                    outlined
                    label="姓氏"
                    stack-label
                    placeholder="请输入姓氏"
                    bg-color="white"
                    class="modern-input"
                  >
                    <template v-slot:prepend>
                      <q-icon name="badge" color="grey-6" />
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- 邮箱 -->
              <q-input
                v-model="profileData.email"
                outlined
                label="邮箱"
                stack-label
                type="email"
                placeholder="example@email.com"
                bg-color="white"
                class="modern-input"
              >
                <template v-slot:prepend>
                  <q-icon name="email" color="grey-6" />
                </template>
              </q-input>

              <!-- 电话 -->
              <q-input
                v-model="profileData.phone"
                outlined
                label="电话"
                stack-label
                type="tel"
                placeholder="请输入手机号码"
                bg-color="white"
                class="modern-input"
                maxlength="11"
              >
                <template v-slot:prepend>
                  <q-icon name="phone" color="grey-6" />
                </template>
              </q-input>

              <!-- 医疗机构与科室 -->
              <div class="row q-col-gutter-md">
                <div class="col-md-6 col-12">
                  <q-input
                    v-model="profileData.institution"
                    outlined
                    label="医疗机构"
                    stack-label
                    placeholder="请输入医疗机构名称"
                    bg-color="white"
                    class="modern-input"
                  >
                    <template v-slot:prepend>
                      <q-icon name="domain" color="grey-6" />
                    </template>
                  </q-input>
                </div>
                <div class="col-md-6 col-12">
                  <q-input
                    v-model="profileData.department"
                    outlined
                    label="科室"
                    stack-label
                    placeholder="请输入科室"
                    bg-color="white"
                    class="modern-input"
                  >
                    <template v-slot:prepend>
                      <q-icon name="medical_services" color="grey-6" />
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- 职称与职务 -->
              <div class="row q-col-gutter-md">
                <div class="col-md-6 col-12">
                  <q-input
                    v-model="profileData.position"
                    outlined
                    label="职称"
                    stack-label
                    placeholder="请输入职称"
                    bg-color="white"
                    class="modern-input"
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
                    stack-label
                    placeholder="请输入职务"
                    bg-color="white"
                    class="modern-input"
                  >
                    <template v-slot:prepend>
                      <q-icon name="work" color="grey-6" />
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- 地址 -->
              <q-input
                v-model="profileData.address"
                outlined
                label="地址"
                stack-label
                placeholder="请输入详细地址"
                bg-color="white"
                class="modern-input"
              >
                <template v-slot:prepend>
                  <q-icon name="location_on" color="grey-6" />
                </template>
              </q-input>

              <!-- 按钮组 -->
              <div class="row q-mt-xl q-pt-md" style="border-top: 1px solid #e0e0e0">
                <q-space />
                <q-btn
                  color="grey-7"
                  label="取消"
                  outline
                  rounded
                  unelevated
                  @click="resetForm"
                  class="q-mr-sm q-px-lg"
                  :disable="loading"
                />
                <q-btn
                  color="primary"
                  label="保存更改"
                  rounded
                  unelevated
                  @click="saveProfile"
                  :loading="loading"
                  class="q-px-lg"
                  icon-right="check"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- 专业资质卡片 -->
        <q-card v-if="profileData.certifications.length > 0" flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">专业资质</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list>
              <q-item v-for="(cert, index) in profileData.certifications" :key="index">
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ cert.name }}</q-item-label>
                  <q-item-label caption>{{ cert.issuer }} - {{ cert.year }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-btn
              label="添加资质"
              color="primary"
              flat
              icon="add"
              class="q-mt-sm"
              @click="addCertification"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/authStore';
import { userAPI } from 'src/services/api';

const $q = useQuasar();
const authStore = useAuthStore();

const user = computed(() => authStore.user);

// 处理头像URL，确保是完整的URL
const avatarUrl = computed(() => {
  if (!user.value?.avatar_url) return '';
  const url = user.value.avatar_url;
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 开发环境：拼接 localhost:3000
  if (import.meta.env.DEV) {
    return `http://localhost:3000${url}`;
  }
  // 生产环境：直接使用相对路径
  return url;
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
  lastName: '',
  email: '',
  phone: '',
  institution: '',
  department: '',
  position: '',
  title: '',
  address: '',
  doctorId: '',
  registeredDate: '',
  stats: {
    totalCases: 0,
    thisMonth: 0,
  },
  certifications: [] as Array<{ name: string; issuer: string; year: string }>,
});

const loading = ref(false);

onMounted(() => {
  loadUserData();
});

const loadUserData = () => {
  if (user.value) {
    profileData.value.email = user.value.email || '';
    profileData.value.phone = user.value.phone || '';
    profileData.value.firstName = user.value.real_name?.split(' ')[0] || '';
    profileData.value.lastName = user.value.real_name?.split(' ')[1] || '';
    profileData.value.registeredDate = user.value.last_login_at || new Date().toISOString();
  }
};

const originalData = ref(JSON.parse(JSON.stringify(profileData.value)));

const saveProfile = async () => {
  loading.value = true;
  try {
    const real_name = `${profileData.value.firstName} ${profileData.value.lastName}`.trim();
    // 构建更新数据对象，只包含有值的属性
    const updateData: { real_name?: string; phone?: string } = {};
    if (real_name) {
      updateData.real_name = real_name;
    }
    if (profileData.value.phone) {
      updateData.phone = profileData.value.phone;
    }
    const response = await userAPI.updateProfile(updateData);

    if (response.success) {
      authStore.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(response.data.user));
      originalData.value = JSON.parse(JSON.stringify(profileData.value));
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

const resetForm = () => {
  loadUserData();
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

const addCertification = () => {
  $q.notify({
    type: 'info',
    message: '添加资质功能将在实际应用中实现',
    position: 'top',
  });
};
</script>

<style scoped>
.q-avatar img {
  object-fit: cover;
}

/* 表单卡片样式 */
.profile-form-card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.profile-form-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 现代化输入框样式 */
.modern-input :deep(.q-field__control) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-input :deep(.q-field__control):hover {
  background-color: #f5f5f5;
}

.modern-input :deep(.q-field--focused .q-field__control) {
  background-color: white;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

/* 输入框聚焦状态 */
.modern-input :deep(.q-field--outlined .q-field__control:before) {
  border-color: #e0e0e0;
  transition: border-color 0.3s ease;
}

.modern-input :deep(.q-field--outlined:hover .q-field__control:before) {
  border-color: #bdbdbd;
}

.modern-input :deep(.q-field--outlined.q-field--focused .q-field__control:before) {
  border-color: var(--q-primary);
  border-width: 2px;
}

/* 图标样式 */
.modern-input :deep(.q-field__prepend) {
  padding-right: 8px;
}

/* 按钮悬停效果 */
.q-btn {
  transition: all 0.3s ease;
}

.q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
