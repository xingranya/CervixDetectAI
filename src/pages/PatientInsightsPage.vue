<template>
  <q-page class="q-pa-md app-gradient-page patient-insights-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-auto">
        <q-btn flat round icon="arrow_back" color="grey-8" @click="goBack">
          <q-tooltip>返回患者列表</q-tooltip>
        </q-btn>
      </div>
      <div class="col">
        <div class="text-h5">患者洞察中心</div>
        <div class="text-subtitle2 text-grey-7">
          {{ overview?.patient?.name || '-' }}（{{ overview?.patient?.patient_id || '-' }}）
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="refresh"
          label="刷新"
          no-caps
          :loading="isLoading"
          @click="loadInitialData"
        />
      </div>
    </div>

    <q-banner v-if="!isValidPatientId" class="bg-red-1 text-negative q-mb-md rounded-borders">
      患者 ID 参数无效，无法加载洞察数据。
    </q-banner>

    <template v-else>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-2 col-md-4 col-sm-6 col-xs-12">
          <q-card flat bordered class="summary-card insight-card">
            <q-card-section>
              <div class="text-caption text-grey-7">病例总数</div>
              <div class="text-h5 text-weight-bold">{{ overview?.summary.total_studies ?? 0 }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6 col-xs-12">
          <q-card flat bordered class="summary-card insight-card">
            <q-card-section>
              <div class="text-caption text-grey-7">分析次数</div>
              <div class="text-h5 text-weight-bold">{{ overview?.summary.total_analyses ?? 0 }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6 col-xs-12">
          <q-card flat bordered class="summary-card insight-card">
            <q-card-section>
              <div class="text-caption text-grey-7">高风险次数</div>
              <div class="text-h5 text-weight-bold text-negative">
                {{ overview?.summary.high_risk_analyses ?? 0 }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
          <q-card flat bordered class="summary-card insight-card">
            <q-card-section>
              <div class="text-caption text-grey-7">待执行随访</div>
              <div class="text-h5 text-weight-bold">{{ overview?.summary.pending_followups ?? 0 }}</div>
              <div class="text-caption text-negative">
                逾期 {{ overview?.summary.overdue_followups ?? 0 }} 条
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-12 col-xs-12">
          <q-card flat bordered class="summary-card insight-card">
            <q-card-section>
              <div class="text-caption text-grey-7">当前风险等级</div>
              <div class="row items-center q-gutter-sm q-mt-xs">
                <q-chip
                  :color="getRiskColor(overview?.risk_profile.level)"
                  text-color="white"
                  dense
                  class="text-weight-bold"
                >
                  {{ getRiskLabel(overview?.risk_profile.level) }}
                </q-chip>
                <span class="text-body2 text-grey-8">
                  评分 {{ riskProfile?.score ?? overview?.risk_profile.score ?? 0 }}
                </span>
              </div>
              <div class="text-caption q-mt-xs" :class="getTrendTextClass(overview?.risk_profile.trend)">
                趋势：{{ getTrendLabel(overview?.risk_profile.trend) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-5 col-12">
          <q-card flat bordered class="insight-card">
            <q-card-section class="row items-center">
              <div class="text-subtitle1 text-weight-medium">F9 患者风险画像</div>
              <q-space />
              <q-btn
                flat
                dense
                icon="restart_alt"
                color="primary"
                :loading="loading.riskProfile"
                @click="refreshRiskProfile"
              >
                <q-tooltip>刷新风险画像</q-tooltip>
              </q-btn>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <div class="risk-gauge-shell">
                    <q-circular-progress
                      rounded
                      show-value
                      :value="riskProfile?.score || 0"
                      size="122px"
                      :thickness="0.24"
                      :color="getRiskColor(riskProfile?.level)"
                      track-color="grey-3"
                      class="text-weight-bold risk-gauge"
                    >
                      {{ riskProfile?.score || 0 }}
                    </q-circular-progress>
                  </div>
                </div>
                <div class="col">
                  <div class="text-body1 text-weight-bold">
                    等级：{{ getRiskLabel(riskProfile?.level) }}
                  </div>
                  <div class="text-body2 q-mt-xs" :class="getTrendTextClass(riskProfile?.trend)">
                    趋势：{{ getTrendLabel(riskProfile?.trend) }}
                  </div>
                  <div class="text-caption text-grey-7 q-mt-sm">
                    高风险占比：{{ formatPercent(riskProfile?.metrics.high_risk_ratio) }}
                  </div>
                  <div class="text-caption text-grey-7">
                    最近分析：{{ formatDateTime(riskProfile?.metrics.latest_analysis_at) }}
                  </div>
                </div>
              </div>
              <div class="q-mt-md">
                <div class="text-body2 text-weight-medium q-mb-sm">建议</div>
                <q-list dense bordered separator>
                  <q-item v-for="(item, idx) in riskProfile?.suggestions || []" :key="`suggest-${idx}`">
                    <q-item-section avatar>
                      <q-icon name="check_circle" color="primary" />
                    </q-item-section>
                    <q-item-section>{{ item }}</q-item-section>
                  </q-item>
                  <q-item v-if="!riskProfile?.suggestions?.length">
                    <q-item-section class="text-grey-7">暂无建议</q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-lg-7 col-12">
          <q-card flat bordered class="insight-card">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-sm">评分因子明细</div>
              <q-table
                flat
                dense
                :rows="riskProfile?.factors || []"
                :columns="riskFactorColumns"
                row-key="key"
                :pagination="{ rowsPerPage: 5 }"
              >
                <template v-slot:body-cell-value="props">
                  <q-td :props="props">
                    <q-chip
                      v-if="props.row.key === 'latest_risk'"
                      dense
                      :color="getRiskColor(String(props.row.value))"
                      text-color="white"
                    >
                      {{ getRiskLabel(String(props.row.value)) }}
                    </q-chip>
                    <span v-else>{{ props.row.value }}</span>
                  </q-td>
                </template>
                <template v-slot:body-cell-description="props">
                  <q-td :props="props" class="text-caption text-grey-8">
                    {{ props.row.description }}
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="q-mb-md insight-card">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">F2 检测历史趋势</div>
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model="historyDateFrom" dense outlined type="date" label="开始日期" />
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model="historyDateTo" dense outlined type="date" label="结束日期" />
          </div>
          <div class="col-auto">
            <q-btn color="primary" label="筛选" :loading="loading.history" @click="applyHistoryFilters" />
          </div>
          <div class="col-auto">
            <q-btn flat color="grey-7" label="重置" @click="resetHistoryFilters" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div ref="historyChartRef" class="history-chart"></div>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-md-4 col-sm-6 col-xs-12">
              <q-banner rounded class="bg-blue-1 text-blue-9">
                检测总数：{{ history?.stats.total_detections ?? 0 }}
              </q-banner>
            </div>
            <div class="col-md-4 col-sm-6 col-xs-12">
              <q-banner rounded class="bg-green-1 text-green-9">
                平均置信度：{{ formatPercent(history?.stats.average_confidence) }}
              </q-banner>
            </div>
            <div class="col-md-4 col-sm-12 col-xs-12">
              <q-banner rounded :class="getTrendBannerClass(history?.stats.trend)">
                趋势：{{ getTrendLabel(history?.stats.trend) }}
              </q-banner>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-table
            flat
            :rows="history?.series || []"
            :columns="historyColumns"
            row-key="analysis_result_id"
            :pagination="{ rowsPerPage: 8 }"
          >
            <template v-slot:body-cell-study_unique_id="props">
              <q-td :props="props">
                {{ getStudyDisplayLabel(props.row.study_id) }}
              </q-td>
            </template>
            <template v-slot:body-cell-risk_level="props">
              <q-td :props="props">
                <q-chip dense :color="getRiskColor(props.row.risk_level)" text-color="white">
                  {{ getRiskLabel(props.row.risk_level) }}
                </q-chip>
              </q-td>
            </template>
            <template v-slot:body-cell-confidence="props">
              <q-td :props="props">{{ formatPercent(props.row.confidence) }}</q-td>
            </template>
            <template v-slot:body-cell-analysis_at="props">
              <q-td :props="props">{{ formatDateTime(props.row.analysis_at) }}</q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md insight-card">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">检查结果对比</div>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              v-model="leftStudyId"
              dense
              outlined
              emit-value
              map-options
              :options="compareStudyOptions"
              label="对比项 A"
            />
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select
              v-model="rightStudyId"
              dense
              outlined
              emit-value
              map-options
              :options="compareStudyOptions"
              label="对比项 B"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              label="开始对比"
              :loading="loading.compare"
              :disable="!canCompare"
              @click="runCompare"
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="compareResult">
          <div class="row q-col-gutter-md">
            <div class="col-md-6 col-12">
              <q-card flat bordered class="compare-card">
                <q-card-section class="text-subtitle2 text-weight-medium">
                  A：{{ getStudyDisplayLabel(compareResult.left.study_id) }}
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <div>检查日期：{{ formatDate(compareResult.left.study_date) }}</div>
                  <div>诊断结论：{{ compareResult.left.diagnosis || '-' }}</div>
                  <div>
                    风险等级：
                    <q-chip dense :color="getRiskColor(compareResult.left.risk_level)" text-color="white">
                      {{ getRiskLabel(compareResult.left.risk_level) }}
                    </q-chip>
                  </div>
                  <div>置信度：{{ formatPercent(compareResult.left.confidence) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-md-6 col-12">
              <q-card flat bordered class="compare-card">
                <q-card-section class="text-subtitle2 text-weight-medium">
                  B：{{ getStudyDisplayLabel(compareResult.right.study_id) }}
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <div>检查日期：{{ formatDate(compareResult.right.study_date) }}</div>
                  <div>诊断结论：{{ compareResult.right.diagnosis || '-' }}</div>
                  <div>
                    风险等级：
                    <q-chip dense :color="getRiskColor(compareResult.right.risk_level)" text-color="white">
                      {{ getRiskLabel(compareResult.right.risk_level) }}
                    </q-chip>
                  </div>
                  <div>置信度：{{ formatPercent(compareResult.right.confidence) }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div class="q-mt-md">
            <q-banner rounded class="bg-grey-2 text-grey-9">
              <div class="text-body2">
                风险变化：
                <strong>{{ compareResult.diff.risk_delta > 0 ? '+' : '' }}{{ compareResult.diff.risk_delta }}</strong>
                ，置信度变化：
                <strong>
                  {{ compareResult.diff.confidence_delta > 0 ? '+' : '' }}{{
                    (compareResult.diff.confidence_delta * 100).toFixed(2)
                  }}%
                </strong>
              </div>
              <div class="text-caption q-mt-xs">
                结论变化：{{ compareResult.diff.diagnosis_changed ? '是' : '否' }}
              </div>
              <div class="q-mt-sm">
                <q-chip
                  v-for="(item, idx) in compareResult.diff.summary"
                  :key="`compare-summary-${idx}`"
                  dense
                  color="primary"
                  text-color="white"
                  class="q-mr-xs q-mb-xs"
                >
                  {{ item }}
                </q-chip>
              </div>
            </q-banner>
          </div>
        </q-card-section>
        <q-card-section v-else class="text-grey-7">选择两次检查后可查看变化差异。</q-card-section>
      </q-card>

      <q-card flat bordered class="insight-card">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">F8 患者时间线</div>
          </div>
          <div class="col-auto">
            <q-btn-toggle
              v-model="timelineViewMode"
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="timelineModeOptions"
            />
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select
              v-model="timelineLimit"
              dense
              outlined
              emit-value
              map-options
              :options="timelineLimitOptions"
              label="每页条数"
              @update:model-value="changeTimelineLimit"
            />
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model="timelineDateFrom" dense outlined type="date" label="开始日期" />
          </div>
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model="timelineDateTo" dense outlined type="date" label="结束日期" />
          </div>
          <div class="col-auto">
            <q-btn color="primary" label="筛选" :loading="loading.timeline" @click="applyTimelineFilters" />
          </div>
          <div class="col-auto">
            <q-btn flat color="grey-7" label="重置" @click="resetTimelineFilters" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="timeline-toolbar row items-center justify-between q-mb-sm">
            <div class="text-caption text-grey-7">
              当前页显示 {{ filteredTimelineItems.length }} 条
            </div>
          </div>

          <div class="timeline-scroll">
            <q-timeline color="primary" layout="comfortable">
              <q-timeline-entry
                v-for="item in filteredTimelineItems"
                :key="item.event_id"
                :title="getCompactTimelineTitle(item)"
                :subtitle="formatDateTime(item.event_time)"
                :icon="getEventIcon(item.event_type)"
                :color="getTimelineEventColor(item)"
              >
                <div class="text-body2 timeline-desc">
                  {{ getCompactTimelineDescription(item) }}
                </div>
                <div class="q-mt-xs">
                  <q-chip v-if="item.risk_level" dense :color="getRiskColor(item.risk_level)" text-color="white">
                    {{ getRiskLabel(item.risk_level) }}
                  </q-chip>
                  <q-chip v-if="item.status" dense color="grey-6" text-color="white">
                    {{ getStatusLabel(item.status) }}
                  </q-chip>
                </div>
              </q-timeline-entry>
              <div v-if="!filteredTimelineItems.length" class="text-grey-7">暂无时间线事件</div>
            </q-timeline>
          </div>

          <div class="row justify-end q-mt-md">
            <q-pagination
              v-if="timeline?.pagination.pages && timeline.pagination.pages > 1"
              :model-value="timeline.pagination.page"
              :max="timeline.pagination.pages"
              :max-pages="8"
              direction-links
              boundary-links
              color="primary"
              @update:model-value="changeTimelinePage"
            />
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { QTableProps } from 'quasar';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { usePatientInsightsStore } from 'stores/patientInsightsStore';
import type { PatientInsightTimelineEvent, PatientInsightTrend } from 'src/services/api';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const insightsStore = usePatientInsightsStore();

const { overview, history, compareResult, timeline, riskProfile, loading, isLoading } =
  storeToRefs(insightsStore);

const historyDateFrom = ref('');
const historyDateTo = ref('');
const timelineDateFrom = ref('');
const timelineDateTo = ref('');
const timelineViewMode = ref<'all' | 'key'>('key');
const timelineLimit = ref(12);
const leftStudyId = ref<number | null>(null);
const rightStudyId = ref<number | null>(null);

const historyChartRef = ref<HTMLElement | null>(null);
let historyChartInstance: echarts.ECharts | null = null;

const patientId = computed(() => Number(route.params.id));
const isValidPatientId = computed(() => Number.isInteger(patientId.value) && patientId.value > 0);
const canCompare = computed(
  () =>
    leftStudyId.value !== null &&
    rightStudyId.value !== null &&
    leftStudyId.value !== rightStudyId.value,
);

const timelineModeOptions = [
  { label: '关键事件', value: 'key' },
  { label: '全部事件', value: 'all' },
];

const timelineLimitOptions = [
  { label: '12 条', value: 12 },
  { label: '20 条', value: 20 },
  { label: '40 条', value: 40 },
];

const riskFactorColumns: QTableProps['columns'] = [
  { name: 'label', label: '因子', field: 'label', align: 'left' },
  { name: 'weight', label: '权重', field: 'weight', align: 'center' },
  { name: 'score', label: '得分', field: 'score', align: 'center' },
  { name: 'value', label: '值', field: 'value', align: 'left' },
  { name: 'description', label: '说明', field: 'description', align: 'left' },
];

const historyColumns: QTableProps['columns'] = [
  { name: 'study_unique_id', label: '检查序号', field: 'study_unique_id', align: 'left' },
  { name: 'study_date', label: '检查日期', field: 'study_date', align: 'left' },
  { name: 'diagnosis', label: '诊断结论', field: 'diagnosis', align: 'left' },
  { name: 'risk_level', label: '风险等级', field: 'risk_level', align: 'center' },
  { name: 'confidence', label: '置信度', field: 'confidence', align: 'center' },
  { name: 'analysis_at', label: '分析时间', field: 'analysis_at', align: 'left' },
];

const studyOrderMap = computed(() => {
  const map = new Map<number, number>();
  const series = history.value?.series || [];
  let order = 1;

  series.forEach((item) => {
    if (!item.study_id) return;
    if (!map.has(item.study_id)) {
      map.set(item.study_id, order);
      order += 1;
    }
  });

  return map;
});

const compareStudyOptions = computed(() => {
  const series = history.value?.series || [];
  const options: Array<{ value: number; label: string }> = [];
  const created = new Set<number>();

  series.forEach((item) => {
    if (!item.study_id || created.has(item.study_id)) return;
    created.add(item.study_id);
    options.push({
      value: item.study_id,
      label: `${getStudyDisplayLabel(item.study_id)} · ${formatDate(item.study_date)}${
        item.study_type ? ` · ${item.study_type}` : ''
      }`,
    });
  });

  return options;
});

const keyTimelineEventTypes = new Set([
  'analysis_result',
  'analysis_completed',
  'analysis_failed',
  'followup_overdue',
  'followup_completed',
  'report_generated',
]);

const filteredTimelineItems = computed(() => {
  const items = timeline.value?.items || [];
  if (timelineViewMode.value === 'all') {
    return items;
  }
  return items.filter((item) => keyTimelineEventTypes.has(item.event_type));
});

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.00%';
  return `${(value * 100).toFixed(2)}%`;
}

function getRiskColor(level?: string) {
  if (level === 'critical') return 'deep-orange';
  if (level === 'high') return 'negative';
  if (level === 'medium') return 'orange';
  return 'positive';
}

function getRiskLabel(level?: string) {
  if (level === 'critical') return '极高风险';
  if (level === 'high') return '高风险';
  if (level === 'medium') return '中风险';
  return '低风险';
}

function getStudyDisplayLabel(studyId?: number | null) {
  if (!studyId) return '未关联检查';
  const order = studyOrderMap.value.get(studyId);
  if (!order) return '检查记录';
  return `第${order}次检查`;
}

function getTrendLabel(trend?: PatientInsightTrend) {
  if (trend === 'up') return '上升';
  if (trend === 'down') return '下降';
  if (trend === 'stable') return '平稳';
  return '样本不足';
}

function getTrendTextClass(trend?: PatientInsightTrend) {
  if (trend === 'up') return 'text-negative';
  if (trend === 'down') return 'text-positive';
  return 'text-grey-8';
}

function getTrendBannerClass(trend?: PatientInsightTrend) {
  if (trend === 'up') return 'bg-red-1 text-negative';
  if (trend === 'down') return 'bg-green-1 text-green-9';
  return 'bg-grey-2 text-grey-8';
}

function getEventIcon(eventType: string) {
  if (eventType.includes('report')) return 'description';
  if (eventType.includes('followup')) return 'event';
  if (eventType.includes('analysis')) return 'biotech';
  if (eventType.includes('study')) return 'folder';
  return 'history';
}

function getTimelineEventColor(item: PatientInsightTimelineEvent) {
  if (item.risk_level) return getRiskColor(item.risk_level);
  if (item.event_type === 'analysis_failed') return 'negative';
  return 'primary';
}

function getStatusLabel(status?: string) {
  if (status === 'SUCCESS') return '已完成';
  if (status === 'FAILED') return '失败';
  if (status === 'PROCESSING') return '处理中';
  if (status === 'PENDING') return '待处理';
  if (status === 'completed') return '已完成';
  if (status === 'cancelled') return '已取消';
  if (status === 'overdue') return '已逾期';
  if (status === 'pending') return '待处理';
  return status || '-';
}

function getCompactTimelineTitle(item: PatientInsightTimelineEvent) {
  const studyId = Number(item.meta?.study_id);
  if (Number.isInteger(studyId) && studyId > 0) {
    return `${item.title} · ${getStudyDisplayLabel(studyId)}`;
  }
  return item.title;
}

function getCompactTimelineDescription(item: PatientInsightTimelineEvent) {
  if (item.event_type === 'analysis_task_created') return '已创建分析任务，等待处理。';
  if (item.event_type === 'analysis_started') return '分析任务已开始执行。';
  if (item.event_type === 'analysis_completed') return '分析任务执行完成。';
  if (item.event_type === 'analysis_failed') return '分析失败，请查看日志后重试。';
  if (item.event_type === 'study_created') return '新增一条病例检查记录。';
  if (item.event_type === 'report_generated') return '已生成分析报告。';
  if (item.event_type === 'followup_created') return '已创建随访计划。';
  if (item.event_type === 'followup_overdue') return '随访计划已逾期，请尽快处理。';
  if (item.event_type === 'followup_completed') return '随访计划已完成。';
  if (item.event_type === 'followup_cancelled') return '随访计划已取消。';
  return '事件已记录。';
}

async function loadInitialData() {
  if (!isValidPatientId.value) {
    return;
  }

  try {
    await insightsStore.fetchInitial(patientId.value);
    historyDateFrom.value = insightsStore.historyFilters.date_from || '';
    historyDateTo.value = insightsStore.historyFilters.date_to || '';
    timelineDateFrom.value = insightsStore.timelineFilters.date_from || '';
    timelineDateTo.value = insightsStore.timelineFilters.date_to || '';
    timelineLimit.value = insightsStore.timelineFilters.limit || 12;
    initCompareSelection();
    if (
      leftStudyId.value &&
      rightStudyId.value &&
      leftStudyId.value !== rightStudyId.value
    ) {
      try {
        await insightsStore.fetchCompare(patientId.value, leftStudyId.value, rightStudyId.value);
      } catch {
        // 对比属于增强信息，不阻断页面主数据加载
      }
    }
    await nextTick();
    initHistoryChart();
    updateHistoryChart();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '加载患者洞察数据失败',
      position: 'top',
    });
  }
}

function initCompareSelection() {
  if (compareStudyOptions.value.length < 2) {
    leftStudyId.value = null;
    rightStudyId.value = null;
    return;
  }

  leftStudyId.value = compareStudyOptions.value[0]?.value ?? null;
  rightStudyId.value = compareStudyOptions.value[compareStudyOptions.value.length - 1]?.value ?? null;
}

async function applyHistoryFilters() {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchHistory(patientId.value, {
      date_from: historyDateFrom.value,
      date_to: historyDateTo.value,
      limit: insightsStore.historyFilters.limit,
    });
    initCompareSelection();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '筛选历史趋势失败',
      position: 'top',
    });
  }
}

async function resetHistoryFilters() {
  historyDateFrom.value = '';
  historyDateTo.value = '';
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchHistory(patientId.value, {
      date_from: '',
      date_to: '',
      limit: insightsStore.historyFilters.limit,
    });
    initCompareSelection();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '重置历史筛选失败',
      position: 'top',
    });
  }
}

