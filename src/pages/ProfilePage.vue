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
              <template v-if="user?.avatar_url">
                <img :src="user.avatar_url" alt="用户头像">
              </template>
              <template v-else>
                <div class="text-h3">{{ userInitial }}</div>
              </template>
            </q-avatar>
            <div class="text-h6">{{ user?.real_name || user?.username || '用户' }}</div>
            <div class="text-subtitle2 text-grey-6">{{ user?.role === 'doctor' ? '医生' : user?.role === 'admin' ? '管理员' : '用户' }}</div>
            <div class="text-caption text-grey-6 q-mt-sm">{{ user?.email || user?.phone || '' }}</div>
            
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
                <div class="col-8 text-weight-medium">{{ new Date(profileData.registeredDate).toLocaleDateString() }}</div>
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
                  <q-input
                    v-model="profileData.firstName"
                    outlined
                    label="名字"
                  />
                </div>
                <div class="col-md-6">
                  <q-input
                    v-model="profileData.lastName"
                    outlined
                    label="姓氏"
                  />
                </div>
              </div>
              
              <q-input
                v-model="profileData.email"
                outlined
                label="邮箱"
                type="email"
              />
              
              <q-input
                v-model="profileData.phone"
                outlined
                label="电话"
                type="tel"
              />
              
              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input
                    v-model="profileData.institution"
                    outlined
                    label="医疗机构"
                  />
                </div>
                <div class="col-md-6">
                  <q-input
                    v-model="profileData.department"
                    outlined
                    label="科室"
                  />
                </div>
              </div>
              
              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input
                    v-model="profileData.position"
                    outlined
                    label="职称"
                  />
                </div>
                <div class="col-md-6">
                  <q-input
                    v-model="profileData.title"
                    outlined
                    label="职务"
                  />
                </div>
              </div>
              
              <q-input
                v-model="profileData.address"
                outlined
                label="地址"
              />
              
              <div class="row q-mt-lg">
                <q-space />
                <q-btn color="grey" label="取消" flat @click="resetForm" class="q-mr-sm" />
                <q-btn color="primary" label="保存更改" @click="saveProfile" />
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/authStore'

const $q = useQuasar()
const authStore = useAuthStore()

// 获取当前用户
const user = computed(() => authStore.user)

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

// Profile data
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
    thisMonth: 0
  },
  certifications: [] as Array<{ name: string; issuer: string; year: string }>
})

// 初始化用户数据
onMounted(() => {
  if (user.value) {
    profileData.value.email = user.value.email || ''
    profileData.value.phone = user.value.phone || ''
    profileData.value.firstName = user.value.real_name?.split(' ')[0] || ''
    profileData.value.lastName = user.value.real_name?.split(' ')[1] || ''
    // 注意：User模型没有created_at字段，使用last_login_at作为替代
    profileData.value.registeredDate = user.value.last_login_at || new Date().toISOString()
  }
})

// Create a backup for reset
const originalData = ref(JSON.parse(JSON.stringify(profileData.value)))

// Save profile changes
const saveProfile = () => {
  // In a real app, this would save to the backend
  originalData.value = JSON.parse(JSON.stringify(profileData.value))
  $q.notify({
    type: 'positive',
    message: '个人资料保存成功！',
    position: 'top'
  })
}

// Reset form to original values
const resetForm = () => {
  profileData.value = JSON.parse(JSON.stringify(originalData.value))
  $q.notify({
    type: 'info',
    message: '已恢复原始数据',
    position: 'top'
  })
}

// Change avatar
const changeAvatar = () => {
  $q.notify({
    type: 'info',
    message: '头像上传功能将在实际应用中实现',
    position: 'top'
  })
}

// Add certification
const addCertification = () => {
  $q.notify({
    type: 'info',
    message: '添加资质功能将在实际应用中实现',
    position: 'top'
  })
}
</script>

<style scoped>
.q-avatar img {
  object-fit: cover;
}
</style>
