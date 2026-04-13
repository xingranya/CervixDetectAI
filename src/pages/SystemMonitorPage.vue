<template>
  <q-page class="system-monitor-page app-gradient-page">
    <!-- 页面标题 -->
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h4 text-weight-bold q-mb-xs">
            <q-icon name="monitor_heart" class="q-mr-sm" color="primary" />
            系统监控
          </div>
          <div class="text-subtitle2 text-grey-7">实时性能指标与操作审计</div>
        </div>
        <div class="col-auto">
          <q-chip :color="autoRefreshEnabled ? 'positive' : 'grey'" text-color="white" icon="autorenew">
            {{ autoRefreshEnabled ? '自动刷新中' : '已暂停' }}
          </q-chip>
          <q-btn flat dense icon="refresh" class="q-ml-sm" @click="fetchAll" :loading="loadingMonitor">
            <q-tooltip>手动刷新</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- 实时指标卡片 -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <q-card flat bordered class="modern-card metric-card">
          <q-card-section>
            <div class="metric-header">
              <q-icon name="memory" size="28px" color="blue-7" />
              <span class="metric-label">CPU 负载</span>
            </div>
            <div class="metric-value">{{ monitorData.cpu?.loadAvg?.[0]?.toFixed(2) ?? '--' }}</div>
            <div class="metric-sub text-grey-7">
              1m / 5m / 15m:
              {{ (monitorData.cpu?.loadAvg || []).map((v: number) => v.toFixed(2)).join(' / ') || '--' }}
              <br />{{ monitorData.cpu?.count ?? 0 }} 核心
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <q-card flat bordered class="modern-card metric-card">
          <q-card-section>
            <div class="metric-header">
              <q-icon name="sd_card" size="28px" color="orange-7" />
              <span class="metric-label">内存使用</span>
            </div>
            <div class="metric-value">{{ monitorData.memory?.usagePercent ?? '--' }}%</div>
            <q-linear-progress
              :value="Number(monitorData.memory?.usagePercent || 0) / 100"
              color="orange-7"
              class="q-mt-sm"
              rounded
              size="8px"
            />
            <div class="metric-sub text-grey-7 q-mt-xs">
              {{ formatBytes(monitorData.memory?.used) }} / {{ formatBytes(monitorData.memory?.total) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <q-card flat bordered class="modern-card metric-card">
          <q-card-section>
            <div class="metric-header">
              <q-icon name="storage" size="28px" color="green-7" />
              <span class="metric-label">数据库连接池</span>
            </div>
            <div class="metric-value">{{ monitorData.database?.size ?? 0 }}</div>
            <div class="metric-sub text-grey-7">
              可用 {{ monitorData.database?.available ?? 0 }} / 等待 {{ monitorData.database?.pending ?? 0 }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <q-card flat bordered class="modern-card metric-card">
          <q-card-section>
            <div class="metric-header">
              <q-icon name="science" size="28px" color="purple-7" />
              <span class="metric-label">分析队列</span>
            </div>
            <div class="metric-value">{{ monitorData.analysisQueue?.running ?? 0 }}</div>
            <div class="metric-sub text-grey-7">
              等待 {{ monitorData.analysisQueue?.waiting ?? 0 }} /
              并发上限 {{ monitorData.analysisQueue?.concurrency ?? 3 }}
            </div>
            <div class="metric-sub text-grey-6 q-mt-xs">
              运行时间 {{ formatUptime(monitorData.uptime) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- 请求量趋势图 -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered class="modern-card">
          <q-card-section class="card-header">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">
                <q-icon name="bar_chart" class="q-mr-sm" />
                请求量趋势
              </div>
              <q-btn-group flat dense>
                <q-btn
                  v-for="opt in historyOptions"
                  :key="opt.value"
                  :flat="historyHours !== opt.value"
                  :unelevated="historyHours === opt.value"
                  no-caps
                  :label="opt.label"
                  :color="historyHours === opt.value ? 'primary' : 'grey-7'"
                  @click="changeHistoryHours(opt.value)"
                />
              </q-btn-group>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div ref="barChartRef" class="chart-container"></div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 操作类型分布 -->
      <div class="col-lg-4 col-md-12">
        <q-card flat bordered class="modern-card">
          <q-card-section class="card-header">
            <div class="text-h6 text-weight-bold">
              <q-icon name="pie_chart" class="q-mr-sm" />
              操作类型分布
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div ref="pieChartRef" class="chart-container"></div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 审计日志表格 -->
    <q-card flat bordered class="modern-card">
      <q-card-section class="card-header">
        <div class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            <q-icon name="list_alt" class="q-mr-sm" />
            操作日志
          </div>
          <q-btn flat dense no-caps color="primary" icon="download" label="导出CSV" @click="exportCsv" />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <!-- 筛选栏 -->
        <div class="row q-pa-md q-col-gutter-sm items-end">
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              v-model="filters.action"
              :options="actionOptions"
              label="操作类型"
              clearable
              dense
              outlined
              emit-value
              map-options
            />
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-input v-model="filters.keyword" label="关键词搜索" dense outlined clearable>
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-input v-model="filters.date_from" label="开始日期" type="date" dense outlined />
          </div>
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-input v-model="filters.date_to" label="结束日期" type="date" dense outlined />
          </div>
          <div class="col-auto">
            <q-btn unelevated color="primary" no-caps label="查询" @click="fetchLogs(1)" />
          </div>
        </div>

        <q-table
          :rows="auditLogs"
          :columns="logColumns"
          row-key="id"
          flat
          :loading="loadingLogs"
          :pagination="tablePagination"
          @request="onTableRequest"
        >
          <template #body-cell-user="props">
            <q-td :props="props">
              {{ props.row.user?.real_name || props.row.user?.username || (props.row.user_id ? `#${props.row.user_id}` : '系统') }}
            </q-td>
          </template>
          <template #body-cell-action="props">
            <q-td :props="props">
              <q-badge :color="getActionColor(props.row.action)" :label="props.row.action" />
            </q-td>
          </template>
          <template #body-cell-details="props">
            <q-td :props="props">
              <span v-if="props.row.details" class="text-caption">
                {{ JSON.stringify(props.row.details).slice(0, 80) }}
                <span v-if="JSON.stringify(props.row.details).length > 80">...</span>
              </span>
              <span v-else class="text-grey-5">-</span>
            </q-td>
          </template>
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useThemeStore } from 'stores/themeStore';
import { systemAPI } from 'src/services/api';
import * as echarts from 'echarts';
import type { QTableProps } from 'quasar';

// ======================== 类型 ========================

interface MonitorData {
  cpu?: { loadAvg: number[]; count: number };
  memory?: { total: number; free: number; used: number; usagePercent: string; process: { rss: number; heapTotal: number; heapUsed: number } };
  database?: { size: number; available: number; pending: number };
  analysisQueue?: { running: number; waiting: number; concurrency: number };
  uptime?: number;
  timestamp?: string;
}

interface HourlyItem { hour: string; count: number }
interface ActionItem { action: string; count: number }

// ======================== 状态 ========================

const themeStore = useThemeStore();
const monitorData = ref<MonitorData>({});
const loadingMonitor = ref(false);
const loadingLogs = ref(false);
const autoRefreshEnabled = ref(true);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 图表
const barChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let barChart: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pieChart: any = null;

const historyHours = ref(24);
const historyOptions = [
  { label: '24h', value: 24 },
  { label: '7d', value: 168 },
  { label: '30d', value: 720 },
];
const hourlyStats = ref<HourlyItem[]>([]);
const actionStats = ref<ActionItem[]>([]);

// 审计日志
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auditLogs = ref<any[]>([]);
const filters = ref({
  action: null as string | null,
  keyword: '',
  date_from: '',
  date_to: '',
});
const tablePagination = ref({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true,
});

const actionOptions = [
  { label: '登录', value: 'LOGIN' },
  { label: '登出', value: 'LOGOUT' },
  { label: '创建患者', value: 'CREATE_PATIENT' },
  { label: '更新患者', value: 'UPDATE_PATIENT' },
  { label: '删除患者', value: 'DELETE_PATIENT' },
  { label: '创建病例', value: 'CREATE_STUDY' },
  { label: '上传影像', value: 'UPLOAD_IMAGE' },
  { label: '创建分析', value: 'CREATE_ANALYSIS' },
  { label: '创建随访', value: 'CREATE_FOLLOWUP' },
  { label: '完成随访', value: 'COMPLETE_FOLLOWUP' },
];

const logColumns: QTableProps['columns'] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', style: 'width: 60px' },
  { name: 'created_at', label: '时间', field: 'created_at', align: 'left', style: 'width: 160px' },
  { name: 'user', label: '用户', field: 'user', align: 'left', style: 'width: 120px' },
  { name: 'action', label: '操作', field: 'action', align: 'left', style: 'width: 140px' },
  { name: 'resource_type', label: '资源类型', field: 'resource_type', align: 'left', style: 'width: 100px' },
  { name: 'resource_id', label: '资源ID', field: 'resource_id', align: 'left', style: 'width: 80px' },
  { name: 'ip_address', label: 'IP', field: 'ip_address', align: 'left', style: 'width: 130px' },
  { name: 'details', label: '详情', field: 'details', align: 'left' },
];

// ======================== 工具函数 ========================

function formatBytes(bytes?: number): string {
  if (!bytes) return '--';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds?: number): string {
  if (!seconds) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}天`);
  if (h) parts.push(`${h}时`);
  parts.push(`${m}分`);
  return parts.join('');
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN');
}

function getActionColor(action: string): string {
  const map: Record<string, string> = {
    LOGIN: 'blue', LOGOUT: 'grey', CREATE_PATIENT: 'teal', UPDATE_PATIENT: 'orange',
    DELETE_PATIENT: 'red', CREATE_STUDY: 'indigo', UPLOAD_IMAGE: 'cyan',
    CREATE_ANALYSIS: 'purple', CREATE_FOLLOWUP: 'green', COMPLETE_FOLLOWUP: 'positive',
  };
  return map[action] || 'grey-7';
}

// ======================== 数据获取 ========================

async function fetchMonitor() {
  try {
    loadingMonitor.value = true;
    const res = await systemAPI.monitor();
    if (res.data?.success) {
      monitorData.value = res.data.data;
    }
  } catch (e) {
    console.error('获取监控数据失败:', e);
  } finally {
    loadingMonitor.value = false;
  }
}

async function fetchHistory() {
  try {
    const res = await systemAPI.monitorHistory(historyHours.value);
    if (res.data?.success) {
      hourlyStats.value = res.data.data.hourlyStats || [];
      actionStats.value = res.data.data.actionStats || [];
      await nextTick();
      renderBarChart();
      renderPieChart();
    }
  } catch (e) {
    console.error('获取历史数据失败:', e);
  }
}

async function fetchLogs(page = 1) {
  try {
    loadingLogs.value = true;
    const params: Record<string, unknown> = {
      page,
      limit: tablePagination.value.rowsPerPage,
    };
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.keyword) params.keyword = filters.value.keyword;
    if (filters.value.date_from) params.date_from = filters.value.date_from;
    if (filters.value.date_to) params.date_to = filters.value.date_to;

    const res = await systemAPI.auditLogs(params);
    if (res.data?.success) {
      auditLogs.value = res.data.data.logs;
      tablePagination.value.page = res.data.data.pagination.page;
      tablePagination.value.rowsNumber = res.data.data.pagination.total;
    }
  } catch (e) {
    console.error('获取审计日志失败:', e);
  } finally {
    loadingLogs.value = false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onTableRequest(props: any) {
  void fetchLogs(props.pagination.page);
}

async function exportCsv() {
  try {
    const params: Record<string, unknown> = {};
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.date_from) params.date_from = filters.value.date_from;
    if (filters.value.date_to) params.date_to = filters.value.date_to;

    const res = await systemAPI.auditExport(params);
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data as string], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('导出失败:', e);
  }
}

async function fetchAll() {
  await Promise.all([fetchMonitor(), fetchHistory(), fetchLogs(tablePagination.value.page)]);
}

function changeHistoryHours(h: number) {
  historyHours.value = h;
  void fetchHistory();
}

// ======================== 图表渲染 ========================

function renderBarChart() {
  if (!barChartRef.value) return;
  if (!barChart) barChart = echarts.init(barChartRef.value);

  const isDark = themeStore.isDark;
  const xData = hourlyStats.value.map((i) => {
    // 只保留小时部分方便展示
    const parts = i.hour?.split(' ');
    return parts && parts.length > 1 ? parts[1] : i.hour;
  });
  const yData = hourlyStats.value.map((i) => Number(i.count));

  barChart.setOption({
    tooltip: {
      trigger: 'axis',
      ...(isDark && { backgroundColor: '#1e1e1e', borderColor: '#334155', textStyle: { color: '#e2e8f0' } }),
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', rotate: xData.length > 30 ? 45 : 0 },
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
    },
    series: [{
      data: yData,
      type: 'bar',
      itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 28,
    }],
  }, true);
}

function renderPieChart() {
  if (!pieChartRef.value) return;
  if (!pieChart) pieChart = echarts.init(pieChartRef.value);

  const isDark = themeStore.isDark;
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];
  const data = actionStats.value.map((i, idx) => ({
    value: Number(i.count),
    name: i.action,
    itemStyle: { color: colors[idx % colors.length] },
  }));

  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      ...(isDark && { backgroundColor: '#1e1e1e', borderColor: '#334155', textStyle: { color: '#e2e8f0' } }),
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    series: [{
      type: 'pie',
      radius: ['36%', '66%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: data.length > 0 ? data : [{ value: 1, name: '暂无数据', itemStyle: { color: '#e2e8f0' } }],
    }],
  }, true);
}

function handleResize() {
  barChart?.resize();
  pieChart?.resize();
}

// ======================== 生命周期 ========================

watch(() => themeStore.isDark, () => {
  renderBarChart();
  renderPieChart();
});

onMounted(async () => {
  await fetchAll();
  // 初始化图表（等待 DOM 就绪）
  setTimeout(() => {
    renderBarChart();
    renderPieChart();
    window.addEventListener('resize', handleResize);
  }, 150);
  // 自动刷新实时指标，每 30 秒
  refreshTimer = setInterval(() => {
    if (autoRefreshEnabled.value) {
      void fetchMonitor();
    }
  }, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  window.removeEventListener('resize', handleResize);
  barChart?.dispose();
  pieChart?.dispose();
  barChart = null;
  pieChart = null;
});
</script>

<style scoped lang="scss">
.system-monitor-page {
  padding: 24px 32px;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-default);
}

.modern-card {
  background: var(--app-surface);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-md);
  border: 1px solid var(--app-border-default);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover { box-shadow: var(--app-shadow-lg); transform: translateY(-2px); }
  .card-header { padding: 20px 24px 12px; border-bottom: 1px solid var(--app-border-light); }
}

.metric-card {
  .metric-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .metric-label { font-size: 14px; color: var(--app-text-secondary); font-weight: 500; }
  .metric-value { font-size: 32px; font-weight: 700; color: var(--app-text-primary); line-height: 1.1; }
  .metric-sub { font-size: 12px; margin-top: 6px; }
}

.chart-container { height: 300px; width: 100%; }

@media (max-width: 1200px) {
  .system-monitor-page { padding: 16px; }
}
</style>

<!-- 暗色模式适配 -->
<style lang="scss">
body.body--dark {
  .system-monitor-page {
    .modern-card {
      background: var(--app-surface);
      border-color: var(--app-border-default);
    }
    .metric-card {
      .metric-value { color: var(--app-text-primary); }
      .metric-label { color: var(--app-text-secondary); }
    }
  }
}
</style>
