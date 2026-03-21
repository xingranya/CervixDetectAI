<template>
  <q-page class="q-pa-md settings-page app-gradient-page">
    <!-- Page Header -->
    <div class="row items-center q-mb-sm border-bottom q-pb-md">
      <div class="col">
        <div class="text-h5 flex items-center text-weight-bold text-dark">
          <q-icon name="settings" color="primary" class="q-mr-sm" />
          系统设置
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">系统控制台 · 全局配置与运维面板</div>
      </div>
    </div>

    <q-card flat bordered class="settings-hero q-mb-md">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-lg-8 col-md-7 col-xs-12">
          <div class="text-h6 text-weight-bold q-mb-xs">系统运行概览</div>
          <div class="text-body2 text-grey-7">
            通过下方模块统一管理模型表现、参数控制、备份策略与操作留痕。
          </div>
        </div>
        <div class="col-lg-4 col-md-5 col-xs-12">
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-btn
                outline
                color="primary"
                icon="tune"
                label="参数面板"
                class="full-width"
                @click="activeTab = 'system_params'"
              />
            </div>
            <div class="col-6">
              <q-btn
                outline
                color="teal"
                icon="storage"
                label="备份中心"
                class="full-width"
                @click="activeTab = 'data_backup'"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="item in overviewHighlights"
        :key="item.key"
        class="col-lg-3 col-md-6 col-xs-12"
      >
        <q-card flat bordered class="overview-card">
          <q-card-section class="row items-center no-wrap q-pa-md">
            <q-avatar :color="item.bgColor" :text-color="item.iconColor" size="44px" class="q-mr-md">
              <q-icon :name="item.icon" />
            </q-avatar>
            <div class="col">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-subtitle1 text-weight-bold">{{ item.value }}</div>
              <div class="text-caption" :class="item.trendClass">{{ item.trend }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      class="settings-tabs app-accent-tabs text-grey q-mb-xs"
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

    <q-tab-panels v-model="activeTab" animated class="settings-panels">
      <!-- User Account Tab -->
      <q-tab-panel name="user_account" class="q-pa-none">
        <div class="row q-col-gutter-lg">
          <!-- 左侧：用户信息卡片 -->
          <div class="col-lg-4 col-md-5 col-xs-12">
            <!-- 用户头像卡片 -->
            <q-card flat bordered class="profile-card q-mb-lg">
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
                    user?.role === 'doctor'
                      ? '医生'
                      : user?.role === 'admin'
                        ? '管理员'
                        : '普通用户'
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
                    <div class="profile-form-label">姓名</div>
                    <q-input
                      v-model="profileData.firstName"
                      outlined
                      placeholder="请输入您的真实姓名"
                      class="form-input form-input-lg profile-edit-input"
                    >
                      <template v-slot:prepend>
                        <q-icon name="person" color="grey-6" />
                      </template>
                    </q-input>
                  </div>

                  <!-- 联系方式区块 -->
                  <div class="form-section">
                    <div class="form-section-title">联系方式</div>
                    <div class="row q-col-gutter-lg profile-contact-row">
                      <div class="col-md-6 col-12">
                        <div class="profile-form-label">
                          邮箱
                          <span class="profile-form-label__hint">（在下方邮箱安全模块更换）</span>
                        </div>
                        <q-field
                          outlined
                          class="form-input form-input-lg readonly-field profile-edit-input"
                        >
                          <template v-slot:prepend>
                            <q-icon name="email" color="grey-6" />
                          </template>
                          <template v-slot:control>
                            <div class="profile-readonly-value">{{ profileData.email || '-' }}</div>
                          </template>
                        </q-field>
                      </div>
                      <div class="col-md-6 col-12">
                        <div class="profile-form-label">手机号</div>
                        <q-input
                          v-model="profileData.phone"
                          outlined
                          type="tel"
                          placeholder="请输入手机号码"
                          class="form-input form-input-lg profile-edit-input"
                          maxlength="11"
                          :rules="[
                            (val) => !val || /^1[3-9]\d{9}$/.test(val) || '手机号格式不正确',
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

            <EmailSecurityCard
              class="q-mb-lg"
              :current-email="profileData.email"
              :disabled="loading"
              @email-updated="handleEmailUpdated"
            />

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
          <q-card class="password-dialog password-dialog-card">
            <q-card-section class="row items-center q-pb-none q-pt-lg q-px-lg">
              <div class="text-h6 text-weight-bold">修改密码</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup aria-label="关闭对话框" />
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
      </q-tab-panel>

      <!-- AI Model Tab -->
      <q-tab-panel name="ai_model" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered class="full-height control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-card flat bordered class="full-height control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
                  <q-btn
                    color="primary"
                    icon="download"
                    label="立即更新"
                    :loading="modelActionLoading.update"
                    @click="runModelAction('update')"
                  />
                  <q-btn
                    outline
                    color="grey-8"
                    icon="sync"
                    label="检查更新"
                    :loading="modelActionLoading.check"
                    @click="runModelAction('check')"
                  />
                  <q-btn
                    outline
                    color="grey-8"
                    icon="backup"
                    label="模型备份"
                    :loading="modelActionLoading.backup"
                    @click="runModelAction('backup')"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="show_chart" class="q-mr-sm text-grey-7" />
                  模型性能监控
                </div>
              </q-card-section>
              <q-card-section>
                <div ref="performanceChartRef" class="performance-chart"></div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- System Params Tab -->
      <q-tab-panel name="system_params" class="q-pa-none rounded-control-panel">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-btn
              outline
              color="grey-8"
              icon="restore"
              label="恢复默认"
              :loading="paramsActionLoading.reset"
              @click="resetSystemParams"
            />
            <q-btn
              color="primary"
              icon="save"
              label="保存设置"
              :loading="paramsActionLoading.save"
              @click="saveSystemParams"
            />
          </div>
        </div>
      </q-tab-panel>

      <!-- Data Backup Tab -->
      <q-tab-panel name="data_backup" class="q-pa-none rounded-control-panel">
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
                    class="backup-time-select"
                  />
                </div>
                <q-checkbox v-model="backup.emailNotify" label="备份后发送通知邮件" dense />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="play_arrow" class="q-mr-sm text-grey-7" />
                  立即执行
                </div>
              </q-card-section>
              <q-card-section class="row q-gutter-sm">
                <q-btn
                  color="primary"
                  icon="save"
                  label="创建完整备份"
                  :loading="backupActionLoading.full"
                  @click="runBackupAction('full')"
                />
                <q-btn
                  outline
                  color="grey-8"
                  icon="folder"
                  label="仅备份病例数据"
                  :loading="backupActionLoading.caseOnly"
                  @click="runBackupAction('caseOnly')"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
                  <q-btn
                    color="primary"
                    icon="sync"
                    label="验证并恢复"
                    :loading="backupActionLoading.restore"
                    @click="runBackupAction('restore')"
                  />
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
            <q-card flat bordered class="control-card">
              <q-card-section
                class="row items-center justify-between q-pb-sm border-bottom-light panel-header"
              >
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="list" class="q-mr-sm text-grey-7" />
                  近期系统日志
                </div>
                <div class="q-gutter-sm">
                  <q-btn
                    outline
                    size="sm"
                    icon="download"
                    label="导出日志"
                    color="grey-8"
                    :disable="filteredSystemLogs.length === 0"
                    @click="exportSystemLogs"
                  />
                  <q-btn
                    outline
                    size="sm"
                    icon="delete"
                    label="清空日志"
                    color="grey-8"
                    :disable="systemLogs.length === 0"
                    @click="clearSystemLogs"
                  />
                </div>
              </q-card-section>
              <q-card-section class="q-pt-sm q-pb-sm">
                <div class="row q-col-gutter-sm items-center">
                  <div class="col-md-8 col-xs-12">
                    <q-btn-toggle
                      v-model="logTypeFilter"
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      spread
                      :options="logTypeOptions"
                    />
                  </div>
                  <div class="col-md-4 col-xs-12">
                    <q-input
                      v-model="logKeyword"
                      dense
                      outlined
                      clearable
                      placeholder="搜索日志内容"
                    >
                      <template v-slot:prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <q-scroll-area class="system-log-scroll-area">
                  <q-list v-if="filteredSystemLogs.length > 0" separator>
                    <q-item
                      v-for="(log, index) in filteredSystemLogs"
                      :key="`${log.time}-${index}`"
                      class="log-entry"
                    >
                      <q-item-section avatar class="log-entry__axis">
                        <div
                          class="log-dot"
                          :style="{ backgroundColor: getLogTypeMeta(log.type).dotColor }"
                        >
                          <q-icon :name="getLogTypeMeta(log.type).icon" size="16px" color="white" />
                        </div>
                      </q-item-section>
                      <q-item-section>
                        <div class="row items-center q-gutter-sm q-mb-xs">
                          <div class="text-caption text-grey-6 font-mono">{{ log.time }}</div>
                          <q-chip dense square color="blue-1" text-color="primary" icon="person">
                            {{ log.username }}
                          </q-chip>
                          <q-chip
                            dense
                            :color="getLogTypeMeta(log.type).chipColor"
                            :text-color="getLogTypeMeta(log.type).chipTextColor"
                            :icon="getLogTypeMeta(log.type).icon"
                          >
                            {{ getLogTypeMeta(log.type).label }}
                          </q-chip>
                        </div>
                        <div class="text-body2 text-grey-9 log-message">{{ log.message }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div v-else class="empty-log-state">
                    <q-icon name="description" size="36px" color="grey-4" />
                    <div class="text-grey-6 q-mt-sm">
                      {{ systemLogs.length === 0 ? '暂无系统日志' : '当前筛选条件下无日志' }}
                    </div>
                  </div>
                </q-scroll-area>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="control-card">
              <q-card-section class="row items-center q-pb-sm border-bottom-light panel-header">
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
                  <div class="col-10">V1.1.8 (Build 20260223)</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">许可证</div>
                  <div class="col-10">医疗机构内部使用</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-2 text-grey-7 text-weight-medium">技术支持</div>
                  <div class="col-10">support@hpvsc.icu</div>
                </div>
                <div class="row q-mb-md">
                  <div class="col-2 text-grey-7 text-weight-medium">数据安全</div>
                  <div class="col-10">符合《医疗卫生机构数据安全管理办法》</div>
                </div>
                <div class="row q-gutter-sm">
                  <q-btn
                    outline
                    color="grey-8"
                    icon="help"
                    label="用户手册"
                    :loading="infoActionLoading.manual"
                    @click="runInfoAction('manual')"
                  />
                  <q-btn
                    outline
                    color="grey-8"
                    icon="security"
                    label="隐私协议"
                    :loading="infoActionLoading.privacy"
                    @click="runInfoAction('privacy')"
                  />
                  <q-btn
                    outline
                    color="grey-8"
                    icon="update"
                    label="检查更新"
                    :loading="infoActionLoading.update"
                    @click="runInfoAction('update')"
                  />
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
import { useThemeStore } from 'stores/themeStore';
import * as echarts from 'echarts';
import { useAuthStore } from 'stores/authStore';
import { userAPI } from 'src/services/api';
import { HOSPITALS, DEPARTMENTS } from 'src/constants/hospitals';
import { setItem, STORAGE_KEYS } from 'src/utils/storage';
import { getImageUrl } from 'src/utils/mappers';
import EmailSecurityCard from 'src/components/settings/EmailSecurityCard.vue';

const $q = useQuasar();
const activeTab = ref('user_account');
const themeStore = useThemeStore();
const overviewHighlights = ref([
  {
    key: 'health',
    label: '系统健康度',
    value: '98.4%',
    trend: '较昨日 +1.2%',
    icon: 'monitor_heart',
    bgColor: 'green-1',
    iconColor: 'green-8',
    trendClass: 'text-positive',
  },
  {
    key: 'model',
    label: '模型服务状态',
    value: '稳定运行',
    trend: '平均延时 420ms',
    icon: 'memory',
    bgColor: 'blue-1',
    iconColor: 'primary',
    trendClass: 'text-primary',
  },
  {
    key: 'backup',
    label: '数据备份',
    value: '今日已完成',
    trend: '最近执行 02:00',
    icon: 'backup',
    bgColor: 'amber-1',
    iconColor: 'amber-9',
    trendClass: 'text-amber-9',
  },
  {
    key: 'risk',
    label: '高风险提醒',
    value: '12 条',
    trend: '待医生复核 3 条',
    icon: 'notification_important',
    bgColor: 'red-1',
    iconColor: 'negative',
    trendClass: 'text-negative',
  },
]);

// Auth Store
const authStore = useAuthStore();
const user = computed(() => authStore.user);
const currentUserDisplayName = computed(() => {
  return user.value?.real_name || user.value?.username || '当前用户';
});

// 获取当前用户所属医院
const currentHospital = computed(() => {
  if (!user.value?.hospital_id) return null;
  return HOSPITALS.find((h) => h.id === user.value?.hospital_id);
});

// 获取当前用户科室（从工号解析）
const currentDepartment = computed(() => {
  if (!user.value?.employee_id) return null;
  const deptCode = user.value.employee_id.substring(0, 2);
  return DEPARTMENTS.find((d) => d.code === deptCode);
});

// 格式化最后登录时间
const formattedLastLogin = computed(() => {
  if (!user.value?.last_login_at) return '-';
  return new Date(user.value.last_login_at).toLocaleString('zh-CN');
});

// 头像 URL
const avatarUrl = computed(() => {
  return getImageUrl(user.value?.avatar_url) || '';
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
      appendSystemLog('保存了用户基本资料', 'account');

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
  appendSystemLog('更换了登录邮箱', 'security');
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
      appendSystemLog('更新了用户头像', 'account');
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
      appendSystemLog('修改了账户密码', 'security');
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
const defaultSystemParams = {
  lowRiskThreshold: 0.3,
  highRiskThreshold: 0.7,
  includeSummary: true,
  includeFollowUp: true,
  requireReview: false,
  analysisMode: 'balanced',
  saveIntermediate: true,
  diagnosticStandard: 'who2020',
};

const params = ref({
  ...defaultSystemParams,
});

const modelActionLoading = ref({
  update: false,
  check: false,
  backup: false,
});

const paramsActionLoading = ref({
  save: false,
  reset: false,
});

const backupActionLoading = ref({
  full: false,
  caseOnly: false,
  restore: false,
});

const infoActionLoading = ref({
  manual: false,
  privacy: false,
  update: false,
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runModelAction = async (action: 'update' | 'check' | 'backup') => {
  modelActionLoading.value[action] = true;
  try {
    await wait(900);
    const actionTextMap = {
      update: '模型更新任务已提交',
      check: '已完成版本检查，当前为最新版本',
      backup: '模型备份已完成',
    };
    appendSystemLog(actionTextMap[action], 'model');
    $q.notify({
      type: 'positive',
      message: actionTextMap[action],
      position: 'top',
    });
  } finally {
    modelActionLoading.value[action] = false;
  }
};

const resetSystemParams = async () => {
  paramsActionLoading.value.reset = true;
  try {
    await wait(500);
    params.value = { ...defaultSystemParams };
    appendSystemLog('恢复了系统参数默认值', 'system');
    $q.notify({
      type: 'info',
      message: '系统参数已恢复默认值',
      position: 'top',
    });
  } finally {
    paramsActionLoading.value.reset = false;
  }
};

const saveSystemParams = async () => {
  paramsActionLoading.value.save = true;
  try {
    await wait(800);
    appendSystemLog('保存了系统参数配置', 'system');
    $q.notify({
      type: 'positive',
      message: '系统参数已保存',
      position: 'top',
    });
  } finally {
    paramsActionLoading.value.save = false;
  }
};

const runBackupAction = async (action: 'full' | 'caseOnly' | 'restore') => {
  if (action === 'restore' && !restoreFile.value) {
    $q.notify({
      type: 'warning',
      message: '请先选择恢复文件',
      position: 'top',
    });
    return;
  }

  backupActionLoading.value[action] = true;
  try {
    await wait(1200);
    const actionTextMap = {
      full: '完整备份任务已创建',
      caseOnly: '病例数据备份任务已创建',
      restore: '恢复验证通过，已进入恢复流程',
    };
    appendSystemLog(actionTextMap[action], 'backup');
    $q.notify({
      type: 'positive',
      message: actionTextMap[action],
      position: 'top',
    });
  } finally {
    backupActionLoading.value[action] = false;
  }
};

const runInfoAction = async (action: 'manual' | 'privacy' | 'update') => {
  infoActionLoading.value[action] = true;
  try {
    await wait(500);
    const actionTextMap = {
      manual: '已打开用户手册',
      privacy: '已打开隐私协议',
      update: '已完成版本检查',
    };
    appendSystemLog(actionTextMap[action], 'system');
    $q.notify({
      type: 'info',
      message: actionTextMap[action],
      position: 'top',
    });
  } finally {
    infoActionLoading.value[action] = false;
  }
};

// System Log
type SystemLogType = 'account' | 'model' | 'backup' | 'security' | 'system';
type SystemLogFilterType = 'all' | SystemLogType;

interface SystemLogItem {
  time: string;
  username: string;
  message: string;
  type: SystemLogType;
}

const systemLogs = ref<SystemLogItem[]>([]);
const logTypeFilter = ref<SystemLogFilterType>('all');
const logKeyword = ref('');
const logTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '账户', value: 'account' },
  { label: '模型', value: 'model' },
  { label: '备份', value: 'backup' },
  { label: '安全', value: 'security' },
  { label: '系统', value: 'system' },
];

const logTypeMetaMap: Record<
  SystemLogType,
  {
    label: string;
    icon: string;
    chipColor: string;
    chipTextColor: string;
    dotColor: string;
  }
> = {
  account: {
    label: '账户',
    icon: 'person',
    chipColor: 'blue-1',
    chipTextColor: 'primary',
    dotColor: '#2563eb',
  },
  model: {
    label: '模型',
    icon: 'memory',
    chipColor: 'indigo-1',
    chipTextColor: 'indigo-9',
    dotColor: '#4f46e5',
  },
  backup: {
    label: '备份',
    icon: 'storage',
    chipColor: 'teal-1',
    chipTextColor: 'teal-9',
    dotColor: '#0f766e',
  },
  security: {
    label: '安全',
    icon: 'security',
    chipColor: 'red-1',
    chipTextColor: 'negative',
    dotColor: '#dc2626',
  },
  system: {
    label: '系统',
    icon: 'settings',
    chipColor: 'grey-3',
    chipTextColor: 'grey-8',
    dotColor: '#475569',
  },
};

const getLogTypeMeta = (type: SystemLogType) => {
  return logTypeMetaMap[type];
};

const filteredSystemLogs = computed(() => {
  const keyword = logKeyword.value.trim().toLowerCase();

  return systemLogs.value.filter((log) => {
    const matchesType = logTypeFilter.value === 'all' || log.type === logTypeFilter.value;
    if (!matchesType) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return `${log.message} ${log.username}`.toLowerCase().includes(keyword);
  });
});

const formatLogTime = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const appendSystemLog = (message: string, type: SystemLogType = 'system', date = new Date()) => {
  systemLogs.value.unshift({
    time: formatLogTime(date),
    username: currentUserDisplayName.value,
    message,
    type,
  });
};

const initializeSystemLogs = () => {
  const now = Date.now();
  systemLogs.value = [
    {
      time: formatLogTime(new Date(now - 2 * 60 * 1000)),
      username: currentUserDisplayName.value,
      message: '登录后进入系统设置页面',
      type: 'system',
    },
    {
      time: formatLogTime(new Date(now - 15 * 60 * 1000)),
      username: currentUserDisplayName.value,
      message: '查看了系统参数配置',
      type: 'system',
    },
    {
      time: formatLogTime(new Date(now - 35 * 60 * 1000)),
      username: currentUserDisplayName.value,
      message: '查看了AI模型性能面板',
      type: 'model',
    },
    {
      time: formatLogTime(new Date(now - 60 * 60 * 1000)),
      username: currentUserDisplayName.value,
      message: '完成账户安全检查',
      type: 'security',
    },
  ];
};

const clearSystemLogs = () => {
  systemLogs.value = [];
  $q.notify({
    type: 'info',
    message: '系统日志已清空',
    position: 'top',
  });
};

const exportSystemLogs = () => {
  if (filteredSystemLogs.value.length === 0) {
    return;
  }

  const textContent = filteredSystemLogs.value
    .map(
      (item) =>
        `[${item.time}] [${item.username}] [${getLogTypeMeta(item.type).label}] ${item.message}`,
    )
    .join('\n');
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const fileName = `system-log-${new Date().toISOString().slice(0, 10)}.txt`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  $q.notify({
    type: 'positive',
    message: '系统日志导出成功',
    position: 'top',
  });
};

// Chart
const performanceChartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (performanceChartRef.value) {
    chartInstance = echarts.init(performanceChartRef.value);

    // 根据暗色模式设置颜色
    const isDark = themeStore.isDark;
    const axisColor = isDark ? '#475569' : '#cbd5e1';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const option = {
      color: ['#375A64', '#64748b'],
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['准确率', '召回率'],
        top: '5%',
        textStyle: { color: textColor },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['11-01', '11-08', '11-15', '11-22', '11-29', '12-06', '12-12'],
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: 'value',
        min: 0.85,
        max: 1.0,
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLabel: { color: textColor },
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

// 监听暗色模式变化，仅更新配色不重新初始化实例
watch(
  () => themeStore.isDark,
  () => {
    if (chartInstance && performanceChartRef.value) {
      // 根据暗色模式重新计算颜色
      const isDark = themeStore.isDark;
      const axisColor = isDark ? '#475569' : '#cbd5e1';
      const gridColor = isDark ? '#334155' : '#e2e8f0';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      chartInstance.setOption({
        legend: { textStyle: { color: textColor } },
        xAxis: {
          axisLine: { lineStyle: { color: axisColor } },
          axisLabel: { color: textColor },
        },
        yAxis: {
          splitLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: textColor },
        },
      });
    }
  },
);

onMounted(async () => {
  if (!authStore.hasInitialized) {
    authStore.initializeAuth();
  }

  await loadUserData();
  initializeSystemLogs();

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
  border-bottom: 1px solid var(--app-border-default);
}
.border-bottom-light {
  border-bottom: 1px solid var(--app-border-light);
}
.border-blue-2 {
  border: 1px solid var(--app-border-blue-2);
}
.font-mono {
  font-family: monospace;
}

.settings-hero {
  border-radius: var(--app-radius-xl);
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.overview-card {
  border-radius: var(--app-radius-lg);
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.settings-panels {
  border-radius: var(--app-radius-lg);
}

.settings-panels :deep(.q-tab-panel) {
  padding-top: 8px;
}

.rounded-control-panel :deep(.control-card) {
  border-radius: 22px;
}

.rounded-control-panel :deep(.control-card .q-card__section:first-child) {
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
}

.control-card {
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(241, 245, 249, 0.88));
}

.settings-page :deep(.q-card[flat][bordered]) {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: var(--app-radius-lg);
  transition: box-shadow 0.22s ease, border-color 0.22s ease;
}

.settings-page :deep(.q-card[flat][bordered]:hover) {
  border-color: rgba(59, 130, 246, 0.32);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.password-dialog-card {
  min-width: 420px;
}

.performance-chart {
  height: 300px;
}

.backup-time-select {
  width: 100px;
}

.system-log-scroll-area {
  height: 300px;
}

.log-entry {
  position: relative;
  align-items: flex-start;
  padding: 14px 16px 12px;
}

.log-entry__axis {
  min-width: 44px;
  position: relative;
  display: flex;
  justify-content: center;
}

.log-entry__axis::after {
  content: '';
  position: absolute;
  top: 30px;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: rgba(148, 163, 184, 0.32);
}

.log-entry:last-child .log-entry__axis::after {
  display: none;
}

.log-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
}

.log-message {
  line-height: 1.5;
}

.empty-log-state {
  height: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 卡片基础样式 */
.profile-card {
  border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border-default);
  background: var(--app-surface);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

/* 头像样式 */
.avatar-wrapper {
  box-shadow: var(--app-shadow-lg);
}

.avatar-wrapper img {
  object-fit: cover;
}

/* 信息项样式 */
.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-soft-divider);
}

.info-item:last-child {
  border-bottom: none;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--app-radius-md);
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
  color: var(--app-text-tertiary);
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

/* 统计盒子样式 */
.stat-box {
  padding: 20px;
  border-radius: var(--app-radius-md);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-secondary);
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
  color: var(--app-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-soft-divider);
}

.profile-form-label {
  font-size: 13px;
  color: var(--app-text-tertiary);
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 8px;
}

.profile-form-label__hint {
  font-weight: 500;
  color: var(--app-text-tertiary);
}

/* 表单输入框 */
.form-input {
  margin-bottom: 16px;
}

.form-input :deep(.q-field__control) {
  border-radius: var(--app-radius-md);
  min-height: 52px;
}

.form-input :deep(.q-field__native) {
  padding-top: 13px;
  padding-bottom: 13px;
}

.form-input-lg :deep(.q-field__control) {
  min-height: 56px;
}

.form-input-lg :deep(.q-field__native) {
  font-size: 15px;
  line-height: 1.45;
  padding-top: 14px;
  padding-bottom: 14px;
}

.form-input-lg :deep(.q-field__label) {
  font-size: 13px;
  font-weight: 500;
}

.profile-edit-input :deep(.q-field__control) {
  border-radius: 14px;
  padding: 0 12px;
}

.profile-edit-input :deep(.q-field__prepend) {
  align-self: center;
  padding-right: 10px;
}

.profile-edit-input :deep(.q-field__native) {
  align-self: center;
  padding-top: 0;
  padding-bottom: 0;
}

.profile-readonly-value {
  align-self: center;
  width: 100%;
  color: var(--app-text-primary);
  font-size: 1rem;
  line-height: 1.5;
}

.profile-contact-row :deep(.q-field__prepend) {
  padding-right: 8px;
}

/* 只读字段样式 */
.readonly-field :deep(.q-field__control) {
  background-color: var(--app-readonly-bg);
}

.readonly-field :deep(.q-field__control:before) {
  border-color: var(--app-readonly-border);
}

/* 表单操作按钮区域 */
.form-actions {
  border-top: 1px solid var(--app-soft-divider);
}

/* 安全设置列表 */
.security-list {
  margin: 0 -16px;
}

.security-item {
  padding: 16px;
  border-radius: var(--app-radius-md);
  margin: 0 8px;
}

.security-item:hover {
  background-color: var(--app-elevated-bg);
}

.security-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--app-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 密码对话框 */
.password-dialog {
  border-radius: var(--app-radius-xl);
}
</style>
