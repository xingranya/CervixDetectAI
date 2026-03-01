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
              <div class="text-caption text-grey-7">{{ props.row.patient?.patient_id || '-' }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-risk_level_snapshot="props">
            <q-td :props="props">
              <q-chip dense :color="getRiskColor(props.row.risk_level_snapshot)" text-color="white">
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
              <q-btn flat dense round icon="edit" color="primary" @click="openEditDialog(props.row)">
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
                  props.row.doctor_marked_high_attention ? '取消医生重点标记' : '标记医生重点关注'
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

    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 760px; max-width: 95vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? '编辑随访计划' : '新建随访计划' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
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
              <q-input v-model="form.planned_date" outlined label="计划复查日期（可选）" type="date" />
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
          <q-btn color="primary" :label="isEditing ? '保存' : '创建'" :loading="saving" @click="submitForm" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useRoute } from 'vue-router';
import {
  followUpAPI,
  type FollowUpItem,
  type FollowUpStatus,
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

const loading = ref(false);
const saving = ref(false);
const rows = ref<FollowUpItem[]>([]);
const emailReminderEnabled = ref(false);

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

onMounted(async () => {
  applyRouteFilters();
  await fetchPatients();
  await loadData();
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
</script>
