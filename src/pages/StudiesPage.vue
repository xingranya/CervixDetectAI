<template>
  <q-page class="q-pa-md app-gradient-page studies-page">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">数据报表</div>
        <div class="text-subtitle2 text-grey-7">管理所有病例与报告</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="upload" label="新病例" no-caps to="/app/upload" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey app-accent-tabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="all" label="全部病例" icon="list" />
        <q-tab name="completed" label="已完成" icon="check_circle">
          <q-badge color="green" floating>{{ completedCount }}</q-badge>
        </q-tab>
        <q-tab name="processing" label="处理中" icon="hourglass_empty">
          <q-badge v-if="processingCount > 0" color="orange" floating>{{ processingCount }}</q-badge>
        </q-tab>
        <q-tab name="failed" label="失败" icon="error">
          <q-badge v-if="failedCount > 0" color="red" floating>{{ failedCount }}</q-badge>
        </q-tab>
      </q-tabs>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row q-gutter-md items-center">
          <div class="col-md-4 col-sm-6 col-xs-12">
            <q-input
              v-model="keyword"
              outlined
              dense
              placeholder="搜索患者姓名、ID..."
              clearable
              debounce="300"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div v-if="patientOptions.length > 0" class="col-md-3 col-sm-6 col-xs-12">
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
              <template #prepend>
                <q-icon name="person" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section class="q-pa-none">
        <q-table
          v-model:pagination="pagination"
          :rows="filteredStudies"
          :columns="studyColumns"
          :loading="studyStore.loading"
          row-key="id"
        >
          <template #body-cell-studyDate="props">
            <q-td :props="props">
              {{ formatDate(props.row.studyDate) }}
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip :color="getStatusColor(props.row.status)" text-color="white" size="sm" dense>
                {{ getStatusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-latestTaskStatus="props">
            <q-td :props="props">
              <q-chip
                :color="getTaskStatusColor(props.row.latestTaskStatus)"
                text-color="white"
                size="sm"
                dense
              >
                {{ getTaskStatusLabel(props.row.latestTaskStatus) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-riskLevel="props">
            <q-td :props="props">
              <q-chip
                :color="getRiskLevelColor(props.row.riskLevel)"
                :text-color="props.row.riskLevel ? 'white' : 'grey-8'"
                size="sm"
                dense
              >
                {{ getRiskLevelLabel(props.row.riskLevel) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-confidence="props">
            <q-td :props="props">
              {{ formatConfidence(props.row.confidence) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="studies-actions-cell">
              <q-btn
                flat
                size="sm"
                no-caps
                icon="visibility"
                label="查看"
                color="primary"
                @click="viewStudy(props.row.id)"
              >
                <q-tooltip>查看详情</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="picture_as_pdf"
                label="报告"
                color="secondary"
                :disable="props.row.status !== 'completed'"
                @click="downloadReport(props.row.id)"
              >
                <q-tooltip>{{
                  props.row.status === 'completed' ? '下载报告' : '等待分析完成'
                }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="delete"
                label="删除"
                color="negative"
                @click="confirmDelete(props.row.id, props.row.patientName)"
              >
                <q-tooltip>删除病例</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { type QTableProps, useQuasar } from 'quasar';
import { downloadStudyReport } from 'src/composables/useStudyReportDownload';
import { useStudyStore } from 'stores/studyStore';
import {
  buildStudiesQuery,
  DEFAULT_STUDIES_QUERY_STATE,
  parseStudiesQuery,
  type StudiesQueryState,
} from 'src/utils/studiesQuery';

const router = useRouter();
const route = useRoute();
const studyStore = useStudyStore();
const $q = useQuasar();

const MANAGED_QUERY_KEYS = ['status', 'patient_id', 'keyword', 'page', 'rowsPerPage'] as const;

const queryState = ref<StudiesQueryState>({ ...DEFAULT_STUDIES_QUERY_STATE });
const syncingFromRoute = ref(false);

const pagination = ref<QTableProps['pagination']>({
  page: DEFAULT_STUDIES_QUERY_STATE.page,
  rowsPerPage: DEFAULT_STUDIES_QUERY_STATE.rowsPerPage,
  rowsNumber: 0,
  sortBy: 'studyDate',
  descending: true,
});

const isSameQueryState = (left: StudiesQueryState, right: StudiesQueryState) =>
  left.status === right.status &&
  left.patientId === right.patientId &&
  left.keyword === right.keyword &&
  left.page === right.page &&
  left.rowsPerPage === right.rowsPerPage;

const isSamePagination = (
  left: QTableProps['pagination'] | undefined,
  right: QTableProps['pagination'] | undefined,
) =>
  left?.page === right?.page &&
  left?.rowsPerPage === right?.rowsPerPage &&
  left?.rowsNumber === right?.rowsNumber &&
  left?.sortBy === right?.sortBy &&
  left?.descending === right?.descending;

const setQueryState = (nextState: StudiesQueryState) => {
  if (isSameQueryState(queryState.value, nextState)) return;
  queryState.value = nextState;
};

const setPagination = (nextPagination: QTableProps['pagination']) => {
  if (isSamePagination(pagination.value, nextPagination)) return;
  pagination.value = nextPagination;
};

const studyColumns: QTableProps['columns'] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'patientName', label: '患者姓名', field: 'patientName', align: 'left', sortable: true },
  { name: 'patientId', label: '患者ID', field: 'patientId', align: 'left' },
  { name: 'studyDate', label: '检查日期', field: 'studyDate', align: 'left', sortable: true },
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' },
  { name: 'status', label: '状态', field: 'status', align: 'center', sortable: true },
  {
    name: 'latestTaskStatus',
    label: '任务状态',
    field: 'latestTaskStatus',
    align: 'center',
    sortable: true,
  },
  { name: 'riskLevel', label: '风险等级', field: 'riskLevel', align: 'center' },
  { name: 'confidence', label: '置信度', field: 'confidence', align: 'center' },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' },
];

const activeTab = computed<StudiesQueryState['status']>({
  get: () => queryState.value.status,
  set: (value) => {
    setQueryState({ ...queryState.value, status: value, page: 1 });
  },
});

const keyword = computed<string>({
  get: () => queryState.value.keyword,
  set: (value) => {
    setQueryState({ ...queryState.value, keyword: value, page: 1 });
  },
});

const selectedPatientId = computed<number | null>({
  get: () => queryState.value.patientId,
  set: (value) => {
    setQueryState({ ...queryState.value, patientId: value, page: 1 });
  },
});

const patientOptions = computed(() => {
  const patients = new Map<number, string>();
  studyStore.allStudies.forEach((study) => {
    if (study.patient_id && study.patientName) {
      patients.set(study.patient_id, study.patientName);
    }
  });

  return Array.from(patients.entries()).map(([id, name]) => ({
    value: id,
    label: name,
  }));
});

const completedCount = computed(
  () => studyStore.allStudies.filter((study) => study.status === 'completed').length,
);
const processingCount = computed(
  () => studyStore.allStudies.filter((study) => study.status === 'processing').length,
);
const failedCount = computed(
  () => studyStore.allStudies.filter((study) => study.status === 'failed').length,
);

const filteredStudies = computed(() => {
  let result = studyStore.allStudies;

  if (queryState.value.status !== 'all') {
    result = result.filter((study) => study.status === queryState.value.status);
  }

  if (queryState.value.patientId) {
    result = result.filter((study) => study.patient_id === queryState.value.patientId);
  }

  if (queryState.value.keyword.trim()) {
    const normalizedKeyword = queryState.value.keyword.trim().toLowerCase();
    result = result.filter(
      (study) =>
        study.patientName?.toLowerCase().includes(normalizedKeyword) ||
        study.patientId?.toLowerCase().includes(normalizedKeyword) ||
        study.modality?.toLowerCase().includes(normalizedKeyword),
    );
  }

  return result;
});

const applyRouteQueryState = (nextState: StudiesQueryState) => {
  syncingFromRoute.value = true;
  setQueryState(nextState);
  setPagination({
    ...pagination.value,
    page: nextState.page,
    rowsPerPage: nextState.rowsPerPage,
  });
  syncingFromRoute.value = false;
};

const syncRouteWithQueryState = async () => {
  const nextQuery = buildStudiesQuery(queryState.value);
  const mergedQuery = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !MANAGED_QUERY_KEYS.includes(key as never)),
  );

  const currentManagedQuery = Object.fromEntries(
    MANAGED_QUERY_KEYS.map((key) => [key, route.query[key]]),
  );
  const expectedManagedQuery = {
    status: nextQuery.status,
    patient_id: nextQuery.patient_id,
    keyword: nextQuery.keyword,
    page: nextQuery.page,
    rowsPerPage: nextQuery.rowsPerPage,
  };

  if (JSON.stringify(currentManagedQuery) === JSON.stringify(expectedManagedQuery)) {
    return;
  }

  await router.replace({
    query: {
      ...mergedQuery,
      ...nextQuery,
    },
  });
};

watch(
  () => route.query,
  (routeQuery) => {
    applyRouteQueryState(parseStudiesQuery(routeQuery));
  },
  { immediate: true },
);

watch(
  queryState,
  async () => {
    if (syncingFromRoute.value) return;
    await syncRouteWithQueryState();
  },
  { deep: true },
);

watch(
  () =>
    [
      pagination.value?.page ?? DEFAULT_STUDIES_QUERY_STATE.page,
      pagination.value?.rowsPerPage ?? DEFAULT_STUDIES_QUERY_STATE.rowsPerPage,
    ] as const,
  ([page, rowsPerPage]) => {
    if (syncingFromRoute.value) return;

    if (
      queryState.value.page === page &&
      queryState.value.rowsPerPage === rowsPerPage
    ) {
      return;
    }

    setQueryState({
      ...queryState.value,
      page,
      rowsPerPage,
    });
  },
);

watch(
  () =>
    ({
      rowsNumber: filteredStudies.value.length,
      currentPage: queryState.value.page,
      rowsPerPage: pagination.value?.rowsPerPage ?? DEFAULT_STUDIES_QUERY_STATE.rowsPerPage,
    }),
  ({ rowsNumber, currentPage, rowsPerPage }) => {
    const maxPage = Math.max(1, Math.ceil(rowsNumber / rowsPerPage));
    const nextPage = Math.min(currentPage, maxPage);

    setPagination({
      ...pagination.value,
      rowsNumber,
      page: nextPage,
      rowsPerPage,
    });

    if (nextPage !== currentPage) {
      setQueryState({
        ...queryState.value,
        page: nextPage,
      });
    }
  },
  { immediate: true },
);

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatConfidence = (confidence: unknown): string => {
  if (confidence === null || confidence === undefined) return '-';

  const raw = typeof confidence === 'number' ? confidence : Number(confidence);
  if (!Number.isFinite(raw) || raw < 0) return '-';

  const normalized = raw > 1 && raw <= 100 ? raw / 100 : raw;
  if (normalized > 1) return '-';

  return `${Math.round(normalized * 100)}%`;
};

const getStatusColor = (status: string): string => {
  if (status === 'completed') return 'green';
  if (status === 'processing') return 'orange';
  if (status === 'failed') return 'red';
  return 'grey';
};

const getStatusLabel = (status: string): string => {
  if (status === 'completed') return '已完成';
  if (status === 'processing') return '处理中';
  if (status === 'failed') return '失败';
  if (status === 'pending') return '待处理';
  return status;
};

const getTaskStatusColor = (status: string | undefined): string => {
  if (status === 'SUCCESS') return 'green';
  if (status === 'PROCESSING') return 'orange';
  if (status === 'FAILED') return 'red';
  if (status === 'PENDING') return 'grey';
  return 'grey-5';
};

const getTaskStatusLabel = (status: string | undefined): string => {
  if (status === 'SUCCESS') return '成功';
  if (status === 'PROCESSING') return '处理中';
  if (status === 'FAILED') return '失败';
  if (status === 'PENDING') return '待处理';
  return '暂无任务';
};

const getRiskLevelColor = (riskLevel: string | undefined): string => {
  if (riskLevel === 'critical') return 'deep-orange';
  if (riskLevel === 'high') return 'red';
  if (riskLevel === 'medium') return 'orange';
  if (riskLevel === 'low') return 'green';
  return 'grey-3';
};

const getRiskLevelLabel = (riskLevel: string | undefined): string => {
  if (riskLevel === 'critical') return '极高';
  if (riskLevel === 'high') return '高';
  if (riskLevel === 'medium') return '中';
  if (riskLevel === 'low') return '低';
  return '未评估';
};

const viewStudy = (id: number) => {
  void router.push(`/app/studies/${id}`);
};

const downloadReport = async (id: number) => {
  await downloadStudyReport({ id, $q });
};

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
      } catch (error) {
        console.error('删除病例失败:', error);
        $q.notify({ type: 'negative', message: '删除病例失败，请稍后重试', position: 'top' });
      } finally {
        $q.loading.hide();
      }
    })();
  });
};

onMounted(async () => {
  try {
    const batchQuery = route.query.batch;
    const batchId = Array.isArray(batchQuery) ? batchQuery[0] : batchQuery;
    if (typeof batchId === 'string' && batchId) {
      $q.notify({
        type: 'info',
        message: `批量任务已提交（批次: ${batchId}）`,
        position: 'top',
        timeout: 2500,
      });
    }

    await studyStore.fetchStudies();
  } catch (error) {
    console.error('加载病例数据失败:', error);
  }
});
</script>

<style scoped lang="scss">
.studies-actions-cell {
  .q-btn + .q-btn {
    margin-left: 4px;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .studies-page {
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

    .q-input {
      .q-field__control {
        background: var(--app-elevated-bg);
      }
    }

    .q-select {
      .q-field__control {
        background: var(--app-elevated-bg);
      }
    }

    .dialog-header {
      background: var(--app-elevated-bg);
      border-bottom: 1px solid var(--app-border-default);
      color: var(--app-text-primary);

      .text-h6 {
        color: var(--app-text-primary);
      }
    }
  }
}
</style>
