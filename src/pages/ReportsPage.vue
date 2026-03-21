<template>
  <q-page class="reports-page app-gradient-page">
    <!-- 页面标题 -->
    <div class="page-header q-mb-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-h5 text-weight-bold q-mb-xs">
            <q-icon name="description" class="q-mr-sm text-primary" />
            报告中心
          </div>
          <div class="text-subtitle2 text-grey-7">查看历史报告并管理下载记录</div>
        </div>
      </div>
    </div>

    <q-card flat bordered class="modern-card">
      <q-card-section class="card-header">
        <div class="text-h6 text-weight-bold">
          <q-icon name="history" class="q-mr-sm text-primary" />
          近期报告
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="studyStore.completedStudies"
          :columns="reportColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          flat
        >
          <template v-slot:body-cell-studyDate="props">
            <q-td :props="props">
              {{ new Date(props.row.studyDate).toLocaleDateString('zh-CN') }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="report-actions-cell">
              <q-btn flat size="sm" no-caps icon="description" label="查看" color="primary" @click="viewReport(props.row.id)">
                <q-tooltip>查看报告</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" no-caps icon="file_download" label="下载" color="teal" @click="downloadReport(props.row.id)">
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
  try {
    await studyStore.fetchStudies();
  } catch (error) {
    console.error('报告中心加载病例数据失败:', error);
  }
});
</script>

<style scoped lang="scss">
.reports-page {
  padding: 24px 32px;
  min-height: calc(100vh - 64px);
}

.page-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-default);
}

// 操作按钮间距
.report-actions-cell {
  .q-btn + .q-btn {
    margin-left: 4px;
  }
}
</style>

<!-- 暗色模式适配 -->
<style lang="scss">
body.body--dark {
  .reports-page {
    .page-header {
      border-bottom-color: var(--app-border-default);
    }

    .q-table {
      background: var(--app-table-bg);
      color: var(--app-text-primary);
      border-color: var(--app-border-default);

      th {
        color: var(--app-table-header-color);
      }

      tbody tr:hover {
        background: var(--app-table-hover-bg);
      }
    }
  }
}
</style>
