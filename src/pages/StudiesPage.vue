<template>
  <q-page class="q-pa-md">
    <!-- 页面标题 -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">数据报表</div>
        <div class="text-subtitle2 text-grey-7">管理所有病例与报告</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="upload" label="新病例" no-caps to="/app/upload" />
      </div>
    </div>

    <!-- Tab 切换 -->
    <q-card flat bordered class="q-mb-md">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="all" label="全部病例" icon="list" />
        <q-tab name="completed" label="已完成" icon="check_circle">
          <q-badge color="green" floating>{{ completedCount }}</q-badge>
        </q-tab>
        <q-tab name="processing" label="处理中" icon="hourglass_empty">
          <q-badge color="orange" floating v-if="processingCount > 0">{{
            processingCount
          }}</q-badge>
        </q-tab>
        <q-tab name="failed" label="失败" icon="error">
          <q-badge color="red" floating v-if="failedCount > 0">{{ failedCount }}</q-badge>
        </q-tab>
      </q-tabs>
    </q-card>

    <!-- 搜索和筛选 -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row q-gutter-md items-center">
          <div class="col-md-4 col-sm-6 col-xs-12">
            <q-input
              v-model="filter"
              outlined
              dense
              placeholder="搜索患者姓名、ID..."
              clearable
              debounce="300"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12" v-if="patientOptions.length > 0">
            <q-select
              v-model="selectedPatientId"
              outlined
              dense
              :options="patientOptions"
              label="按患者筛选"
              emit-value
              map-options
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 数据表格 -->
    <q-card flat bordered>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="filteredStudies"
          :columns="studyColumns"
          :loading="studyStore.loading"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <!-- 检查日期列 -->
          <template v-slot:body-cell-studyDate="props">
            <q-td :props="props">
              {{ formatDate(props.row.studyDate) }}
            </q-td>
          </template>

          <!-- 状态列 -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip :color="getStatusColor(props.row.status)" text-color="white" size="sm" dense>
                {{ getStatusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <!-- 操作列 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                size="sm"
                icon="visibility"
                color="primary"
                @click="viewStudy(props.row.id)"
              >
                <q-tooltip>查看详情</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                icon="picture_as_pdf"
                color="secondary"
                @click="downloadReport(props.row.id)"
                :disable="props.row.status !== 'completed'"
              >
                <q-tooltip>{{
                  props.row.status === 'completed' ? '下载报告' : '等待分析完成'
                }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row.id, props.row.patientName)"
              >
                <q-tooltip>删除病例</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- 空状态 -->
          <template v-slot:no-data>
            <div class="full-width column flex-center q-pa-lg text-grey-6">
              <q-icon name="folder_open" size="64px" class="q-mb-md" />
              <div class="text-h6">暂无病例数据</div>
              <div class="text-body2">点击右上角"新病例"上传第一个病例</div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';
import { useQuasar } from 'quasar';
import { getStudyAnalysis } from 'src/services/apiService';

const router = useRouter();
const route = useRoute();
const studyStore = useStudyStore();
const $q = useQuasar();

// Tab 状态
const activeTab = ref('all');
const filter = ref('');
const selectedPatientId = ref<number | null>(null);

// 表格列定义
const studyColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  {
    name: 'patientName',
    label: '患者姓名',
    field: 'patientName',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'patientId', label: '患者ID', field: 'patientId', align: 'left' as const },
  {
    name: 'studyDate',
    label: '检查日期',
    field: 'studyDate',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' as const },
  { name: 'status', label: '状态', field: 'status', align: 'center' as const, sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// 患者筛选选项
const patientOptions = computed(() => {
  const patients = new Map<number, string>();
  studyStore.allStudies.forEach((s) => {
    if (s.patient_id && s.patientName) {
      patients.set(s.patient_id, s.patientName);
    }
  });
  return Array.from(patients.entries()).map(([id, name]) => ({
    value: id,
    label: name,
  }));
});

// 统计数量
const completedCount = computed(
  () => studyStore.allStudies.filter((s) => s.status === 'completed').length,
);
const processingCount = computed(
  () => studyStore.allStudies.filter((s) => s.status === 'processing').length,
);
const failedCount = computed(
  () => studyStore.allStudies.filter((s) => s.status === 'failed').length,
);

// 根据 Tab 和筛选条件过滤数据
const filteredStudies = computed(() => {
  let result = studyStore.allStudies;

  // Tab 筛选
  if (activeTab.value !== 'all') {
    result = result.filter((s) => s.status === activeTab.value);
  }

  // 患者筛选
  if (selectedPatientId.value) {
    result = result.filter((s) => s.patient_id === selectedPatientId.value);
  }

  // 搜索筛选
  if (filter.value) {
    const keyword = filter.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.patientName?.toLowerCase().includes(keyword) ||
        s.patientId?.toLowerCase().includes(keyword) ||
        s.modality?.toLowerCase().includes(keyword),
    );
  }

  return result;
});

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 获取状态颜色
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'processing':
      return 'orange';
    case 'failed':
      return 'red';
    default:
      return 'grey';
  }
};

// 获取状态标签
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'processing':
      return '处理中';
    case 'failed':
      return '失败';
    case 'pending':
      return '待处理';
    default:
      return status;
  }
};

