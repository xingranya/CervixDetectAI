<template>
  <q-page class="dashboard-page app-gradient-page">
    <!-- Page Header -->
    <div class="page-header q-mb-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-h4 text-weight-bold q-mb-xs">
            <q-icon name="dashboard" class="q-mr-sm" color="primary" />
            工作台
          </div>
          <div class="text-subtitle2 text-grey-7">{{ currentDate }} | 系统概览与快速入口</div>
        </div>
      </div>
    </div>

    <!-- Welcome Banner -->
    <q-card class="welcome-banner q-mb-md" flat>
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="col-auto">
            <div class="text-h5 text-weight-medium q-mb-xs">欢迎回来，{{ userName }}</div>
            <div class="text-body2">
              您有{{ pendingTasksCount }}项待处理任务，今日已完成{{
                completedTodayCount
              }}例影像分析。
            </div>
          </div>
          <div class="col-auto">
            <q-chip color="positive" text-color="white" icon="check_circle" class="status-chip">
              系统运行正常
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <!-- Left Column: Tasks and Stats -->
      <div class="col-lg-8 col-md-12">
        <!-- Pending Tasks -->
        <q-card flat bordered class="modern-card q-mb-md">
          <q-card-section class="card-header">
            <div class="row items-center justify-between">
              <div class="col-auto">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="history" class="q-mr-sm" />
                  历史任务
                </div>
              </div>
              <div class="col-auto">
                <q-btn flat dense no-caps color="primary" label="查看全部" to="/app/studies" />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div v-if="pendingTasks.length > 0" class="task-list">
              <div v-for="task in pendingTasks" :key="task.id" class="task-item">
                <div class="task-info">
                  <q-avatar size="48px" class="task-icon">
                    <q-icon :name="task.icon" size="24px" color="primary" />
                  </q-avatar>
                  <div class="task-details">
                    <div class="text-subtitle1 text-weight-medium">{{ task.title }}</div>
                    <div class="text-caption text-grey-7">{{ task.description }}</div>
                  </div>
                </div>
                <div class="task-meta">
                  <q-chip
                    :color="task.priority === 'high' ? 'red-1' : 'orange-1'"
                    :text-color="task.priority === 'high' ? 'red-9' : 'orange-9'"
                    dense
                    class="q-mr-sm"
                  >
                    {{ task.priority === 'high' ? '高优先级' : '中优先级' }}
                  </q-chip>
                  <span class="text-caption text-grey-7 q-mr-md">{{ task.estimatedTime }}</span>
                  <q-btn
                    color="primary"
                    unelevated
                    dense
                    no-caps
                    label="查看详情"
                    @click="handleTask(task)"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-center q-pa-lg text-grey-6">
              <q-icon name="inbox" size="48px" class="q-mb-md" />
              <div>暂无历史任务</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Analysis Stats -->
        <q-card flat bordered class="modern-card">
          <q-card-section class="card-header">
            <div class="row items-center justify-between">
              <div class="col-auto">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="bar_chart" class="q-mr-sm" />
                  分析统计概览
                </div>
              </div>
              <div class="col-auto">
                <q-btn-group flat dense>
                  <q-btn
                    :flat="activeStatsPeriod !== 'today'"
                    :unelevated="activeStatsPeriod === 'today'"
                    no-caps
                    label="今日"
                    @click="activeStatsPeriod = 'today'"
                    :color="activeStatsPeriod === 'today' ? 'primary' : 'grey-7'"
                  />
                  <q-btn
                    :flat="activeStatsPeriod !== 'week'"
                    :unelevated="activeStatsPeriod === 'week'"
                    no-caps
                    label="本周"
                    @click="activeStatsPeriod = 'week'"
                    :color="activeStatsPeriod === 'week' ? 'primary' : 'grey-7'"
                  />
                  <q-btn
                    :flat="activeStatsPeriod !== 'month'"
                    :unelevated="activeStatsPeriod === 'month'"
                    no-caps
                    label="本月"
                    @click="activeStatsPeriod = 'month'"
                    :color="activeStatsPeriod === 'month' ? 'primary' : 'grey-7'"
                  />
                </q-btn-group>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <!-- Stats Cards -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-md-4 col-sm-6 col-xs-12">
                <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-title">今日分析总数</span>
                    <q-icon name="trending_up" color="positive" size="20px" />
                  </div>
                  <div class="stat-value">100</div>
                  <div class="stat-trend positive">
                    <q-icon name="arrow_upward" size="14px" />
                    较昨日 +20%
                  </div>
                </div>
              </div>
              <div class="col-md-4 col-sm-6 col-xs-12">
                <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-title">高风险病例</span>
                    <q-icon name="warning" color="negative" size="20px" />
                  </div>
                  <div class="stat-value">15</div>
                  <div class="stat-trend neutral">占比 15%</div>
                </div>
              </div>
              <div class="col-md-4 col-sm-6 col-xs-12">
                <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-title">平均处理时长</span>
                    <q-icon name="schedule" color="grey-6" size="20px" />
                  </div>
                  <div class="stat-value">
                    1.8
                    <span class="stat-unit">分钟</span>
                  </div>
                  <div class="stat-trend positive">
                    <q-icon name="arrow_downward" size="14px" />
                    较上周 -1.2分钟
                  </div>
                </div>
              </div>
            </div>

            <!-- Chart -->
            <div ref="chartContainer" class="chart-container"></div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Quick Actions and Notices -->
      <div class="col-lg-4 col-md-12">
        <!-- Quick Actions -->
        <q-card flat bordered class="modern-card q-mb-md">
          <q-card-section class="card-header">
            <div class="text-h6 text-weight-bold">
              <q-icon name="bolt" class="q-mr-sm" />
              快速操作
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div class="quick-actions-grid">
              <div
                v-for="action in quickActions"
                :key="action.id"
                class="action-card"
                @click="handleQuickAction(action)"
              >
                <q-avatar size="56px" :color="action.color" text-color="white" class="q-mb-md">
                  <q-icon :name="action.icon" size="28px" />
                </q-avatar>
                <div class="text-subtitle2 text-weight-medium q-mb-xs">{{ action.title }}</div>
                <div class="text-caption text-grey-7">{{ action.description }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- System Notices -->
        <q-card flat bordered class="modern-card">
          <q-card-section class="card-header">
            <div class="text-h6 text-weight-bold">
              <q-icon name="campaign" class="q-mr-sm" />
              系统公告
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div class="notice-list">
              <div v-for="notice in systemNotices" :key="notice.id" class="notice-item">
                <div class="text-subtitle2 text-weight-medium q-mb-xs">{{ notice.title }}</div>
                <div class="text-body2 q-mb-sm">{{ notice.content }}</div>
                <div class="notice-meta">
                  <span class="text-caption text-grey-7">{{ notice.publisher }}</span>
                  <span class="text-caption text-grey-7">{{ notice.date }}</span>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { useStudyStore } from 'stores/studyStore';
import { useThemeStore } from 'stores/themeStore';
import { dashboardAPI } from 'src/services/api';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { Notify } from 'quasar';

interface Task {
  id: number; // 数据库主键ID
  taskId: string; // 任务唯一标识符
  studyId: number; // 病例数据库ID
  studyUniqueId: string; // 病例唯一标识符
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium';
  estimatedTime: string;
  status: string;
  patientName: string;
  patientId: string;
  createdAt: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

interface SystemNotice {
  id: string;
  title: string;
  content: string;
  publisher: string;
  date: string;
}

const router = useRouter();
const authStore = useAuthStore();
const studyStore = useStudyStore();
const themeStore = useThemeStore();

const chartContainer = ref<HTMLElement>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null;
const activeStatsPeriod = ref<'today' | 'week' | 'month'>('today');

// Computed properties
const userName = computed(() => {
  return authStore.currentUser?.real_name || authStore.currentUser?.username || '用户';
});

const currentDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});

