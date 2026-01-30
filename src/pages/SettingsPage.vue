<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row items-center q-mb-md border-bottom q-pb-md">
      <div class="col">
        <div class="text-h5 flex items-center text-weight-bold text-dark">
          <q-icon name="settings" color="primary" class="q-mr-sm" />
          系统设置
        </div>
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="user_account" label="用户账户" icon="group" />
      <q-tab name="ai_model" label="AI模型管理" icon="memory" />
      <q-tab name="system_params" label="系统参数" icon="tune" />
      <q-tab name="data_backup" label="数据备份" icon="storage" />
      <q-tab name="system_log" label="系统日志" icon="description" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="activeTab" animated>
      <!-- User Account Tab -->
      <q-tab-panel name="user_account" class="q-pa-none">
        <div class="row q-col-gutter-lg">
          <!-- 左侧：用户信息卡片 -->
          <div class="col-lg-4 col-md-5 col-xs-12">
            <!-- 用户头像卡片 -->
            <q-card flat bordered class="profile-card q-mb-lg">
              <q-card-section class="text-center q-pa-xl">
                <q-avatar size="120px" class="q-mb-lg avatar-wrapper" color="primary" text-color="white">
                  <template v-if="avatarUrl">
                    <img :src="avatarUrl" alt="用户头像" />
                  </template>
                  <template v-else>
                    <div class="text-h3">{{ userInitial }}</div>
                  </template>
                </q-avatar>

                <div class="text-h5 text-weight-bold q-mb-sm">{{ user?.real_name || user?.username || '用户' }}</div>

                <q-badge
                  :color="user?.role === 'admin' ? 'red' : user?.role === 'doctor' ? 'primary' : 'grey-6'"
                  class="q-pa-sm"
                  rounded
                >
                  {{ user?.role === 'doctor' ? '医生' : user?.role === 'admin' ? '管理员' : '普通用户' }}
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
            <q-card flat bordered class="profile-card q-mb-lg">
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
                    <div class="info-label">最后登录</div>
                    <div class="info-value">{{ formattedLastLogin }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- 统计信息卡片 -->
            <q-card flat bordered class="profile-card">
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
            <q-card flat bordered class="profile-card q-mb-lg">
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
                        <q-input
                          v-model="profileData.email"
                          outlined
                          label="邮箱"
                          type="email"
                          placeholder="example@email.com"
                          class="form-input"
                          :rules="[
                            (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确'
                          ]"
                        >
                          <template v-slot:prepend>
                            <q-icon name="email" color="grey-6" />
                          </template>
                        </q-input>
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
                          :rules="[
                            (val) => !val || /^1[3-9]\d{9}$/.test(val) || '手机号格式不正确'
                          ]"
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
                        <q-field
                          outlined
                          label="工号"
                          stack-label
                          class="form-input readonly-field"
                        >
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

            <!-- 安全设置卡片 -->
            <q-card flat bordered class="profile-card">
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
                      <q-item-label caption class="text-grey-6">定期更换密码以保护账户安全</q-item-label>
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
                    (val) => val.length >= 6 || '密码长度至少6位'
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
                    (val) => val === passwordForm.newPassword || '两次输入的密码不一致'
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
                  <q-btn label="取消" flat color="grey-7" v-close-popup class="q-mr-md q-px-lg" rounded />
                  <q-btn label="确认修改" color="primary" type="submit" :loading="passwordLoading" rounded unelevated class="q-px-lg" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- AI Model Tab -->
      <q-tab-panel name="ai_model" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered class="full-height">
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="info" class="q-mr-sm text-grey-7" />
                  当前模型版本
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">模型名称</div>
                  <div class="col-8">CervixNet-V3.2</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">发布日期</div>
                  <div class="col-8">2025-11-20</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">准确率</div>
                  <div class="col-8">96.7% (验证集)</div>
                </div>
                <div class="row">
                  <div class="col-4 text-grey-7 text-weight-medium">状态</div>
                  <div class="col-8"><q-badge color="positive" label="运行中" /></div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered class="full-height">
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="update" class="q-mr-sm text-grey-7" />
                  可用更新
                </div>
              </q-card-section>
              <q-card-section>
                <div class="bg-blue-1 q-pa-md rounded-borders border-blue-2 q-mb-md">
                  <div class="row justify-between items-center q-mb-xs">
                    <div class="text-weight-bold text-dark">CervixNet-V3.3 (预发布版)</div>
                    <q-badge color="primary" label="可更新" />
                  </div>
                  <div class="text-caption text-grey-7 q-mb-sm">
                    优化了LSIL/HSIL分类边界，新增了3个鉴别特征。
                  </div>
                  <div class="text-caption text-grey-6">大小: 245 MB | 发布日期: 2025-12-10</div>
                </div>
                <div class="row q-gutter-sm">
                  <q-btn color="primary" icon="download" label="立即更新" />
                  <q-btn outline color="grey-8" icon="sync" label="检查更新" />
                  <q-btn outline color="grey-8" icon="backup" label="模型备份" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="show_chart" class="q-mr-sm text-grey-7" />
                  模型性能监控
                </div>
              </q-card-section>
              <q-card-section>
                <div ref="performanceChartRef" style="height: 300px"></div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- System Params Tab -->
      <q-tab-panel name="system_params" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="tune" class="q-mr-sm text-grey-7" />
                  风险评估阈值
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-7 q-mb-xs">低风险阈值</div>
                    <q-input
                      dense
                      outlined
                      v-model="params.lowRiskThreshold"
                      type="number"
                      step="0.05"
                    />
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-7 q-mb-xs">高风险阈值</div>
                    <q-input
                      dense
                      outlined
                      v-model="params.highRiskThreshold"
                      type="number"
                      step="0.05"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="description" class="q-mr-sm text-grey-7" />
                  报告生成设置
                </div>
              </q-card-section>
              <q-card-section>
                <q-checkbox
                  v-model="params.includeSummary"
                  label="自动包含AI分析摘要"
                  dense
                  class="full-width q-mb-sm"
                />
                <q-checkbox
                  v-model="params.includeFollowUp"
                  label="自动包含建议随访周期"
                  dense
                  class="full-width q-mb-sm"
                />
                <q-checkbox
                  v-model="params.requireReview"
                  label="需要二级医师审核"
                  dense
                  class="full-width"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="image" class="q-mr-sm text-grey-7" />
                  影像分析参数
                </div>
              </q-card-section>
              <q-card-section>
                <q-select
                  dense
                  outlined
                  v-model="params.analysisMode"
                  :options="analysisModeOptions"
                  class="q-mb-md"
                />
                <q-checkbox v-model="params.saveIntermediate" label="保存分析中间结果" dense />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="gavel" class="q-mr-sm text-grey-7" />
                  系统诊断标准依据
                </div>
              </q-card-section>
              <q-card-section>
                <q-select
                  dense
                  outlined
                  v-model="params.diagnosticStandard"
                  :options="standardOptions"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 flex justify-end q-gutter-sm">
            <q-btn outline color="grey-8" icon="restore" label="恢复默认" />
            <q-btn color="primary" icon="save" label="保存设置" />
          </div>
        </div>
      </q-tab-panel>

      <!-- Data Backup Tab -->
      <q-tab-panel name="data_backup" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="backup" class="q-mr-sm text-grey-7" />
                  备份状态
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">最后完整备份</div>
                  <div class="col-8">2025-12-10 02:00:00</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">备份位置</div>
                  <div class="col-8">本地服务器 /backup/cervix_ai/</div>
                </div>
                <div class="row">
                  <div class="col-4 text-grey-7 text-weight-medium">备份大小</div>
                  <div class="col-8">4.7 GB</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="schedule" class="q-mr-sm text-grey-7" />
                  备份计划
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <q-checkbox
                    v-model="backup.autoBackup"
                    label="每日自动备份"
                    dense
                    class="q-mr-md"
                  />
                  <q-select
                    dense
                    outlined
                    v-model="backup.time"
                    :options="['02:00', '03:00', '04:00']"
                    style="width: 100px"
                  />
                </div>
                <q-checkbox v-model="backup.emailNotify" label="备份后发送通知邮件" dense />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="play_arrow" class="q-mr-sm text-grey-7" />
                  立即执行
                </div>
              </q-card-section>
              <q-card-section class="row q-gutter-sm">
                <q-btn color="primary" icon="save" label="创建完整备份" />
                <q-btn outline color="grey-8" icon="folder" label="仅备份病例数据" />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="restore" class="q-mr-sm text-grey-7" />
                  恢复操作
                </div>
              </q-card-section>
              <q-card-section>
                <div class="text-caption text-grey-7 q-mb-sm">从备份文件恢复系统数据。</div>
                <div class="row q-gutter-sm">
                  <q-file dense outlined v-model="restoreFile" label="选择文件" class="col-grow">
                    <template v-slot:prepend><q-icon name="attach_file" /></template>
                  </q-file>
                  <q-btn color="primary" icon="sync" label="验证并恢复" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- System Log Tab -->
      <q-tab-panel name="system_log" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="list" class="q-mr-sm text-grey-7" />
                  近期系统日志
                </div>
                <div class="q-gutter-sm">
                  <q-btn outline size="sm" icon="download" label="导出日志" color="grey-8" />
                  <q-btn outline size="sm" icon="delete" label="清空日志" color="grey-8" />
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <q-scroll-area style="height: 300px">
                  <q-list separator>
                    <q-item v-for="(log, index) in systemLogs" :key="index">
                      <q-item-section>
                        <div class="text-caption text-grey-6 font-mono">{{ log.time }}</div>
                        <div class="text-body2 text-grey-9">{{ log.message }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-scroll-area>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="info" class="q-mr-sm text-grey-7" />
                  软件信息
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">软件名称</div>
                  <div class="col-10">宫颈病变智能风险评估与辅助诊断系统</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">版本</div>
                  <div class="col-10">V1.0.0 (Build 20251212)</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">许可证</div>
                  <div class="col-10">医疗机构内部使用</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">技术支持</div>
                  <div class="col-10">support@med-ai.com | 400-123-4567</div>
                </div>
                <div class="row q-mb-md">
                  <div class="col-2 text-grey-7 text-weight-medium">数据安全</div>
                  <div class="col-10">符合《医疗卫生机构数据安全管理办法》</div>
                </div>
                <div class="row q-gutter-sm">
                  <q-btn outline color="grey-8" icon="help" label="用户手册" />
                  <q-btn outline color="grey-8" icon="security" label="隐私协议" />
                  <q-btn outline color="grey-8" icon="update" label="检查更新" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import * as echarts from 'echarts';
import { useAuthStore } from 'stores/authStore';
import { userAPI } from 'src/services/api';
import { HOSPITALS, DEPARTMENTS } from 'src/constants/hospitals';

const $q = useQuasar();
const activeTab = ref('user_account');

// Auth Store
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// 获取当前用户所属医院
const currentHospital = computed(() => {
  if (!user.value?.hospital_id) return null;
  return HOSPITALS.find(h => h.id === user.value?.hospital_id);
});

// 获取当前用户科室（从工号解析）
const currentDepartment = computed(() => {
  if (!user.value?.employee_id) return null;
  const deptCode = user.value.employee_id.substring(0, 2);
  return DEPARTMENTS.find(d => d.code === deptCode);
});

// 格式化最后登录时间
const formattedLastLogin = computed(() => {
  if (!user.value?.last_login_at) return '-';
  return new Date(user.value.last_login_at).toLocaleString('zh-CN');
});

// 头像 URL
const avatarUrl = computed(() => {
  if (!user.value?.avatar_url) return '';
  const url = user.value.avatar_url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (import.meta.env.DEV) {
    return `http://localhost:3000${url}`;
  }
  return url;
});

// 用户名首字母
const userInitial = computed(() => {
  if (user.value?.real_name) {
    return user.value.real_name.charAt(0).toUpperCase();
  }
  if (user.value?.username) {
    return user.value.username.charAt(0).toUpperCase();
  }
  return 'U';
});

// 个人资料数据
const profileData = ref({
  firstName: '',
  email: '',
  phone: '',
  stats: {
    totalCases: 0,
    thisMonth: 0,
  },
});

const loading = ref(false);

// 密码相关
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

// 加载用户数据
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
  }
};

