<template>
  <q-page class="q-pa-md app-gradient-page">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">随访管理</div>
        <div class="text-subtitle2 text-grey-7">按计划管理复查提醒，优先关注高风险患者</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="新建随访计划" no-caps @click="openCreateDialog" />
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">
              {{ statistics?.completionRate ?? '-' }}<span class="text-subtitle1">%</span>
            </div>
            <div class="text-caption text-grey-7">完成率</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-deep-orange">{{ statistics?.overview?.overdue ?? 0 }}</div>
            <div class="text-caption text-grey-7">逾期随访</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive">{{ statistics?.overview?.completed ?? 0 }}</div>
            <div class="text-caption text-grey-7">已完成</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-grey-8">
              {{ statistics?.avgCompletionDays ?? 0 }}<span class="text-subtitle1">天</span>
            </div>
            <div class="text-caption text-grey-7">平均完成周期</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 标签页切换 -->
    <q-tabs
      v-model="activeTab"
      class="q-mb-md text-primary"
      active-color="primary"
      indicator-color="primary"
      dense
      align="left"
    >
      <q-tab name="list" label="随访列表" icon="list" />
      <q-tab name="stats" label="统计报表" icon="bar_chart" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <!-- 列表面板 -->
      <q-tab-panel name="list" class="q-pa-none">
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="q-py-sm">
            <div class="row q-col-gutter-md items-center">
              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-input
                  v-model="filters.keyword"
                  outlined
                  dense
                  clearable
                  placeholder="患者姓名/编号/随访编号"
                  @keyup.enter="applyFilters"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-md-2 col-sm-6 col-xs-12">
                <q-select
                  v-model="filters.status"
                  :options="statusFilterOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="状态"
                />
              </div>
              <div class="col-md-2 col-sm-6 col-xs-12">
                <q-select
                  v-model="filters.highAttention"
                  :options="highAttentionFilterOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="重点关注"
                />
              </div>
              <div class="col-md-2 col-sm-6 col-xs-12">
                <q-input v-model="filters.dateFrom" outlined dense label="开始日期" type="date" />
              </div>
              <div class="col-md-2 col-sm-6 col-xs-12">
                <q-input v-model="filters.dateTo" outlined dense label="结束日期" type="date" />
              </div>
              <div class="col-auto">
                <q-btn color="primary" label="筛选" @click="applyFilters" />
              </div>
              <div class="col-auto">
                <q-btn flat color="grey-7" label="重置" @click="resetFilters" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md">
          <q-card-section class="row items-center">
            <div class="text-subtitle1 text-weight-medium">提醒渠道设置</div>
            <q-space />
            <q-toggle
              v-model="emailReminderEnabled"
              disable
              checked-icon="email"
              unchecked-icon="email"
              color="primary"
              label="邮件提醒（即将上线）"
            />
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section class="q-pa-none">
            <q-table
              :rows="rows"
              :columns="columns"
              row-key="id"
              :loading="loading"
              v-model:pagination="pagination"
              @request="onTableRequest"
            >
              <template v-slot:body-cell-patient="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.patient?.name || '-' }}</div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.patient?.patient_id || '-' }}
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-risk_level_snapshot="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    :color="getRiskColor(props.row.risk_level_snapshot)"
                    text-color="white"
                  >
                    {{ getRiskText(props.row.risk_level_snapshot) }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-is_high_attention="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    :color="props.row.is_high_attention ? 'deep-orange' : 'grey-6'"
                    text-color="white"
                  >
                    {{ props.row.is_high_attention ? '重点关注' : '常规' }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip dense :color="getStatusColor(props.row.status)" text-color="white">
                    {{ getStatusText(props.row.status) }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    color="primary"
                    @click="openEditDialog(props.row)"
                    aria-label="编辑"
                  >
                    <q-tooltip>编辑</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="priority_high"
                    :color="props.row.doctor_marked_high_attention ? 'deep-orange' : 'grey-7'"
                    @click="toggleDoctorAttention(props.row)"
                  >
                    <q-tooltip>{{
                      props.row.doctor_marked_high_attention
                        ? '取消医生重点标记'
                        : '标记医生重点关注'
                    }}</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="notifications_active"
                    color="teal"
                    @click="sendReminder(props.row)"
                  >
                    <q-tooltip>立即发送提醒</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="task_alt"
                    color="positive"
                    :disable="props.row.status === 'completed' || props.row.status === 'cancelled'"
                    @click="markComplete(props.row)"
                  >
                    <q-tooltip>标记完成</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="cancel"
                    color="negative"
                    :disable="props.row.status === 'completed' || props.row.status === 'cancelled'"
                    @click="markCancelled(props.row)"
                  >
                    <q-tooltip>取消计划</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width column flex-center q-pa-lg text-grey-6">
                  <q-icon name="event_note" size="56px" />
                  <div class="text-h6 q-mt-sm">暂无随访计划</div>
                  <div class="text-body2">点击右上角“新建随访计划”开始管理复查任务</div>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- 统计报表面板 -->
      <q-tab-panel name="stats" class="q-pa-none">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">近12个月随访趋势</div>
            <div ref="trendChartRef" style="height: 350px; width: 100%"></div>
          </q-card-section>
        </q-card>
        <div class="row q-col-gutter-md">
          <div class="col-md-6 col-xs-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1 text-weight-medium q-mb-md">风险等级分布</div>
                <div ref="riskChartRef" style="height: 300px; width: 100%"></div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-md-6 col-xs-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1 text-weight-medium q-mb-md">医生工作量</div>
                <q-list separator>
                  <q-item v-for="doc in statistics?.byDoctor || []" :key="doc.doctorId">
                    <q-item-section>
                      <q-item-label>{{ doc.doctorName }}</q-item-label>
                      <q-item-label caption
                        >总计 {{ doc.total }} 个随访，完成 {{ doc.completed }} 个</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-badge
                        :color="
                          doc.total > 0 && doc.completed / doc.total >= 0.8 ? 'positive' : 'warning'
                        "
                      >
                        {{ doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0 }}%
                      </q-badge>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!statistics?.byDoctor?.length">
                    <q-item-section class="text-grey-6 text-center">暂无数据</q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 760px; max-width: 95vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? '编辑随访计划' : '新建随访计划' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup aria-label="关闭对话框" />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div class="text-subtitle2 text-weight-medium">基础预设（可一键新增）</div>
              <div class="text-caption text-grey-7 q-mt-xs">
                先选择患者，再使用预设可快速创建随访计划；也可仅填入表单后手动调整。
              </div>
              <div class="row q-col-gutter-sm q-mt-sm">
                <div v-for="preset in followUpPresets" :key="preset.key" class="col-md-6 col-xs-12">
                  <q-card flat bordered>
                    <q-card-section class="q-py-sm">
                      <div class="text-body2 text-weight-medium">{{ preset.label }}</div>
                      <div class="text-caption text-grey-7 q-mt-xs">{{ preset.description }}</div>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn
                          size="sm"
                          color="primary"
                          icon="bolt"
                          label="一键新增"
                          :loading="saving"
                          :disable="isEditing"
                          @click="quickCreateByPreset(preset.key)"
                        />
                        <q-btn
                          size="sm"
                          flat
                          color="primary"
                          icon="edit_note"
                          label="填入表单"
                          @click="applyPreset(preset.key)"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- 智能模板推荐 -->
            <div v-if="!isEditing && recommendedTemplate" class="col-12">
              <q-separator class="q-my-sm" />
              <div class="text-subtitle2 text-weight-medium">
                <q-icon name="auto_awesome" color="amber" class="q-mr-xs" />
                智能推荐模板
                <q-chip dense size="sm" color="primary" text-color="white">{{
                  recommendSource
                }}</q-chip>
              </div>
              <q-card flat bordered class="q-mt-sm">
                <q-card-section class="q-py-sm">
                  <div class="row items-center">
                    <div class="col">
                      <div class="text-body2 text-weight-medium">
                        {{ recommendedTemplate.name }}
                      </div>
                      <div class="text-caption text-grey-7">
                        {{ recommendedTemplate.description }}
                      </div>
                      <div class="text-caption text-grey-6 q-mt-xs">
                        复查周期：{{ recommendedTemplate.interval_months }}个月 | 检查项：{{
                          recommendedTemplate.checklist.join('、')
                        }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-btn
                        size="sm"
                        color="primary"
                        icon="check"
                        label="应用模板"
                        @click="applyRecommendedTemplate"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
              <!-- 备选模板 -->
              <div v-if="alternativeTemplates.length" class="q-mt-sm">
                <div class="text-caption text-grey-7">备选方案：</div>
                <div class="row q-gutter-sm q-mt-xs">
                  <q-chip
                    v-for="alt in alternativeTemplates.slice(0, 3)"
                    :key="alt.id"
                    clickable
                    dense
                    outline
                    color="grey-7"
                    @click="applyTemplate(alt)"
                  >
                    {{ alt.name }}
                  </q-chip>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xs-12">
              <q-select
                v-model="form.patient_id"
                :options="patientOptions"
                outlined
                emit-value
                map-options
                label="患者 *"
                :disable="isEditing"
              />
            </div>
            <div class="col-md-6 col-xs-12">
              <q-select
                v-model="form.study_id"
                :options="studyOptions"
                outlined
                emit-value
                map-options
                clearable
                label="关联病例（可选）"
              />
            </div>
            <div class="col-md-6 col-xs-12">
              <q-input
                v-model="form.planned_date"
                outlined
                label="计划复查日期（可选）"
                type="date"
              />
            </div>
            <div class="col-md-6 col-xs-12">
              <q-toggle
                v-model="form.doctor_marked_high_attention"
                color="deep-orange"
                label="医生标记为重点关注"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.reason"
                outlined
                stack-label
                label="随访原因（可选）"
                placeholder="如：LSIL复查、术后3个月复评"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.notes"
                outlined
                type="textarea"
                autogrow
                stack-label
                label="备注（可选）"
                placeholder="补充说明、注意事项、沟通记录"
              />
            </div>
            <div class="col-12">
              <q-toggle
                v-model="form.email_notify"
                disable
                color="primary"
                label="邮件提醒（即将上线）"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            :label="isEditing ? '保存' : '创建'"
            :loading="saving"
            @click="submitForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { useThemeStore } from 'stores/themeStore';
import {
  followUpAPI,
  type FollowUpItem,
  type FollowUpStatus,
  type FollowUpStatistics,
  type FollowUpTemplate,
  type CreateFollowUpPayload,
  type UpdateFollowUpPayload,
} from 'src/services/api';
import { getPatients, getPatientStudies, type Patient } from 'src/services/patientService';

interface StudyItem {
  id: number;
  study_id?: string;
  study_type?: string;
  study_date?: string;
}

type FollowUpPresetKey = 'low_6m' | 'medium_3m' | 'high_1m' | 'postop_3m';

interface FollowUpPreset {
  key: FollowUpPresetKey;
  label: string;
  description: string;
  intervalMonths: number;
  reason: string;
  notes: string;
  doctorMarkedHighAttention: boolean;
}

interface FollowUpForm {
  id?: number;
  patient_id: number | null;
  study_id: number | null;
  planned_date: string;
  reason: string;
  notes: string;
  doctor_marked_high_attention: boolean;
  email_notify: boolean;
}

const $q = useQuasar();
const route = useRoute();
const themeStore = useThemeStore();

const loading = ref(false);
const saving = ref(false);
const rows = ref<FollowUpItem[]>([]);
const emailReminderEnabled = ref(false);
const activeTab = ref('list');

// 统计数据
const statistics = ref<FollowUpStatistics | null>(null);

// 智能模板推荐
const recommendedTemplate = ref<FollowUpTemplate | null>(null);
const alternativeTemplates = ref<FollowUpTemplate[]>([]);
const recommendSource = ref('');

// ECharts 引用
const trendChartRef = ref<HTMLElement | null>(null);
const riskChartRef = ref<HTMLElement | null>(null);
let trendChartInstance: echarts.ECharts | null = null;
let riskChartInstance: echarts.ECharts | null = null;

const followUpPresets: FollowUpPreset[] = [
  {
    key: 'low_6m',
    label: '低风险 6 个月复查',
    description: '适用于低风险结果，建议常规复查',
    intervalMonths: 6,
    reason: '低风险常规复查',
    notes: '建议按 6 个月周期复查，关注症状变化与依从性。',
    doctorMarkedHighAttention: false,
  },
  {
    key: 'medium_3m',
    label: '中风险 3 个月复查',
    description: '适用于中风险结果，缩短复查周期',
    intervalMonths: 3,
    reason: '中风险复查',
    notes: '建议 3 个月内复查，必要时结合进一步检查。',
    doctorMarkedHighAttention: false,
  },
  {
    key: 'high_1m',
    label: '高风险 1 个月重点复查',
    description: '适用于高风险或临界高风险患者',
    intervalMonths: 1,
    reason: '高风险重点复查',
    notes: '建议尽快复查并持续跟踪，必要时优先安排就诊。',
    doctorMarkedHighAttention: true,
  },
  {
    key: 'postop_3m',
    label: '术后 3 个月复评',
    description: '适用于术后患者的阶段性复评',
    intervalMonths: 3,
    reason: '术后复评',
    notes: '术后阶段建议 3 个月复评，关注恢复情况与复发风险。',
    doctorMarkedHighAttention: true,
  },
];

const filters = ref({
  keyword: '',
  status: '' as '' | FollowUpStatus,
  highAttention: 'all' as 'all' | 'true' | 'false',
  dateFrom: '',
  dateTo: '',
});

const pagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  { name: 'follow_up_id', label: '随访编号', field: 'follow_up_id', align: 'left' },
  { name: 'patient', label: '患者', field: 'patient', align: 'left' },
  { name: 'planned_date', label: '计划复查日期', field: 'planned_date', align: 'left' },
  { name: 'risk_level_snapshot', label: '风险快照', field: 'risk_level_snapshot', align: 'center' },
  { name: 'is_high_attention', label: '重点关注', field: 'is_high_attention', align: 'center' },
  { name: 'status', label: '状态', field: 'status', align: 'center' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' },
];

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '已超期', value: 'overdue' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const highAttentionFilterOptions = [
  { label: '全部', value: 'all' },
  { label: '重点关注', value: 'true' },
  { label: '非重点关注', value: 'false' },
];

const showDialog = ref(false);
const isEditing = ref(false);
const form = ref<FollowUpForm>({
  patient_id: null,
  study_id: null,
  planned_date: '',
  reason: '',
  notes: '',
  doctor_marked_high_attention: false,
  email_notify: false,
});

const patients = ref<Patient[]>([]);
const patientOptions = ref<Array<{ label: string; value: number }>>([]);
const studyOptions = ref<Array<{ label: string; value: number }>>([]);

const getRiskColor = (riskLevel?: string) => {
  if (riskLevel === 'critical' || riskLevel === 'high') return 'negative';
  if (riskLevel === 'medium') return 'warning';
  if (riskLevel === 'low') return 'positive';
  return 'grey-7';
};

const getRiskText = (riskLevel?: string) => {
  if (riskLevel === 'critical') return '极高';
  if (riskLevel === 'high') return '高';
  if (riskLevel === 'medium') return '中';
  if (riskLevel === 'low') return '低';
  return '-';
};

const getStatusColor = (status: FollowUpStatus) => {
  if (status === 'completed') return 'positive';
  if (status === 'overdue') return 'deep-orange';
  if (status === 'cancelled') return 'grey-7';
  return 'primary';
};

const getStatusText = (status: FollowUpStatus) => {
  if (status === 'completed') return '已完成';
  if (status === 'overdue') return '已超期';
  if (status === 'cancelled') return '已取消';
  return '待处理';
};

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPresetDate = (months: number) => {
  const target = new Date();
  target.setMonth(target.getMonth() + months);
  return formatDateOnly(target);
};

const applyPresetToForm = (preset: FollowUpPreset) => {
  form.value.planned_date = getPresetDate(preset.intervalMonths);
  form.value.reason = preset.reason;
  form.value.notes = preset.notes;
  form.value.doctor_marked_high_attention = preset.doctorMarkedHighAttention;
};

const buildPresetCreatePayload = (
  preset: FollowUpPreset,
  currentForm: FollowUpForm,
): CreateFollowUpPayload | null => {
  if (!currentForm.patient_id) {
    return null;
  }

  const payload: CreateFollowUpPayload = {
    patient_id: currentForm.patient_id,
    planned_date: getPresetDate(preset.intervalMonths),
    reason: preset.reason,
    notes: preset.notes,
    doctor_marked_high_attention: preset.doctorMarkedHighAttention,
  };

  if (currentForm.study_id) {
    payload.study_id = currentForm.study_id;
  }

  return payload;
};

const resetForm = () => {
  form.value = {
    patient_id: null,
    study_id: null,
    planned_date: '',
    reason: '',
    notes: '',
    doctor_marked_high_attention: false,
    email_notify: false,
  };
  studyOptions.value = [];
};

const fetchPatients = async () => {
  const response = await getPatients({ page: 1, limit: 200 });
  patients.value = response.patients;
  patientOptions.value = response.patients.map((patient) => ({
    label: `${patient.name} (${patient.patientId})`,
    value: patient.id,
  }));
};

const fetchStudiesForPatient = async (patientId: number) => {
  const studies = (await getPatientStudies(patientId)) as StudyItem[];
  studyOptions.value = studies.map((study) => ({
    value: study.id,
    label: `${study.study_id || `病例#${study.id}`}${study.study_type ? ` | ${study.study_type}` : ''}`,
  }));
};

const loadData = async () => {
  loading.value = true;
  try {
    const params: {
      page?: number;
      limit?: number;
      status?: FollowUpStatus;
      keyword?: string;
      date_from?: string;
      date_to?: string;
      high_attention?: boolean;
    } = {
      page: pagination.value?.page || 1,
      limit: pagination.value?.rowsPerPage || 10,
    };

    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.keyword) params.keyword = filters.value.keyword;
    if (filters.value.dateFrom) params.date_from = filters.value.dateFrom;
    if (filters.value.dateTo) params.date_to = filters.value.dateTo;
    if (filters.value.highAttention !== 'all') {
      params.high_attention = filters.value.highAttention === 'true';
    }

    const response = await followUpAPI.getFollowUps(params);

    rows.value = response.data.followups;
    if (pagination.value) {
      pagination.value.rowsNumber = response.data.pagination.total;
      pagination.value.page = response.data.pagination.page;
      pagination.value.rowsPerPage = response.data.pagination.limit;
    }
  } catch (error) {
    console.error('加载随访数据失败:', error);
    $q.notify({ type: 'negative', message: '加载随访数据失败', position: 'top' });
  } finally {
    loading.value = false;
  }
};

const onTableRequest: QTableProps['onRequest'] = (props) => {
  if (pagination.value) {
    pagination.value.page = props.pagination.page;
    pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  }
  void loadData();
};

const applyFilters = () => {
  if (pagination.value) {
    pagination.value.page = 1;
  }
  void loadData();
};

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    highAttention: 'all',
    dateFrom: '',
    dateTo: '',
  };
  if (pagination.value) {
    pagination.value.page = 1;
  }
  void loadData();
};

const applyRouteFilters = () => {
  const status = route.query.status;
  const highAttention = route.query.high_attention;
  const keyword = route.query.keyword;

  filters.value.status =
    typeof status === 'string' && ['pending', 'overdue', 'completed', 'cancelled'].includes(status)
      ? (status as FollowUpStatus)
      : '';

  filters.value.highAttention =
    highAttention === 'true' || highAttention === 'false' ? highAttention : 'all';

  filters.value.keyword = typeof keyword === 'string' ? keyword : '';
};

const openCreateDialog = () => {
  isEditing.value = false;
  resetForm();
  showDialog.value = true;
};

const applyPreset = (presetKey: FollowUpPresetKey) => {
  const preset = followUpPresets.find((item) => item.key === presetKey);
  if (!preset) {
    return;
  }

  applyPresetToForm(preset);
  $q.notify({
    type: 'info',
    message: `已套用预设：${preset.label}`,
    position: 'top',
  });
};

const quickCreateByPreset = async (presetKey: FollowUpPresetKey) => {
  const preset = followUpPresets.find((item) => item.key === presetKey);
  if (!preset) {
    return;
  }

  const payload = buildPresetCreatePayload(preset, form.value);
  if (!payload) {
    $q.notify({ type: 'warning', message: '请先选择患者，再使用一键新增', position: 'top' });
    return;
  }

  saving.value = true;
  try {
    await followUpAPI.createFollowUp(payload);
    applyPresetToForm(preset);
    $q.notify({
      type: 'positive',
      message: `已按预设新增：${preset.label}`,
      position: 'top',
    });
    await loadData();
  } catch (error) {
    console.error('预设一键新增失败:', error);
    $q.notify({ type: 'negative', message: '预设一键新增失败', position: 'top' });
  } finally {
    saving.value = false;
  }
};

const openEditDialog = (item: FollowUpItem) => {
  isEditing.value = true;
  form.value = {
    id: item.id,
    patient_id: item.patient_id,
    study_id: item.study_id || null,
    planned_date: item.planned_date || '',
    reason: item.reason || '',
    notes: item.notes || '',
    doctor_marked_high_attention: !!item.doctor_marked_high_attention,
    email_notify: false,
  };
  if (item.patient_id) {
    void fetchStudiesForPatient(item.patient_id);
  }
  showDialog.value = true;
};

const submitForm = async () => {
  if (!form.value.patient_id) {
    $q.notify({ type: 'warning', message: '请选择患者', position: 'top' });
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value && form.value.id) {
      const payload: UpdateFollowUpPayload = {
        study_id: form.value.study_id,
        reason: form.value.reason,
        notes: form.value.notes,
        doctor_marked_high_attention: form.value.doctor_marked_high_attention,
      };
      if (form.value.planned_date) {
        payload.planned_date = form.value.planned_date;
      }
      await followUpAPI.updateFollowUp(form.value.id, payload);
      $q.notify({ type: 'positive', message: '随访计划更新成功', position: 'top' });
    } else {
      const payload: CreateFollowUpPayload = {
        patient_id: form.value.patient_id,
        study_id: form.value.study_id,
        reason: form.value.reason,
        notes: form.value.notes,
        doctor_marked_high_attention: form.value.doctor_marked_high_attention,
      };
      if (form.value.planned_date) {
        payload.planned_date = form.value.planned_date;
      }
      await followUpAPI.createFollowUp(payload);
      $q.notify({ type: 'positive', message: '随访计划创建成功', position: 'top' });
    }

    showDialog.value = false;
    await loadData();
  } catch (error) {
    console.error('保存随访计划失败:', error);
    $q.notify({ type: 'negative', message: '保存失败，请重试', position: 'top' });
  } finally {
    saving.value = false;
  }
};

