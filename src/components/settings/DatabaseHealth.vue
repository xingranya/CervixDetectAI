<template>
  <div class="database-health">
    <div class="row q-col-gutter-md q-mb-md">
      <!-- 关键指标卡片 -->
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">健康评分</div>
            <div class="text-h4 text-primary q-mt-sm">
              {{ metrics.healthScore }}
              <span class="text-caption text-grey-7">/ 100</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">QPS (查询/秒)</div>
            <div class="text-h4 q-mt-sm">{{ metrics.qps }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">平均响应时间</div>
            <div class="text-h4 q-mt-sm">
              {{ metrics.avgResponseTime }}
              <span class="text-caption text-grey-7">ms</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered :class="metrics.errorRate > 0 ? 'bg-red-1' : ''">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">错误率</div>
            <div class="text-h4 q-mt-sm" :class="metrics.errorRate > 0 ? 'text-negative' : ''">
              {{ metrics.errorRate }}%
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- 响应时间趋势图 -->
      <div class="col-md-8 col-xs-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">查询响应时间趋势</div>
          </q-card-section>
          <q-card-section>
            <div ref="chartRef" style="height: 300px"></div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 连接池状态 -->
      <div class="col-md-4 col-xs-12">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-h6">连接池状态</div>
          </q-card-section>
          <q-card-section>
            <q-list separator>
              <q-item>
                <q-item-section>总连接数</q-item-section>
                <q-item-section side>{{ metrics.poolStats?.size || 0 }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>空闲连接</q-item-section>
                <q-item-section side>{{ metrics.poolStats?.available || 0 }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>使用中连接</q-item-section>
                <q-item-section side>{{ metrics.poolStats?.borrowed || 0 }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>等待队列</q-item-section>
                <q-item-section side>
                  <q-badge :color="metrics.poolStats?.pending > 0 ? 'warning' : 'green'">
                    {{ metrics.poolStats?.pending || 0 }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 慢查询列表 -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-warning">
          <q-icon name="warning" />
          最近慢查询 (>100ms)
        </div>
      </q-card-section>
      <q-table
        :rows="metrics.slowQueries || []"
        :columns="slowQueryColumns"
        row-key="timestamp"
        flat
        :pagination="{ rowsPerPage: 5 }"
      >
        <template v-slot:body-cell-sql="props">
          <q-td :props="props">
            <div class="text-wrap" style="max-width: 500px; font-family: monospace">
              {{ props.value }}
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-timestamp="props">
          <q-td :props="props">
            {{ new Date(props.value).toLocaleTimeString() }}
          </q-td>
        </template>
      </q-table>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { api } from 'boot/axios';

const metrics = ref({
  healthScore: 100,
  qps: 0,
  avgResponseTime: 0,
  errorRate: 0,
  poolStats: { size: 0, available: 0, borrowed: 0, pending: 0 },
  slowQueries: [],
  queryTimeHistory: [],
});

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let timer: NodeJS.Timeout | null = null;

const slowQueryColumns = [
  { name: 'timestamp', label: '时间', field: 'timestamp', align: 'left' as const, sortable: true },
  {
    name: 'duration',
    label: '耗时 (ms)',
    field: 'duration',
    align: 'right' as const,
    sortable: true,
  },
  { name: 'sql', label: 'SQL语句', field: 'sql', align: 'left' as const },
];

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);
    updateChart();
  }
};

const updateChart = () => {
  if (!chartInstance) return;

  const history = metrics.value.queryTimeHistory || [];
  const times = history.map((h: { time: string }) => h.time);
  const durations = history.map((h: { duration: number }) => h.duration);

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: times,
    },
    yAxis: {
      type: 'value',
      name: '耗时 (ms)',
    },
    series: [
      {
        data: durations,
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3,
        },
        itemStyle: {
          color: '#375A64',
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  };

  chartInstance.setOption(option);
};

const fetchMetrics = async () => {
  try {
    const response = await api.get('/system/db-metrics');
    metrics.value = response.data;
    updateChart();
  } catch (error) {
    console.error('Failed to fetch DB metrics:', error);
  }
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  void fetchMetrics();
  timer = setInterval(() => {
    void fetchMetrics();
  }, 5000); // Refresh every 5s

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  chartInstance?.dispose();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  word-break: break-all;
}
</style>