const pendingTasksCount = computed(() => {
  // 统计实际的待处理任务数（PENDING和PROCESSING状态）
  return pendingTasks.value.filter(
    (task) => task.status === 'PENDING' || task.status === 'PROCESSING',
  ).length;
});

const completedTodayCount = computed(() => {
  return statsData.value.completedToday || 0;
});

// 数据加载状态
const loading = ref(false);

// Mock data - 待处理任务 (将被API数据替换)
const pendingTasks = ref<Task[]>([]);

// Stats data (从API获取)
const statsData = ref({
  todayTotal: 0,
  todayGrowth: 0,
  highRiskCount: 0,
  highRiskPercent: 0,
  avgProcessTime: 0,
  timeImprovement: 0,
  completedToday: 0,
  diagnosisStats: {} as Record<string, number>,
});

// Quick actions
const quickActions = ref<QuickAction[]>([
  {
    id: '1',
    title: '新建分析',
    description: '上传新影像开始智能分析',
    icon: 'add_circle',
    color: 'primary',
    route: '/app/upload',
  },
  {
    id: '2',
    title: '患者管理',
    description: '查看和管理患者档案信息',
    icon: 'people',
    color: 'secondary',
    route: '/app/patients',
  },
  {
    id: '3',
    title: '报告中心',
    description: '查看历史报告并管理下载记录',
    icon: 'description',
    color: 'accent',
    route: '/app/reports',
  },
  {
    id: '4',
    title: '病例列表',
    description: '管理病例数据和分析任务',
    icon: 'folder_open',
    color: 'teal',
    route: '/app/studies',
  },
]);