const markComplete = async (item: FollowUpItem) => {
  try {
    await followUpAPI.completeFollowUp(item.id);
    $q.notify({ type: 'positive', message: '已标记完成', position: 'top' });
    await loadData();
  } catch (error) {
    console.error('标记完成失败:', error);
    $q.notify({ type: 'negative', message: '标记完成失败', position: 'top' });
  }
};

const markCancelled = async (item: FollowUpItem) => {
  try {
    await followUpAPI.cancelFollowUp(item.id);
    $q.notify({ type: 'info', message: '随访计划已取消', position: 'top' });
    await loadData();
  } catch (error) {
    console.error('取消计划失败:', error);
    $q.notify({ type: 'negative', message: '取消计划失败', position: 'top' });
  }
};

const toggleDoctorAttention = async (item: FollowUpItem) => {
  try {
    await followUpAPI.setHighAttention(item.id, !item.doctor_marked_high_attention);
    $q.notify({
      type: 'positive',
      message: !item.doctor_marked_high_attention ? '已标记医生重点关注' : '已取消医生重点关注',
      position: 'top',
    });
    await loadData();
  } catch (error) {
    console.error('切换重点关注失败:', error);
    $q.notify({ type: 'negative', message: '更新重点关注失败', position: 'top' });
  }
};

