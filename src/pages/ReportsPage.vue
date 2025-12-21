<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row items-center q-mb-md border-bottom q-pb-md">
      <div class="col">
        <div class="text-h5 flex items-center text-weight-bold text-dark">
          <q-icon name="description" color="primary" class="q-mr-sm" />
          报告中心
        </div>
        <div class="text-grey-7 q-ml-xl text-body2">查看、编辑、导出和打印患者诊断报告。</div>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
        <div class="text-subtitle1 text-weight-bold flex items-center">
          <q-icon name="filter_list" class="q-mr-sm text-grey-7" />
          筛选与搜索
        </div>
        <div class="q-gutter-sm">
          <q-btn
            outline
            color="grey-7"
            icon="refresh"
            label="重置"
            size="sm"
            @click="resetFilters"
          />
          <q-btn color="primary" icon="search" label="搜索" size="sm" @click="applyFilters" />
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">患者姓名/ID</div>
            <q-input
              v-model="filters.patient"
              dense
              outlined
              placeholder="输入姓名或病历号"
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="person" color="grey-5" />
              </template>
            </q-input>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">报告日期</div>
            <q-select
              v-model="filters.dateRange"
              :options="dateOptions"
              dense
              outlined
              emit-value
              map-options
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="event" color="grey-5" />
              </template>
            </q-select>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">风险等级</div>
            <q-select
              v-model="filters.riskLevel"
              :options="riskOptions"
              dense
              outlined
              emit-value
              map-options
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="error_outline" color="grey-5" />
              </template>
            </q-select>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">报告状态</div>
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              dense
              outlined
              emit-value
              map-options
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="assignment_turned_in" color="grey-5" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <!-- Report List -->
      <div class="col-lg-7 col-md-12">
        <q-card flat bordered class="full-height">
          <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="list" class="q-mr-sm text-grey-7" />
              报告列表
            </div>
            <q-btn flat round dense icon="sync" color="grey-7" @click="refreshReports" />
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-table
              :rows="reports"
              :columns="columns"
              row-key="id"
              selection="multiple"
              v-model:selected="selectedReports"
              flat
              :pagination="{ rowsPerPage: 10 }"
            >
              <template v-slot:body-cell-riskLevel="props">
                <q-td :props="props">
                  <q-badge :color="getRiskColor(props.value)" :label="getRiskLabel(props.value)" />
                </q-td>
              </template>
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="getStatusColor(props.value)"
                    :label="getStatusLabel(props.value)"
                    outline
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <div class="row no-wrap q-gutter-xs">
                    <q-btn
                      flat
                      size="sm"
                      icon="visibility"
                      color="grey-7"
                      @click="viewReport(props.row)"
                    />
                    <q-btn
                      flat
                      size="sm"
                      icon="edit"
                      color="primary"
                      @click="editReport(props.row)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
          <q-card-section
            class="row justify-between items-center text-grey-7 text-caption border-top-light"
          >
            <div>共 {{ reports.length }} 份报告</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Preview & Editor -->
      <div class="col-lg-5 col-md-12">
        <!-- Preview Panel -->
        <q-card flat bordered class="q-mb-md" v-if="activeTab === 'preview'">
          <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="visibility" class="q-mr-sm text-grey-7" />
              报告预览
            </div>
            <div class="q-gutter-sm">
              <q-btn outline size="sm" icon="print" label="打印" color="grey-8" />
              <q-btn color="primary" size="sm" icon="download" label="导出PDF" />
            </div>
          </q-card-section>
          <q-card-section class="bg-grey-1 scroll" style="max-height: 500px">
            <div v-if="currentReport">
              <div class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-xs flex items-center">
                  <q-icon name="person" size="xs" class="q-mr-xs" /> 患者基本信息
                </div>
                <div class="row q-col-gutter-xs text-body2">
                  <div class="col-4 text-grey-7">姓名：</div>
                  <div class="col-8">{{ currentReport.patientName }}</div>
                  <div class="col-4 text-grey-7">年龄：</div>
                  <div class="col-8">{{ currentReport.age }}岁</div>
                  <div class="col-4 text-grey-7">病历号：</div>
                  <div class="col-8">{{ currentReport.patientId }}</div>
                  <div class="col-4 text-grey-7">检查日期：</div>
                  <div class="col-8">{{ currentReport.date }}</div>
                </div>
              </div>

              <div class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-xs flex items-center">
                  <q-icon name="image_search" size="xs" class="q-mr-xs" /> 影像分析结果
                </div>
                <div class="row q-col-gutter-xs text-body2">
                  <div class="col-4 text-grey-7">醋酸白试验：</div>
                  <div class="col-8">{{ currentReport.acetowhite || '未记录' }}</div>
                  <div class="col-4 text-grey-7">碘试验：</div>
                  <div class="col-8">{{ currentReport.iodine || '未记录' }}</div>
                  <div class="col-4 text-grey-7">病变区域：</div>
                  <div class="col-8">{{ currentReport.lesionArea || '未记录' }}</div>
                </div>
              </div>

              <div class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-xs flex items-center">
                  <q-icon name="analytics" size="xs" class="q-mr-xs" /> 智能风险评估
                </div>
                <div class="row q-col-gutter-xs text-body2">
                  <div class="col-4 text-grey-7">综合风险：</div>
                  <div class="col-8">
                    <q-badge :color="getRiskColor(currentReport.riskLevel)">
                      {{ getRiskLabel(currentReport.riskLevel) }}
                    </q-badge>
                  </div>
                  <div class="col-4 text-grey-7">AI置信度：</div>
                  <div class="col-8">{{ currentReport.confidence }}%</div>
                </div>
              </div>

              <div class="q-mb-md">
                <div class="text-subtitle2 text-primary q-mb-xs flex items-center">
                  <q-icon name="medical_services" size="xs" class="q-mr-xs" /> 诊断建议
                </div>
                <div class="text-body2 bg-white q-pa-sm rounded-borders border-light">
                  {{ currentReport.recommendation || '暂无建议' }}
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey q-pa-lg">请选择一份报告进行预览</div>
          </q-card-section>
        </q-card>

        <!-- Editor Panel -->
        <q-card flat bordered class="q-mb-md" v-if="activeTab === 'edit'">
          <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="edit" class="q-mr-sm text-grey-7" />
              报告编辑与批注
            </div>
            <div class="q-gutter-sm">
              <q-btn outline size="sm" icon="save" label="保存草稿" color="grey-8" />
              <q-btn color="primary" size="sm" icon="check_circle" label="提交审核" />
            </div>
          </q-card-section>

          <!-- Editor Toolbar -->
          <div class="bg-grey-2 q-pa-xs row q-gutter-xs border-bottom-light">
            <q-btn flat dense size="sm" icon="format_bold" />
            <q-btn flat dense size="sm" icon="format_italic" />
            <q-btn flat dense size="sm" icon="format_underlined" />
            <q-separator vertical inset />
            <q-btn flat dense size="sm" icon="format_list_bulleted" />
            <q-btn flat dense size="sm" icon="table_chart" />
            <q-btn flat dense size="sm" icon="image" />
            <q-separator vertical inset />
            <q-btn flat dense size="sm" icon="comment" />
            <q-btn flat dense size="sm" icon="highlight" />
          </div>

          <q-card-section class="q-pa-none">
            <q-editor
              v-model="editorContent"
              min-height="250px"
              :toolbar="[]"
              content-class="text-body2"
              flat
            />
          </q-card-section>

          <q-card-section class="border-top-light">
            <div class="row q-gutter-sm items-center">
              <q-select
                v-model="selectedTemplate"
                :options="['建议活检', '建议随访', '建议转诊']"
                dense
                outlined
                class="col-grow"
                label="选择批注模板"
              >
                <template v-slot:prepend><q-icon name="description" /></template>
              </q-select>
              <q-btn outline label="应用模板" color="grey-8" @click="applyTemplate" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Batch Actions -->
    <q-card flat bordered v-if="selectedReports.length > 0">
      <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
        <div class="text-subtitle1 text-weight-bold flex items-center">
          <q-icon name="inventory_2" class="q-mr-sm text-grey-7" />
          批量操作
        </div>
      </q-card-section>
      <q-card-section>
        <div class="bg-blue-1 text-blue-9 q-pa-sm rounded-borders q-mb-md flex items-center">
          <q-icon name="info" class="q-mr-sm" />
          已选择 <strong>&nbsp;{{ selectedReports.length }}&nbsp;</strong> 份报告进行批量操作。
        </div>
        <div class="row q-col-gutter-md items-end">
          <div class="col-md-5 col-sm-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">操作类型</div>
            <q-select
              v-model="batchAction"
              :options="batchActionOptions"
              dense
              outlined
              bg-color="white"
            />
          </div>
          <div class="col-md-3 col-sm-12">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">导出格式</div>
            <q-select
              v-model="exportFormat"
              :options="['PDF', 'Word', 'Excel']"
              dense
              outlined
              bg-color="white"
            />
          </div>
          <div class="col-md-4 col-sm-12">
            <q-btn color="primary" icon="play_arrow" label="执行" class="full-width" />
          </div>
        </div>
        <div class="row q-mt-md text-caption text-grey-7 q-gutter-lg">
          <div class="flex items-center">
            <q-icon name="schedule" class="q-mr-xs" /> 预计处理时间：约
            {{ selectedReports.length * 2 }} 分钟
          </div>
          <div class="flex items-center">
            <q-icon name="folder" class="q-mr-xs" /> 输出位置：系统默认下载文件夹
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// State
const filters = ref({
  patient: '',
  dateRange: '',
  riskLevel: '',
  status: '',
});

