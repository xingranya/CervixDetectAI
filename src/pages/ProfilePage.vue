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
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">基本信息</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form class="q-gutter-md">
              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input v-model="profileData.firstName" outlined label="名字" />
                </div>
                <div class="col-md-6">
                  <q-input v-model="profileData.lastName" outlined label="姓氏" />
                </div>
              </div>

              <q-input v-model="profileData.email" outlined label="邮箱" type="email" />

              <q-input v-model="profileData.phone" outlined label="电话" type="tel" />

              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input v-model="profileData.institution" outlined label="医疗机构" />
                </div>
                <div class="col-md-6">
                  <q-input v-model="profileData.department" outlined label="科室" />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input v-model="profileData.position" outlined label="职称" />
                </div>
                <div class="col-md-6">
                  <q-input v-model="profileData.title" outlined label="职务" />
                </div>
              </div>

              <q-input v-model="profileData.address" outlined label="地址" />

              <div class="row q-mt-lg">
                <q-space />
                <q-btn color="grey" label="取消" flat @click="resetForm" class="q-mr-sm" :disable="loading" />
                <q-btn color="primary" label="保存更改" @click="saveProfile" :loading="loading" />
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
  // 否则拼接服务器地址
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  if (baseURL.startsWith('/')) {
    // 相对路径，开发环境下使用 localhost:3000
    return `http://localhost:3000${url}`;
  }
  // 完整URL，移除/api后缀
  const serverURL = baseURL.replace('/api', '');
  return `${serverURL}${url}`;
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
</style>