const sendReminder = async (item: FollowUpItem) => {
  try {
    await followUpAPI.remindNow(item.id);
    window.dispatchEvent(new Event('notification-updated'));
    $q.notify({ type: 'positive', message: '提醒已发送', position: 'top' });
  } catch (error) {
    console.error('发送提醒失败:', error);
    $q.notify({ type: 'negative', message: '发送提醒失败', position: 'top' });
  }
};

watch(
  () => form.value.patient_id,
  (patientId) => {
    if (patientId) {
      void fetchStudiesForPatient(patientId);
    } else {
      studyOptions.value = [];
      form.value.study_id = null;
    }
  },
);

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const response = await followUpAPI.getStatistics();
    statistics.value = response.data;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

/** 获取智能模板推荐 */
const fetchRecommendation = async (studyId: number) => {
  try {
    const response = await followUpAPI.recommendTemplate(studyId);
    recommendedTemplate.value = response.data.recommended;
    alternativeTemplates.value = response.data.alternatives;
    const src = response.data.source;
    recommendSource.value = src.diagnosis
      ? `${src.diagnosis} / ${getRiskText(src.risk_level)}`
      : getRiskText(src.risk_level);
  } catch (error) {
    console.error('获取模板推荐失败:', error);
    recommendedTemplate.value = null;
    alternativeTemplates.value = [];
  }
};