interface Report {
  id: string;
  patientName: string;
  age: number;
  patientId: string;
  date: string;
  riskLevel: string;
  status: string;
  confidence: number;
  acetowhite: string;
  iodine: string;
  lesionArea: string;
  recommendation: string;
}

const selectedReports = ref([]);
const activeTab = ref('preview'); // 'preview' or 'edit'
const currentReport = ref<Report | null>(null);
const editorContent = ref('');
const selectedTemplate = ref<string | null>(null);
const batchAction = ref(null);
const exportFormat = ref('PDF');

// Options
const dateOptions = [
  { label: '全部日期', value: '' },
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义', value: 'custom' },
];

const riskOptions = [
  { label: '全部等级', value: '' },
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
];

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已完成', value: 'completed' },
  { label: '待审核', value: 'pending' },
  { label: '草稿', value: 'draft' },
];

const batchActionOptions = [
  '批量导出为PDF',
  '批量打印',
  '批量标记为已完成',
  '批量发送至电子病历系统',
  '批量归档',
];

// Mock Data
const reports = ref([
  {
    id: 'RPT-20251212-001',
    patientName: '张丽',
    age: 42,
    patientId: 'P20251212001',
    date: '2025-12-12',
    riskLevel: 'high',
    status: 'completed',
    confidence: 92,
    acetowhite: '阳性（厚醋白）',
    iodine: '不着色',
    lesionArea: '3点-6点',
    recommendation: '建议行宫颈活检术以明确病理诊断。',
  },
  {
    id: 'RPT-20251211-045',
    patientName: '王芳',
    age: 35,
    patientId: 'P20251211045',
    date: '2025-12-11',
    riskLevel: 'medium',
    status: 'pending',
    confidence: 78,
    acetowhite: '弱阳性',
    iodine: '部分着色',
    lesionArea: '12点方向',
    recommendation: '建议阴道镜下活检。',
  },
  {
    id: 'RPT-20251210-128',
    patientName: '李娜',
    age: 50,
    patientId: 'P20251210128',
    date: '2025-12-10',
    riskLevel: 'low',
    status: 'completed',
    confidence: 95,
    acetowhite: '阴性',
    iodine: '完全着色',
    lesionArea: '无明显病变',
    recommendation: '定期随访。',
  },
  {
    id: 'RPT-20251209-087',
    patientName: '刘霞',
    age: 28,
    patientId: 'P20251209087',
    date: '2025-12-09',
    riskLevel: 'high',
    status: 'completed',
    confidence: 88,
    acetowhite: '阳性',
    iodine: '不着色',
    lesionArea: '全周',
    recommendation: '建议立即转诊。',
  },
  {
    id: 'RPT-20251208-056',
    patientName: '陈静',
    age: 39,
    patientId: 'P20251208056',
    date: '2025-12-08',
    riskLevel: 'medium',
    status: 'draft',
    confidence: 75,
    acetowhite: '可疑',
    iodine: '点状不着色',
    lesionArea: '9点方向',
    recommendation: '建议复查。',
  },
]);

