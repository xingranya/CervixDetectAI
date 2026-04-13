<template>
  <q-page class="q-pa-md app-gradient-page patient-insights-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-auto">
        <q-btn flat round icon="arrow_back" color="grey-8" @click="goBack" aria-label="返回患者列表">
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
      <!-- Tab 导航 -->
      <q-tabs
        v-model="activeTab"
        class="q-mb-md text-grey-8"
        active-color="primary"
        indicator-color="primary"
        dense
        narrow-indicator
        no-caps
      >
        <q-tab name="overview" label="综合概览" icon="dashboard" />
        <q-tab name="diseaseAlert" label="疾病预警" icon="warning_amber" />
        <q-tab name="comparison" label="对比分析" icon="compare_arrows" />
        <q-tab name="riskFactors" label="风险因素" icon="health_and_safety" />
      </q-tabs>

      <!-- ====== 综合概览 Tab ====== -->
      <q-tab-panels v-model="activeTab" animated keep-alive>
      <q-tab-panel name="overview" class="q-pa-none">
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
                aria-label="刷新风险画像"
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
      </q-tab-panel>

      <!-- ====== 疾病预警 Tab ====== -->
      <q-tab-panel name="diseaseAlert" class="q-pa-none">
        <q-card flat bordered class="q-mb-md insight-card">
          <q-card-section class="row items-center">
            <div class="text-subtitle1 text-weight-medium">疾病进展预警</div>
            <q-space />
            <q-btn
              flat dense icon="refresh" color="primary"
              :loading="loading.diseaseAlert"
              @click="refreshDiseaseAlert"
              aria-label="刷新预警"
            >
              <q-tooltip>刷新疾病预警</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <!-- 预警级别展示 -->
            <div class="row items-center q-gutter-md q-mb-lg">
              <div class="col-auto">
                <q-icon
                  :name="getAlertIcon(diseaseAlert?.alertLevel)"
                  :color="getAlertColor(diseaseAlert?.alertLevel)"
                  size="56px"
                />
              </div>
              <div class="col">
                <div class="text-h6 text-weight-bold" :class="`text-${getAlertColor(diseaseAlert?.alertLevel)}`">
                  {{ getAlertLabel(diseaseAlert?.alertLevel) }}
                </div>
                <div class="text-body2 text-grey-7">
                  趋势：{{ getDiseaseTrendLabel(diseaseAlert?.trend) }}
                </div>
              </div>
            </div>

            <!-- 历史趋势图 -->
            <div ref="diseaseChartRef" class="history-chart q-mb-md"></div>

            <!-- 预警事件时间轴 -->
            <div v-if="diseaseAlert?.alerts?.length" class="q-mb-md">
              <div class="text-body2 text-weight-medium q-mb-sm">预警事件</div>
              <q-timeline color="orange" layout="comfortable">
                <q-timeline-entry
                  v-for="(alert, idx) in diseaseAlert.alerts"
                  :key="`alert-${idx}`"
                  :title="getAlertTypeLabel(alert.type)"
                  :icon="getAlertTypeIcon(alert.type)"
                  :color="getAlertTypeColor(alert.type)"
                >
                  <div class="text-body2">{{ alert.message }}</div>
                </q-timeline-entry>
              </q-timeline>
            </div>
            <q-banner v-else rounded class="bg-green-1 text-green-9 q-mb-md">
              当前无预警事件，患者状态良好。
            </q-banner>

            <!-- 预测建议 -->
            <q-card flat bordered class="insight-card" v-if="diseaseAlert?.prediction">
              <q-card-section>
                <div class="text-body2 text-weight-medium q-mb-xs">
                  <q-icon name="lightbulb" color="amber" class="q-mr-xs" />预测建议
                </div>
                <div class="text-body2 text-grey-8">{{ diseaseAlert.prediction }}</div>
              </q-card-section>
            </q-card>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- ====== 对比分析 Tab ====== -->
      <q-tab-panel name="comparison" class="q-pa-none">
        <q-card flat bordered class="q-mb-md insight-card">
          <q-card-section class="row items-center q-col-gutter-sm">
            <div class="col">
              <div class="text-subtitle1 text-weight-medium">多时段对比分析</div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-md-6 col-12">
                <div class="text-body2 text-weight-medium q-mb-sm">时段 A</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-input v-model="periodAStart" dense outlined type="date" label="开始日期" />
                  </div>
                  <div class="col-6">
                    <q-input v-model="periodAEnd" dense outlined type="date" label="结束日期" />
                  </div>
                </div>
              </div>
              <div class="col-md-6 col-12">
                <div class="text-body2 text-weight-medium q-mb-sm">时段 B</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-input v-model="periodBStart" dense outlined type="date" label="开始日期" />
                  </div>
                  <div class="col-6">
                    <q-input v-model="periodBEnd" dense outlined type="date" label="结束日期" />
                  </div>
                </div>
              </div>
            </div>
            <q-btn
              color="primary" label="开始对比"
              :loading="loading.comparison"
              :disable="!canRunComparison"
              @click="runComparison"
              class="q-mb-md"
            />

            <!-- 对比结果 -->
            <template v-if="comparisonResult">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-md-6 col-12">
                  <q-card flat bordered class="compare-card">
                    <q-card-section class="text-subtitle2 text-weight-medium">时段 A</q-card-section>
                    <q-separator />
                    <q-card-section>
                      <div>检查次数：{{ comparisonResult.periodA.count }}</div>
                      <div>平均置信度：{{ formatPercent(comparisonResult.periodA.avgConfidence) }}</div>
                      <div>
                        主要风险：
                        <q-chip dense :color="getRiskColor(comparisonResult.periodA.dominantRisk)" text-color="white">
                          {{ getRiskLabel(comparisonResult.periodA.dominantRisk) }}
                        </q-chip>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-md-6 col-12">
                  <q-card flat bordered class="compare-card">
                    <q-card-section class="text-subtitle2 text-weight-medium">时段 B</q-card-section>
                    <q-separator />
                    <q-card-section>
                      <div>检查次数：{{ comparisonResult.periodB.count }}</div>
                      <div>平均置信度：{{ formatPercent(comparisonResult.periodB.avgConfidence) }}</div>
                      <div>
                        主要风险：
                        <q-chip dense :color="getRiskColor(comparisonResult.periodB.dominantRisk)" text-color="white">
                          {{ getRiskLabel(comparisonResult.periodB.dominantRisk) }}
                        </q-chip>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- 变化指标 -->
              <q-banner rounded class="bg-grey-2 text-grey-9">
                <div class="text-body2">
                  风险变化：
                  <q-chip
                    dense
                    :color="comparisonResult.changes.riskChange === 'improved' ? 'positive' : comparisonResult.changes.riskChange === 'worsened' ? 'negative' : 'grey-6'"
                    text-color="white"
                  >
                    {{ comparisonResult.changes.riskChange === 'improved' ? '↓ 改善' : comparisonResult.changes.riskChange === 'worsened' ? '↑ 恶化' : '- 稳定' }}
                  </q-chip>
                </div>
                <div class="text-body2 q-mt-sm">
                  置信度变化：
                  <strong :class="comparisonResult.changes.confidenceChange > 0 ? 'text-positive' : comparisonResult.changes.confidenceChange < 0 ? 'text-negative' : 'text-grey-8'">
                    {{ comparisonResult.changes.confidenceChange > 0 ? '+' : '' }}{{ (comparisonResult.changes.confidenceChange * 100).toFixed(2) }}%
                  </strong>
                </div>
                <div v-if="comparisonResult.changes.diagnosisChanges.length" class="text-body2 q-mt-sm">
                  新增诊断：
                  <q-chip
                    v-for="(d, idx) in comparisonResult.changes.diagnosisChanges"
                    :key="`diag-change-${idx}`"
                    dense color="orange" text-color="white" class="q-mr-xs"
                  >{{ d }}</q-chip>
                </div>
              </q-banner>
            </template>
            <div v-else class="text-grey-7">请选择两个时段后点击“开始对比”查看差异。</div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- ====== 风险因素 Tab ====== -->
      <q-tab-panel name="riskFactors" class="q-pa-none">
        <q-card flat bordered class="q-mb-md insight-card">
          <q-card-section class="row items-center">
            <div class="text-subtitle1 text-weight-medium">个性化风险因素分析</div>
            <q-space />
            <q-btn
              flat dense icon="refresh" color="primary"
              :loading="loading.riskFactors"
              @click="refreshRiskFactors"
              aria-label="刷新风险因素"
            >
              <q-tooltip>刷新风险因素分析</q-tooltip>
            </q-btn>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <!-- 雷达图 + 综合评分 -->
              <div class="col-lg-5 col-12">
                <div class="text-center q-mb-md">
                  <div class="text-caption text-grey-7">综合风险评分</div>
                  <div
                    class="text-h3 text-weight-bold q-my-sm"
                    :class="`text-${getRiskScoreColor(riskFactorsData?.overallScore)}`"
                  >
                    {{ riskFactorsData?.overallScore ?? '-' }}
                  </div>
                  <q-chip
                    dense
                    :color="getRiskScoreColor(riskFactorsData?.overallScore)"
                    text-color="white"
                  >
                    {{ getRiskScoreLabel(riskFactorsData?.overallScore) }}
                  </q-chip>
                </div>
                <div ref="radarChartRef" class="radar-chart"></div>
              </div>

              <!-- 风险因子列表 -->
              <div class="col-lg-7 col-12">
                <div class="text-body2 text-weight-medium q-mb-sm">风险因子明细</div>
                <q-list bordered separator class="rounded-borders">
                  <q-item v-for="factor in riskFactorsData?.factors || []" :key="factor.name">
                    <q-item-section avatar>
                      <q-circular-progress
                        :value="factor.score"
                        size="42px"
                        :thickness="0.22"
                        :color="getRiskColor(factor.level)"
                        track-color="grey-3"
                        show-value
                        class="text-caption text-weight-bold"
                      >
                        {{ factor.score }}
                      </q-circular-progress>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ factor.name }}
                        <q-chip dense flat :color="getRiskColor(factor.level)" text-color="white" class="q-ml-xs" style="font-size: 10px">
                          {{ getRiskLabel(factor.level) }}
                        </q-chip>
                      </q-item-label>
                      <q-item-label caption>{{ factor.description }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-item-label caption>权重 {{ factor.weight }}%</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!riskFactorsData?.factors?.length">
                    <q-item-section class="text-grey-7">暂无风险因素数据</q-item-section>
                  </q-item>
                </q-list>

                <!-- 个性化建议 -->
                <div class="q-mt-md" v-if="riskFactorsData?.recommendations?.length">
                  <div class="text-body2 text-weight-medium q-mb-sm">个性化建议</div>
                  <q-list dense bordered separator>
                    <q-item v-for="(rec, idx) in riskFactorsData.recommendations" :key="`rec-${idx}`">
                      <q-item-section avatar>
                        <q-icon name="tips_and_updates" color="amber-8" />
                      </q-item-section>
                      <q-item-section>{{ rec }}</q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>
      </q-tab-panels>
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
import type {
  PatientInsightTimelineEvent,
  PatientInsightTrend,
} from 'src/services/api';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const insightsStore = usePatientInsightsStore();

const { overview, history, compareResult, timeline, riskProfile, loading, isLoading } =
  storeToRefs(insightsStore);
const { diseaseAlert, comparisonResult, riskFactorsData } = storeToRefs(insightsStore);

const historyDateFrom = ref('');
const historyDateTo = ref('');
const timelineDateFrom = ref('');
const timelineDateTo = ref('');
const timelineViewMode = ref<'all' | 'key'>('key');
const timelineLimit = ref(12);
const leftStudyId = ref<number | null>(null);
const rightStudyId = ref<number | null>(null);
const activeTab = ref('overview');

// 对比分析时段
const periodAStart = ref('');
const periodAEnd = ref('');
const periodBStart = ref('');
const periodBEnd = ref('');

const historyChartRef = ref<HTMLElement | null>(null);
const diseaseChartRef = ref<HTMLElement | null>(null);
const radarChartRef = ref<HTMLElement | null>(null);
let historyChartInstance: echarts.ECharts | null = null;
let diseaseChartInstance: echarts.ECharts | null = null;
let radarChartInstance: echarts.ECharts | null = null;

const patientId = computed(() => Number(route.params.id));
const isValidPatientId = computed(() => Number.isInteger(patientId.value) && patientId.value > 0);
const canCompare = computed(
  () =>
    leftStudyId.value !== null &&
    rightStudyId.value !== null &&
    leftStudyId.value !== rightStudyId.value,
);

const canRunComparison = computed(
  () => periodAStart.value && periodAEnd.value && periodBStart.value && periodBEnd.value,
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
  diseaseChartInstance?.resize();
  radarChartInstance?.resize();
}

function goBack() {
  void router.push('/app/patients');
}

// ====== 疾病预警辅助函数 ======

function getAlertIcon(level?: string) {
  if (level === 'critical') return 'crisis_alert';
  if (level === 'warning') return 'warning';
  if (level === 'watch') return 'visibility';
  return 'check_circle';
}

function getAlertColor(level?: string) {
  if (level === 'critical') return 'deep-orange';
  if (level === 'warning') return 'orange';
  if (level === 'watch') return 'amber';
  return 'positive';
}

function getAlertLabel(level?: string) {
  if (level === 'critical') return '紧急预警';
  if (level === 'warning') return '警告';
  if (level === 'watch') return '关注';
  return '无预警';
}

function getDiseaseTrendLabel(trend?: string) {
  if (trend === 'worsening') return '恶化';
  if (trend === 'improving') return '改善';
  if (trend === 'fluctuating') return '波动';
  return '平稳';
}

function getAlertTypeLabel(type: string) {
  const map: Record<string, string> = {
    risk_escalation: '风险升级',
    confidence_drop: '置信度下降',
    critical_detected: '极高风险检出',
    overdue_followup: '随访逾期',
  };
  return map[type] || '预警';
}

function getAlertTypeIcon(type: string) {
  const map: Record<string, string> = {
    risk_escalation: 'trending_up',
    confidence_drop: 'trending_down',
    critical_detected: 'crisis_alert',
    overdue_followup: 'event_busy',
  };
  return map[type] || 'warning';
}

function getAlertTypeColor(type: string) {
  const map: Record<string, string> = {
    risk_escalation: 'orange',
    confidence_drop: 'amber',
    critical_detected: 'deep-orange',
    overdue_followup: 'red',
  };
  return map[type] || 'grey';
}

function getRiskScoreColor(score?: number) {
  if (typeof score !== 'number') return 'grey';
  if (score >= 80) return 'deep-orange';
  if (score >= 60) return 'negative';
  if (score >= 30) return 'orange';
  return 'positive';
}

function getRiskScoreLabel(score?: number) {
  if (typeof score !== 'number') return '-';
  if (score >= 80) return '极高风险';
  if (score >= 60) return '高风险';
  if (score >= 30) return '中风险';
  return '低风险';
}

// ====== 疾病预警数据加载 & 图表 ======

async function refreshDiseaseAlert() {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchDiseaseAlert(patientId.value);
    await nextTick();
    initDiseaseChart();
    updateDiseaseChart();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '刷新疾病预警失败',
      position: 'top',
    });
  }
}