/** 应用推荐模板到表单 */
const applyRecommendedTemplate = () => {
  if (!recommendedTemplate.value) return;
  applyTemplate(recommendedTemplate.value);
};

/** 应用指定模板到表单 */
const applyTemplate = (tpl: FollowUpTemplate) => {
  form.value.planned_date = getPresetDate(tpl.interval_months);
  form.value.reason = tpl.description;
  form.value.notes = `检查清单：${tpl.checklist.join('、')}`;
  form.value.doctor_marked_high_attention = ['high', 'critical'].includes(tpl.risk);
  $q.notify({ type: 'info', message: `已应用模板：${tpl.name}`, position: 'top' });
};

/** 渲染趋势图表 */
const renderTrendChart = () => {
  if (!trendChartRef.value || !statistics.value?.byMonth?.length) return;

  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value);
  }

  const isDark = themeStore.isDark;
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const months = statistics.value.byMonth.map((m) => m.month);

  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['已完成', '已逾期', '总计'],
      top: 8,
      textStyle: { color: textColor },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: gridColor } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        data: statistics.value.byMonth.map((m) => m.completed),
        itemStyle: { color: '#10b981' },
      },
      {
        name: '已逾期',
        type: 'bar',
        stack: 'total',
        data: statistics.value.byMonth.map((m) => m.overdue),
        itemStyle: { color: '#f97316' },
      },
      {
        name: '总计',
        type: 'line',
        smooth: true,
        data: statistics.value.byMonth.map((m) => m.total),
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 2 },
      },
    ],
  });
};