// 保存个人资料
const saveProfile = async () => {
  loading.value = true;
  try {
    const updateData: { real_name?: string; phone?: string } = {};

    if (profileData.value.firstName) {
      updateData.real_name = profileData.value.firstName.trim();
    }
    if (profileData.value.phone) {
      updateData.phone = profileData.value.phone;
    }

    const response = await userAPI.updateProfile(updateData);

    if (response.success) {
      authStore.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(response.data.user));
      await loadUserData();

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

// 重置表单
const resetForm = async () => {
  await loadUserData();
  $q.notify({
    type: 'info',
    message: '已恢复原始数据',
    position: 'top',
  });
};

// 更改头像
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

// 上传头像
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

// 显示修改密码对话框
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

// 修改密码
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

// System Params
const params = ref({
  lowRiskThreshold: 0.3,
  highRiskThreshold: 0.7,
  includeSummary: true,
  includeFollowUp: true,
  requireReview: false,
  analysisMode: 'balanced',
  saveIntermediate: true,
  diagnosticStandard: 'who2020',
});
const analysisModeOptions = [
  { label: '高精度模式 (较慢)', value: 'high' },
  { label: '平衡模式', value: 'balanced' },
  { label: '快速模式', value: 'fast' },
];
const standardOptions = [
  { label: 'WHO 2020 宫颈病变分类', value: 'who2020' },
  { label: 'ASCCP 2019 风险管理共识', value: 'asccp2019' },
  { label: '自定义标准', value: 'custom' },
];

// Backup
const backup = ref({
  autoBackup: true,
  time: '02:00',
  emailNotify: false,
});
const restoreFile = ref(null);

// System Log
const systemLogs = ref([
  { time: '2025-12-12 10:23:11', message: '用户[张明]登录系统。' },
  { time: '2025-12-12 09:45:30', message: 'AI模型完成病例[20251211005]分析，置信度: 0.92。' },
  { time: '2025-12-12 02:00:15', message: '每日数据备份任务执行成功，大小: 4.7GB。' },
  { time: '2025-12-11 22:10:05', message: '系统服务重启完成，版本: V1.0.0。' },
]);

// Chart
const performanceChartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (performanceChartRef.value) {
    chartInstance = echarts.init(performanceChartRef.value);
    const option = {
      color: ['#375A64', '#64748b'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['准确率', '召回率'], top: '5%' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['11-01', '11-08', '11-15', '11-22', '11-29', '12-06', '12-12'],
        axisLine: { lineStyle: { color: '#cbd5e1' } },
      },
      yAxis: {
        type: 'value',
        min: 0.85,
        max: 1.0,
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      series: [
        {
          name: '准确率',
          type: 'line',
          smooth: true,
          data: [0.912, 0.923, 0.935, 0.942, 0.951, 0.962, 0.967],
          lineStyle: { width: 3 },
        },
        {
          name: '召回率',
          type: 'line',
          smooth: true,
          data: [0.898, 0.905, 0.918, 0.927, 0.934, 0.945, 0.952],
          lineStyle: { width: 3, type: 'dashed' },
        },
      ],
    };
    chartInstance.setOption(option);
  }
};

onMounted(() => {
  // Delay chart init to ensure tab is rendered if active
  setTimeout(() => {
    if (activeTab.value === 'ai_model') initChart();
  }, 100);
});

// 监听 tab 切换初始化图表
watch(activeTab, (val) => {
  if (val === 'ai_model') {
    setTimeout(initChart, 100);
  }
});

onUnmounted(() => {
  chartInstance?.dispose();
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-bottom-light {
  border-bottom: 1px solid #f5f5f5;
}
.border-blue-2 {
  border: 1px solid #bbdefb;
}
.font-mono {
  font-family: monospace;
}

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