function initDiseaseChart() {
  if (!diseaseChartRef.value || diseaseChartInstance) return;
  diseaseChartInstance = echarts.init(diseaseChartRef.value);
}

function updateDiseaseChart() {
  if (!diseaseChartInstance) return;
  const items = diseaseAlert.value?.history || [];
  if (!items.length) return;

  const xLabels = items.map((h) => {
    if (!h.date) return '-';
    return new Date(h.date).toLocaleDateString('zh-CN');
  });
  const riskData = items.map((h) => {
    const map: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    return map[h.riskLevel] || 1;
  });
  const confData = items.map((h) => Number((h.confidence * 100).toFixed(2)));

  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['风险权重', '置信度(%)'], top: 8 },
    grid: { left: 48, right: 48, top: 50, bottom: 28 },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { interval: 0, rotate: xLabels.length > 7 ? 30 : 0 },
    },
    yAxis: [
      { type: 'value', name: '风险权重', min: 1, max: 4, interval: 1 },
      { type: 'value', name: '置信度', min: 0, max: 100 },
    ],
    series: [
      {
        name: '风险权重', type: 'line', smooth: true, data: riskData,
        itemStyle: { color: '#ef4444' }, lineStyle: { width: 2 }, yAxisIndex: 0,
      },
      {
        name: '置信度(%)', type: 'line', smooth: true, data: confData,
        itemStyle: { color: '#2563eb' }, lineStyle: { width: 2 }, yAxisIndex: 1,
      },
    ],
  };
  diseaseChartInstance.setOption(option, true);
}