/** 渲染风险分布图表 */
const renderRiskChart = () => {
  if (!riskChartRef.value || !statistics.value?.byRisk?.length) return;

  if (!riskChartInstance) {
    riskChartInstance = echarts.init(riskChartRef.value);
  }

  const isDark = themeStore.isDark;
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const riskColorMap: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#10b981',
  };

  const chartData = statistics.value.byRisk.map((r) => ({
    name: getRiskText(r.risk),
    value: r.total,
    itemStyle: { color: riskColorMap[r.risk] || '#94a3b8' },
  }));

  riskChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}个 ({d}%)' },
    legend: {
      bottom: 0,
      icon: 'circle',
      textStyle: { color: textColor },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        label: { formatter: '{b}\n{d}%', color: textColor },
        itemStyle: {
          borderColor: isDark ? '#1e293b' : '#fff',
          borderWidth: 2,
          borderRadius: 6,
        },
        data: chartData,
      },
    ],
  });
};

/** 统一渲染图表 */
const renderCharts = () => {
  renderTrendChart();
  renderRiskChart();
};

const handleChartResize = () => {
  trendChartInstance?.resize();
  riskChartInstance?.resize();
};

onMounted(async () => {
  applyRouteFilters();
  await fetchPatients();
  await Promise.all([loadData(), loadStatistics()]);
  window.addEventListener('resize', handleChartResize);
});

watch(
  () => route.query,
  () => {
    applyRouteFilters();
    if (pagination.value) {
      pagination.value.page = 1;
    }
    void loadData();
  },
);

// 切换到统计标签页时初始化图表
watch(activeTab, (val) => {
  if (val === 'stats') {
    void loadStatistics().then(() => {
      void nextTick(() => renderCharts());
    });
  }
});

// 监听关联病例变化，自动获取模板推荐
watch(
  () => form.value.study_id,
  (studyId) => {
    if (studyId && !isEditing.value) {
      void fetchRecommendation(studyId);
    } else {
      recommendedTemplate.value = null;
      alternativeTemplates.value = [];
    }
  },
);

// 监听暗色模式变化，重新渲染图表
watch(
  () => themeStore.isDark,
  () => {
    if (activeTab.value === 'stats') {
      void nextTick(() => renderCharts());
    }
  },
);

onUnmounted(() => {
  trendChartInstance?.dispose();
  riskChartInstance?.dispose();
  window.removeEventListener('resize', handleChartResize);
});
</script>