async function runCompare() {
  if (!isValidPatientId.value || !canCompare.value || !leftStudyId.value || !rightStudyId.value) {
    return;
  }
  try {
    await insightsStore.fetchCompare(patientId.value, leftStudyId.value, rightStudyId.value);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '对比失败',
      position: 'top',
    });
  }
}

async function applyTimelineFilters() {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchTimeline(patientId.value, {
      page: 1,
      date_from: timelineDateFrom.value,
      date_to: timelineDateTo.value,
      limit: timelineLimit.value,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '筛选时间线失败',
      position: 'top',
    });
  }
}

async function resetTimelineFilters() {
  timelineDateFrom.value = '';
  timelineDateTo.value = '';
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchTimeline(patientId.value, {
      page: 1,
      date_from: '',
      date_to: '',
      limit: timelineLimit.value,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '重置时间线筛选失败',
      position: 'top',
    });
  }
}

async function changeTimelinePage(page: number) {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchTimeline(patientId.value, {
      page,
      date_from: timelineDateFrom.value,
      date_to: timelineDateTo.value,
      limit: timelineLimit.value,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '切换时间线分页失败',
      position: 'top',
    });
  }
}

async function changeTimelineLimit() {
  if (!isValidPatientId.value) return;
  await changeTimelinePage(1);
}

