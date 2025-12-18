<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">病例管理</div>
        <div class="text-subtitle2">管理所有宫颈筛查病例</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="upload" label="新病例" no-caps to="/app/upload" />
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <q-table
          :rows="studyStore.allStudies"
          :columns="studyColumns"
          :loading="studyStore.loading"
          row-key="id"
          :filter="filter"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="filter" placeholder="搜索">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:body-cell-studyDate="props">
            <q-td :props="props">
              {{ new Date(props.row.studyDate).toLocaleDateString() }}
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip :color="getStatusColor(props.row.status)" text-color="white" dense>
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat size="sm" icon="remove_red_eye" @click="viewStudy(props.row.id)">
                <q-tooltip>查看详情</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                icon="file_download"
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
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';
import { useQuasar } from 'quasar';
import { getStudyAnalysis } from 'src/services/apiService';

console.log('📦 [StudiesPage] 组件已初始化');

const router = useRouter();
const studyStore = useStudyStore();
const $q = useQuasar();
const filter = ref('');

console.log(
  '🔍 [StudiesPage] studyStore 已初始化，当前 studies 数量:',
  studyStore.allStudies.length,
);

// Define table columns
const studyColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  {
    name: 'patientName',
    label: '患者姓名',
    field: 'patientName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'patientId',
    label: '患者ID',
    field: 'patientId',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'studyDate',
    label: '检查日期',
    field: 'studyDate',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'modality',
    label: '检查方式',
    field: 'modality',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'bodyPart', label: '检查部位', field: 'bodyPart', align: 'left' as const },
  { name: 'status', label: '状态', field: 'status', align: 'center' as const, sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// Function to get status color based on status
const getStatusColor = (status: string) => {
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

// Function to view a study
const viewStudy = (id: number) => {
  console.log('【StudiesPage】点击查看详情，ID:', id, '类型:', typeof id);
  void router.push(`/app/studies/${id}`);
};

// Function to download report
const downloadReport = async (id: string) => {
  try {
    $q.loading.show({
      message: `正在获取病例 ${id} 的数据...`,
      spinnerColor: 'primary',
    });

    // 获取病例和分析数据
    const studyData = await getStudyAnalysis(String(id));

    if (!studyData.result) {
      $q.notify({
        type: 'warning',
        message: '该病例暂无分析结果，无法生成报告',
        position: 'top',
      });
      return;
    }

    $q.loading.show({
      message: '正在生成PDF报告...',
      spinnerColor: 'primary',
    });

    // 使用统一的 PDF 生成工具
    const { generatePDFReport } = await import('../utils/pdfGenerator');
    
    await generatePDFReport({
      study: {
        id: id,
        patientName: studyData.studyInfo.patientName,
        patientId: studyData.studyInfo.patientId,
        studyDate: studyData.studyInfo.studyDate,
        modality: studyData.studyInfo.modality,
      },
      result: studyData.result,
    });

    $q.notify({
      type: 'positive',
      message: '报告已成功下载！',
      position: 'top',
      icon: 'download',
    });
  } catch (error) {
    console.error('生成 PDF 报告失败:', error);
    $q.notify({
      type: 'negative',
      message: '生成报告失败，请稍后重试',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};

// Function to confirm and delete a study
const confirmDelete = (id: string, patientName: string) => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除患者 "${patientName}" 的病例（ID: ${id}）吗？此操作不可恢复。`,
    cancel: {
      label: '取消',
      color: 'grey',
      flat: true,
    },
    ok: {
      label: '删除',
      color: 'negative',
    },
    persistent: true,
  }).onOk(() => {
    void deleteStudy(id);
  });
};

// Function to delete a study
const deleteStudy = async (id: string) => {
  try {
    $q.loading.show({
      message: '正在删除病例...',
      spinnerColor: 'negative',
    });

    await studyStore.deleteStudy(Number(id));

    $q.notify({
      type: 'positive',
      message: '病例已成功删除',
      position: 'top',
      icon: 'check_circle',
    });

    // 刷新病例列表
    await studyStore.fetchStudies();
  } catch (error) {
    console.error('删除病例失败:', error);
    $q.notify({
      type: 'negative',
      message: '删除病例失败，请稍后重试',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};

// Load studies when component mounts
onMounted(async () => {
  console.log('🔥 [StudiesPage] 组件已挂载，开始加载病例数据');
  console.log('📋 [StudiesPage] 当前 studyStore.studies 长度:', studyStore.allStudies.length);

  try {
    await studyStore.fetchStudies();
    console.log('✅ [StudiesPage] 病例数据加载完成');
    console.log('📊 [StudiesPage] 最终 studyStore.studies 长度:', studyStore.allStudies.length);
  } catch (error) {
    console.error('❌ [StudiesPage] 加载病例数据失败:', error);
  }
});
</script>