// System notices (从API获取)
const systemNotices = ref<SystemNotice[]>([]);

// 获取工作台统计数据
const fetchDashboardStats = async () => {
  try {
    loading.value = true;
    const response = await dashboardAPI.getStats(activeStatsPeriod.value);
    if (response.success) {
      statsData.value = response.data;
      // 更新图表数据
      updateChartData();
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    Notify.create({
      type: 'negative',
      message: '获取统计数据失败',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

// 获取待处理任务
const fetchPendingTasks = async () => {
  try {
    console.log('【前端】开始获取历史任务...');
    const response = await dashboardAPI.getPendingTasks();
    console.log('【前端】API响应:', response);

    if (response.success) {
      pendingTasks.value = response.data.tasks;
      console.log('【前端】历史任务数量:', pendingTasks.value.length);
      if (pendingTasks.value.length > 0) {
        console.log('【前端】第一条任务:', pendingTasks.value[0]);
      } else {
        console.warn('【前端】历史任务列表为空');
      }
    } else {
      pendingTasks.value = [];
      console.error('【前端】API返回失败:', response);
      Notify.create({
        type: 'warning',
        message: response.message || response.error || '获取历史任务失败',
        position: 'top',
      });
    }
  } catch (error) {
    pendingTasks.value = [];
    console.error('【前端】获取待处理任务失败:', error);
    Notify.create({
      type: 'negative',
      message: '获取历史任务失败，请检查网络连接',
      position: 'top',
    });
  }
};

// 获取系统公告
const fetchSystemNotices = async () => {
  try {
    const response = await dashboardAPI.getNotices();
    if (response.success) {
      systemNotices.value = response.data.notices;
    }
  } catch (error) {
    console.error('获取系统公告失败:', error);
  }
};

// Event handlers
const handleTask = (task: Task) => {
  // 使用studyId跳转到病例详情页
  console.log('点击任务:', {
    taskId: task.id,
    studyId: task.studyId,
    studyUniqueId: task.studyUniqueId,
    patientName: task.patientName,
  });
  void router.push(`/app/studies/${task.studyId}`);
};

const handleQuickAction = (action: QuickAction) => {
  void router.push(action.route);
};

// Initialize chart
const initChart = () => {
  if (!chartContainer.value) return;

  chartInstance = echarts.init(chartContainer.value);
  updateChartData();

  // Handle resize
  const handleResize = () => {
    chartInstance?.resize();
  };
  window.addEventListener('resize', handleResize);
};

// 更新图表数据
const updateChartData = () => {
  if (!chartInstance) return;

  const diagnosisStats = statsData.value.diagnosisStats || {};

  // 诊断分类配置（统一管理关键词、标准化名称和颜色）
  const DIAGNOSIS_CONFIG = [
    { keywords: ['阴性', 'Normal', 'NILM', '正常'], normalized: '阴性/Normal', color: '#86efac' },
    { keywords: ['ASC-US', 'ASCUS', '意义不明确的不典型'], normalized: 'ASC-US', color: '#fde047' },
    {
      keywords: ['LSIL', '低度鳞状上皮内病变', '低度病变', '低度'],
      normalized: 'LSIL',
      color: '#fdba74',
    },
    {
      keywords: ['HSIL', '高度鳞状上皮内病变', '高度病变', '高度'],
      normalized: 'HSIL',
      color: '#f87171',
    },
    { keywords: ['SCC', '癌', '鳞状细胞癌', '浸润性'], normalized: '可疑癌/SCC', color: '#dc2626' },
  ] as const;

  // 查找匹配的诊断配置
  const findDiagnosisConfig = (name: string) =>
    DIAGNOSIS_CONFIG.find((config) => config.keywords.some((kw) => name.includes(kw)));

  // 标准化诊断名称
  const normalizeDiagnosisName = (name: string): string =>
    findDiagnosisConfig(name)?.normalized || name;

  // 获取诊断颜色
  const getDiagnosisColor = (name: string): string => findDiagnosisConfig(name)?.color || '#86efac';

  // 标准化并合并诊断统计数据
  const normalizedStats: Record<string, number> = {};
  Object.entries(diagnosisStats).forEach(([name, value]) => {
    const normalizedName = normalizeDiagnosisName(name);
    normalizedStats[normalizedName] = (normalizedStats[normalizedName] || 0) + Number(value);
  });

  // 转换为图表数据格式
  const chartData = Object.entries(normalizedStats).map(([name, value]) => ({
    value,
    name,
    itemStyle: { color: getDiagnosisColor(name) },
  }));

  // 如果没有数据，使用默认数据
  const finalChartData =
    chartData.length > 0
      ? chartData
      : [
          { value: 45, name: '阴性/Normal', itemStyle: { color: '#86efac' } },
          { value: 25, name: 'ASC-US', itemStyle: { color: '#fde047' } },
          { value: 15, name: 'LSIL', itemStyle: { color: '#fdba74' } },
          { value: 10, name: 'HSIL', itemStyle: { color: '#f87171' } },
          { value: 5, name: '可疑癌/SCC', itemStyle: { color: '#dc2626' } },
        ];

  const isDark = themeStore.isDark;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}例 ({d}%)',
      ...(isDark && {
        backgroundColor: '#1e1e1e',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
      }),
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: finalChartData.map((item) => item.name),
      ...(isDark && { textStyle: { color: '#94a3b8' } }),
    },
    series: [
      {
        name: '风险分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? '#1e293b' : '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          color: isDark ? '#e2e8f0' : '#64748b',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#94a3b8' : '#cbd5e1',
          },
        },
        data: finalChartData,
      },
    ],
  };

  chartInstance.setOption(option);
};

