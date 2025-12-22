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
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-12">
            <q-card flat bordered class="full-height">
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="person" class="q-mr-sm text-grey-7" />
                  当前登录用户
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">姓名</div>
                  <div class="col-8">张明 (主治医师)</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col-4 text-grey-7 text-weight-medium">科室</div>
                  <div class="col-8">妇科</div>
                </div>
                <div class="row">
                  <div class="col-4 text-grey-7 text-weight-medium">最后登录</div>
                  <div class="col-8">2025-12-12 09:15:23</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-6 col-12">
            <q-card flat bordered class="full-height">
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="person_add" class="q-mr-sm text-grey-7" />
                  添加新用户
                </div>
              </q-card-section>
              <q-card-section>
                <q-input
                  dense
                  outlined
                  v-model="newUser.name"
                  placeholder="输入姓名"
                  class="q-mb-md"
                />
                <q-select
                  dense
                  outlined
                  v-model="newUser.role"
                  :options="roleOptions"
                  label="选择角色"
                  class="q-mb-md"
                />
                <div class="row q-gutter-sm">
                  <q-btn color="primary" icon="add" label="添加用户" />
                  <q-btn outline color="grey-8" icon="vpn_key" label="重置密码" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered>
              <q-card-section class="row items-center q-pb-sm border-bottom-light">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="group" class="q-mr-sm text-grey-7" />
                  用户列表
                </div>
              </q-card-section>
              <q-card-section class="q-pa-none">
                <q-table :rows="users" :columns="userColumns" row-key="id" flat>
                  <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                      <q-badge
                        :color="props.value === 'active' ? 'positive' : 'grey'"
                        :label="props.value === 'active' ? '活跃' : '未激活'"
                      />
                    </q-td>
                  </template>
                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                      <q-btn flat size="sm" label="编辑" color="primary" />
                    </q-td>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </div>
        </div>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const activeTab = ref('user_account');

// User Account
const newUser = ref({ name: '', role: '' });
const roleOptions = [
  { label: '系统管理员', value: 'admin' },
  { label: '高级医师', value: 'senior' },
  { label: '医师', value: 'doctor' },
  { label: '查看者', value: 'viewer' },
];
const users = ref([
  { id: 1, name: '李华', role: '系统管理员', status: 'active' },
  { id: 2, name: '王芳', role: '高级医师', status: 'active' },
  { id: 3, name: '刘伟', role: '医师', status: 'inactive' },
]);
const userColumns = [
  { name: 'name', label: '姓名', field: 'name', align: 'left' as const },
  { name: 'role', label: '角色', field: 'role', align: 'left' as const },
  { name: 'status', label: '状态', field: 'status', align: 'left' as const },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

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
</style>