// ====== 对比分析 ======

async function runComparison() {
  if (!isValidPatientId.value || !canRunComparison.value) return;
  try {
    await insightsStore.fetchComparison(patientId.value, {
      periodA_start: periodAStart.value,
      periodA_end: periodAEnd.value,
      periodB_start: periodBStart.value,
      periodB_end: periodBEnd.value,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '对比分析失败',
      position: 'top',
    });
  }
}

// ====== 风险因素 ======

async function refreshRiskFactors() {
  if (!isValidPatientId.value) return;
  try {
    await insightsStore.fetchRiskFactors(patientId.value);
    await nextTick();
    initRadarChart();
    updateRadarChart();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : '刷新风险因素失败',
      position: 'top',
    });
  }
}

function initRadarChart() {
  if (!radarChartRef.value || radarChartInstance) return;
  radarChartInstance = echarts.init(radarChartRef.value);
}

function updateRadarChart() {
  if (!radarChartInstance) return;
  const factors = riskFactorsData.value?.factors || [];
  if (!factors.length) return;

  const indicator = factors.map((f) => ({ name: f.name, max: 100 }));
  const values = factors.map((f) => f.score);

  const option: EChartsOption = {
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 4,
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '风险评分',
            areaStyle: { opacity: 0.25 },
            lineStyle: { width: 2 },
          },
        ],
      },
    ],
    tooltip: {},
  };
  radarChartInstance.setOption(option, true);
}

// ====== Tab 切换时懒加载 ======

watch(activeTab, async (tab) => {
  if (!isValidPatientId.value) return;
  if (tab === 'diseaseAlert' && !diseaseAlert.value) {
    try {
      await insightsStore.fetchDiseaseAlert(patientId.value);
      await nextTick();
      initDiseaseChart();
      updateDiseaseChart();
    } catch { /* 非关键错误不阻断 */ }
  } else if (tab === 'riskFactors' && !riskFactorsData.value) {
    try {
      await insightsStore.fetchRiskFactors(patientId.value);
      await nextTick();
      initRadarChart();
      updateRadarChart();
    } catch { /* 非关键错误不阻断 */ }
  }
});

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
  diseaseChartInstance?.dispose();
  diseaseChartInstance = null;
  radarChartInstance?.dispose();
  radarChartInstance = null;
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.radar-chart {
  height: 280px;
  width: 100%;
}
</style>