async function refreshRiskProfile() {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchRiskProfile(patientId.value);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '刷新风险画像失败',
      position: 'top',
    });
  }
}

function initHistoryChart() {
  if (!historyChartRef.value || historyChartInstance) return;
  historyChartInstance = echarts.init(historyChartRef.value);
}

function updateHistoryChart() {
  if (!historyChartInstance) return;
  const series = history.value?.series || [];

  const xAxisLabels = series.map((item) => getStudyDisplayLabel(item.study_id));
  const confidenceData = series.map((item) => Number((item.confidence * 100).toFixed(2)));
  const riskData = series.map((item) => {
    if (item.risk_level === 'critical') return 4;
    if (item.risk_level === 'high') return 3;
    if (item.risk_level === 'medium') return 2;
    return 1;
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['风险权重', '置信度(%)'],
      top: 8,
    },
    grid: {
      left: 48,
      right: 48,
      top: 50,
      bottom: 28,
    },
    xAxis: {
      type: 'category',
      data: xAxisLabels,
      axisLabel: {
        interval: 0,
        rotate: xAxisLabels.length > 7 ? 30 : 0,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '风险权重',
        min: 1,
        max: 4,
        interval: 1,
      },
      {
        type: 'value',
        name: '置信度',
        min: 0,
        max: 100,
      },
    ],
    series: [
      {
        name: '风险权重',
        type: 'line',
        smooth: true,
        data: riskData,
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 2 },
        yAxisIndex: 0,
      },
      {
        name: '置信度(%)',
        type: 'line',
        smooth: true,
        data: confidenceData,
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 2 },
        yAxisIndex: 1,
      },
    ],
  };

  historyChartInstance.setOption(option, true);
}

function handleResize() {
  historyChartInstance?.resize();
}

function goBack() {
  void router.push('/app/patients');
}

watch(
  () => route.params.id,
  () => {
    void loadInitialData();
  },
);

watch(
  () => history.value?.series,
  async () => {
    await nextTick();
    initHistoryChart();
    updateHistoryChart();
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener('resize', handleResize);
  void loadInitialData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  historyChartInstance?.dispose();
  historyChartInstance = null;
});
</script>

<style scoped>
.patient-insights-page {
  background: #f8fafc;
}

.summary-card {
  min-height: 120px;
}

.insight-card {
  border-radius: 16px;
}

.compare-card {
  border-radius: 14px;
}

.risk-gauge-shell {
  width: 146px;
  height: 146px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #eef4ff 60%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(37, 99, 235, 0.12);
}

.risk-gauge {
  background: #ffffff;
  border-radius: 999px;
}

.history-chart {
  height: 320px;
  width: 100%;
}

.timeline-toolbar {
  min-height: 24px;
}

.timeline-scroll {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

.timeline-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