// 监听暗色模式变化，重新渲染图表
watch(
  () => themeStore.isDark,
  () => {
    updateChartData();
  },
);

// 监听时间周期变化，重新获取数据
watch(activeStatsPeriod, () => {
  void fetchDashboardStats();
});

// Lifecycle hooks
onMounted(async () => {
  if (authStore.isAuthenticated) {
    // 并行加载所有数据
    await Promise.all([
      studyStore.fetchStudies(),
      fetchDashboardStats(),
      fetchPendingTasks(),
      fetchSystemNotices(),
    ]);
  }

  // Initialize chart after a short delay to ensure DOM is ready
  setTimeout(() => {
    initChart();
  }, 100);
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped lang="scss">
.dashboard-page {
  background: var(--app-dashboard-page-bg);
  min-height: calc(100vh - 64px);
  padding: 24px 32px;
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-default);
}

// Welcome Banner
.welcome-banner {
  background: var(--app-glass-bg-light);
  border: 1px solid var(--app-glass-border-light);
  border-radius: var(--app-radius-lg);
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  color: #0c4a6e;
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);

  &:hover {
    box-shadow: var(--app-shadow-lg);
    transform: translateY(-2px);
  }

  .status-chip {
    font-weight: 500;
  }
}

// Modern Card Style
.modern-card {
  background: var(--app-surface);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-md);
  border: 1px solid var(--app-border-default);
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);

  &:hover {
    box-shadow: var(--app-shadow-lg);
    transform: translateY(-2px);
  }

  .card-header {
    padding: 20px 24px 12px;
    border-bottom: 1px solid var(--app-border-light);
  }
}

// Task List
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--app-border-default);
  border-radius: var(--app-radius-md);
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);
  background-color: var(--app-elevated-bg);

  &:hover {
    border-color: var(--app-field-border-hover);
    background-color: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  background-color: var(--app-surface);
  border: 1px solid var(--app-border-default);
}

