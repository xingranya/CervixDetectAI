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
            <q-avatar size="120px" class="q-mb-md">
              <img :src="profileData.avatar" alt="用户头像">
            </q-avatar>
            <div class="text-h6">{{ profileData.firstName }} {{ profileData.lastName }}医生</div>
            <div class="text-subtitle2 text-grey-6">{{ profileData.title }}</div>
            <div class="text-caption text-grey-6 q-mt-sm">{{ profileData.email }}</div>
            
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
                <div class="col-4 text-grey-6">医师编号</div>
                <div class="col-8 text-weight-medium">{{ profileData.doctorId }}</div>
              </div>
              <div class="row items-center">
                <div class="col-4 text-grey-6">科室</div>
                <div class="col-8 text-weight-medium">{{ profileData.department }}</div>
              </div>
              <div class="row items-center">
                <div class="col-4 text-grey-6">职称</div>
                <div class="col-8 text-weight-medium">{{ profileData.position }}</div>
              </div>
              <div class="row items-center">
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
        <q-card flat bordered class="q-mt-md">
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
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Profile data
const profileData = ref({
  firstName: '张',
  lastName: '医生',
  email: 'zhang.doctor@hospital.com',
  phone: '+86 138-1234-5678',
  institution: '市中心医院',
  department: '妇科',
  position: '主治医师',
  title: '妇科主任',
  address: '北京市朝阳区医院路123号',
  doctorId: 'DOC-2024-001',
  avatar: 'https://cdn.quasar.dev/img/avatar.png',
  registeredDate: '2023-01-15',
  stats: {
    totalCases: 342,
    thisMonth: 28
  },
  certifications: [
    {
      name: '执业医师资格证',
      issuer: '中华人民共和国卫生部',
      year: '2018'
    },
    {
      name: '宫颈癌筛查专科培训证书',
      issuer: '中国医师协会',
      year: '2020'
    },
    {
      name: 'AI辅助诊断系统认证',
      issuer: 'CervixDetectAI',
      year: '2023'
    }
  ]
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