const columns = [
  { name: 'id', label: '报告编号', field: 'id', align: 'left' as const, sortable: true },
  {
    name: 'patientName',
    label: '患者姓名',
    field: 'patientName',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'age', label: '年龄', field: 'age', align: 'left' as const, sortable: true },
  { name: 'date', label: '报告日期', field: 'date', align: 'left' as const, sortable: true },
  {
    name: 'riskLevel',
    label: '风险等级',
    field: 'riskLevel',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'status', label: '状态', field: 'status', align: 'left' as const, sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// Methods
const getRiskColor = (level: string) => {
  if (level === 'high') return 'negative';
  if (level === 'medium') return 'warning';
  return 'positive';
};

const getRiskLabel = (level: string) => {
  if (level === 'high') return '高风险';
  if (level === 'medium') return '中风险';
  return '低风险';
};

const getStatusColor = (status: string) => {
  if (status === 'completed') return 'primary';
  if (status === 'pending') return 'orange';
  return 'grey';
};

const getStatusLabel = (status: string) => {
  if (status === 'completed') return '已完成';
  if (status === 'pending') return '待审核';
  return '草稿';
};

const viewReport = (report: Report) => {
  currentReport.value = report;
  activeTab.value = 'preview';
};

const editReport = (report: Report) => {
  currentReport.value = report;
  editorContent.value = `<p><strong>补充意见：</strong></p><p>${report.recommendation}</p>`;
  activeTab.value = 'edit';
};

const applyTemplate = () => {
  if (selectedTemplate.value) {
    editorContent.value += `<p>${selectedTemplate.value}</p>`;
    selectedTemplate.value = null;
  }
};

const resetFilters = () => {
  filters.value = { patient: '', dateRange: '', riskLevel: '', status: '' };
};

const applyFilters = () => {
  $q.notify({ message: '筛选已应用', color: 'primary', position: 'top' });
};

const refreshReports = () => {
  $q.notify({ message: '列表已刷新', color: 'positive', position: 'top' });
};

onMounted(() => {
  // Select first report by default
  if (reports.value.length > 0 && reports.value[0]) {
    viewReport(reports.value[0]);
  }
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-bottom-light {
  border-bottom: 1px solid #f5f5f5;
}
.border-top-light {
  border-top: 1px solid #f5f5f5;
}
.border-light {
  border: 1px solid #e0e0e0;
}
</style>