.task-details {
  flex: 1;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

// Stats Cards
.stat-card {
  background: var(--app-elevated-bg);
  border-radius: var(--app-radius-md);
  padding: 20px;
  border: 1px solid var(--app-border-default);
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);

  &:hover {
    background: var(--app-surface);
    box-shadow: var(--app-shadow-md);
  }
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-title {
  font-size: 14px;
  color: var(--app-text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text-primary);
  margin-bottom: 8px;
}

.stat-unit {
  font-size: 16px;
  color: var(--app-text-secondary);
  font-weight: 400;
}

.stat-trend {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;

  &.positive {
    color: #166534;
  }

  &.negative {
    color: #991b1b;
  }

  &.neutral {
    color: #64748b;
  }
}

// Chart Container
.chart-container {
  height: 300px;
  width: 100%;
  margin-top: 16px;
}

// Quick Actions Grid
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  border: 1px solid var(--app-border-default);
  border-radius: var(--app-radius-md);
  padding: 20px;
  text-align: center;
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);
  cursor: pointer;
  background-color: var(--app-elevated-bg);

  &:hover {
    border-color: var(--q-primary);
    background-color: var(--app-surface);
    box-shadow: var(--app-shadow-md);
    transform: translateY(-2px);
  }
}

// Notice List
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-item {
  padding: 16px;
  border-left: 4px solid var(--q-primary);
  background-color: var(--app-elevated-bg);
  border-radius: 0 var(--app-radius-md) var(--app-radius-md) 0;
  border-top: 1px solid var(--app-border-default);
  border-right: 1px solid var(--app-border-default);
  border-bottom: 1px solid var(--app-border-default);
  transition:
    transform var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default),
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default);

  &:hover {
    background-color: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }
}

.notice-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

// Responsive Design
@media (max-width: 1200px) {
  .dashboard-page {
    padding: 16px;
  }

  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .task-meta {
    width: 100%;
    flex-wrap: wrap;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- 暗色模式适配：必须用非 scoped 样式块，否则 :global() 优先级低于 scoped 原始规则 -->
<style lang="scss">
body.body--dark {
  .dashboard-page {
    background: var(--app-dashboard-page-bg);
  }

  .page-header {
    border-bottom-color: var(--app-border-default);
  }

  .welcome-banner {
    background: var(--app-glass-bg);
    border-color: var(--app-glass-border);
    color: var(--app-text-primary);
    backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
    -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  }

  .modern-card {
    background: var(--app-surface);
    border-color: var(--app-border-default);
    box-shadow: var(--app-shadow-md);

    &:hover {
      box-shadow: var(--app-shadow-lg);
    }

    .card-header {
      border-bottom-color: var(--app-soft-divider);
    }
  }

  .stat-card {
    background: var(--app-elevated-bg);
    border-color: var(--app-border-default);

    &:hover {
      background: var(--app-elevated-hover-bg);
    }
  }

  .stat-value {
    color: var(--app-text-primary);
  }

  .stat-title,
  .stat-unit {
    color: var(--app-text-secondary);
  }

  .stat-trend {
    &.positive {
      color: var(--app-diagnosis-normal);
    }

    &.negative {
      color: var(--app-trend-negative);
    }

    &.neutral {
      color: var(--app-text-secondary);
    }
  }

  .task-item {
    border-color: var(--app-border-default);
    background-color: var(--app-elevated-bg);

    &:hover {
      border-color: var(--app-border-dashed);
      background-color: var(--app-elevated-hover-bg);
    }
  }

  .task-icon {
    background-color: var(--app-surface);
    border-color: var(--app-border-default);
  }

  .action-card {
    border-color: var(--app-border-default);
    background-color: var(--app-elevated-bg);

    &:hover {
      border-color: var(--q-primary);
      background-color: var(--app-elevated-hover-bg);
    }
  }

  .notice-item {
    background-color: var(--app-elevated-bg);
    border-top-color: var(--app-border-default);
    border-right-color: var(--app-border-default);
    border-bottom-color: var(--app-border-default);

    &:hover {
      background-color: var(--app-elevated-hover-bg);
    }
  }

  .notice-meta {
    .text-grey-7 {
      color: var(--app-text-grey-7) !important;
    }
  }
}
</style>
