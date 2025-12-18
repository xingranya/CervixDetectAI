<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">报告中心</div>
        <p>查看历史报告并管理下载记录</p>
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">近期报告</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="studyStore.completedStudies"
          :columns="reportColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-studyDate="props">
            <q-td :props="props">
              {{ new Date(props.row.studyDate).toLocaleDateString() }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat size="sm" icon="description" @click="viewReport(props.row.id)">
                <q-tooltip>查看报告</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" icon="file_download" @click="downloadReport(props.row.id)">
                <q-tooltip>下载报告</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';
import { useQuasar } from 'quasar';
import { getStudyAnalysis } from 'src/services/apiService';

console.log('【ReportsPage】 组件已初始化');

const router = useRouter();
const studyStore = useStudyStore();
const $q = useQuasar();

// 报告表格列定义
const reportColumns = [
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
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' as const },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// 查看报告
const viewReport = (id: string) => {
  void router.push(`/app/studies/${id}`);
};

// 下载报告
const downloadReport = async (id: string) => {
  try {
    $q.loading.show({
      message: `正在获取病例 ${id} 的数据...`,
      spinnerColor: 'primary',
    });

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

// 组件挂载时加载数据
onMounted(async () => {
  console.log('【ReportsPage】 组件已挂载，开始加载病例数据');

  try {
    await studyStore.fetchStudies();
    console.log('【ReportsPage】 病例数据加载完成');
  } catch (error) {
    console.error('【ReportsPage】 加载病例数据失败:', error);
  }
});
</script>