// 查看病例详情
const viewStudy = (id: number) => {
  void router.push(`/app/studies/${id}`);
};

// 下载报告
const downloadReport = async (id: number) => {
  try {
    $q.loading.show({ message: '正在获取病例数据...', spinnerColor: 'primary' });

    const studyData = await getStudyAnalysis(String(id));

    if (!studyData.result) {
      $q.notify({ type: 'warning', message: '该病例暂无分析结果，无法生成报告', position: 'top' });
      return;
    }

    $q.loading.show({ message: '正在生成PDF报告...', spinnerColor: 'primary' });

    const { generatePDFReport } = await import('../utils/pdfGenerator');

    await generatePDFReport({
      study: {
        id: String(id),
        patientName: studyData.studyInfo.patientName,
        patientId: studyData.studyInfo.patientId,
        studyDate: studyData.studyInfo.studyDate,
        modality: studyData.studyInfo.modality,
      },
      result: studyData.result,
    });

    $q.notify({ type: 'positive', message: '报告已成功下载！', position: 'top', icon: 'download' });
  } catch (error) {
    console.error('生成 PDF 报告失败:', error);
    $q.notify({ type: 'negative', message: '生成报告失败，请稍后重试', position: 'top' });
  } finally {
    $q.loading.hide();
  }
};

// 确认删除
const confirmDelete = (id: number, patientName: string) => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除患者"${patientName}"的病例（ID: ${id}）吗？此操作不可恢复。`,
    cancel: { label: '取消', color: 'grey', flat: true },
    ok: { label: '删除', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        $q.loading.show({ message: '正在删除病例...', spinnerColor: 'negative' });
        await studyStore.deleteStudy(id);
        $q.notify({
          type: 'positive',
          message: '病例已成功删除',
          position: 'top',
          icon: 'check_circle',
        });
        await studyStore.fetchStudies();
      } catch (error) {
        console.error('删除病例失败:', error);
        $q.notify({ type: 'negative', message: '删除病例失败，请稍后重试', position: 'top' });
      } finally {
        $q.loading.hide();
      }
    })();
  });
};

// 监听路由参数（支持从患者页面跳转）
watch(
  () => route.query.patient_id,
  (newVal) => {
    if (newVal) {
      selectedPatientId.value = Number(newVal);
    }
  },
  { immediate: true },
);

// 组件挂载时加载数据
onMounted(async () => {
  try {
    await studyStore.fetchStudies();
  } catch (error) {
    console.error('加载病例数据失败:', error);
  }
});
</script>
