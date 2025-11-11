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
            <div class="text-h6">账户设置</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form class="q-gutter-md">
              <div class="row q-col-gutter-md">
                <div class="col-md-6">
                  <q-input
                    v-model="accountForm.firstName"
                    outlined
                    label="名字"
                  />
                </div>
                <div class="col-md-6">
                  <q-input
                    v-model="accountForm.lastName"
                    outlined
                    label="姓氏"
                  />
                </div>
              </div>
              
              <q-input
                v-model="accountForm.email"
                outlined
                label="邮箱"
                type="email"
              />
              
              <q-input
                v-model="accountForm.institution"
                outlined
                label="机构/医院"
              />
              
              <div class="row q-mt-lg">
                <q-space />
                <q-btn color="primary" label="保存更改" @click="saveAccount" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
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
            <q-avatar size="100px" class="q-mb-md">
              <img src="https://cdn.quasar.dev/img/avatar.png" alt="用户头像">
            </q-avatar>
            <div class="text-h6">{{ accountForm.firstName }} {{ accountForm.lastName }}医生</div>
            <div class="text-subtitle2">{{ accountForm.institution }}</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <q-list>
              <q-item clickable v-ripple>
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
              
              <q-item clickable v-ripple>
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
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Account form data
const accountForm = {
  firstName: '张',
  lastName: '医生',
  email: 'zhang.doctor@hospital.com',
  institution: '市中心医院'
};

// Notification preferences
const notificationForm = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: false
};

// Save account changes
const saveAccount = () => {
  // In a real app, this would save to the backend
  alert('账户设置保存成功！');
};

// Save notification preferences
const saveNotifications = () => {
  // In a real app, this would save to the backend
  alert('通知偏好设置保存成功！');
};
</script>