<template>
  <q-page class="patients-page app-gradient-page">
    <!-- 页面标题 -->
    <div class="page-header q-mb-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-h5 text-weight-bold">
            <q-icon name="people" class="q-mr-sm text-primary" />
            患者管理
          </div>
          <div class="text-subtitle2 text-grey-7">管理所有患者信息</div>
        </div>
        <div class="col-auto q-gutter-sm">
          <q-btn
            outline
            color="primary"
            icon="upload_file"
            label="导入患者"
            no-caps
            @click="showImportDialog = true"
          />
          <q-btn
            color="primary"
            icon="person_add"
            label="新增患者"
            no-caps
            @click="openAddDialog"
          />
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <q-card flat bordered class="modern-card q-mb-md">
      <q-card-section class="card-header q-py-sm">
        <div class="row items-center no-wrap">
          <q-icon name="search" class="q-mr-sm text-primary" />
          <span class="text-subtitle2 text-weight-medium">搜索筛选</span>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-py-md">
        <div class="row q-gutter-md items-center">
          <div class="col-md-4 col-sm-6 col-xs-12">
            <q-input
              v-model="searchKeyword"
              outlined
              dense
              placeholder="搜索患者姓名、电话、身份证号..."
              clearable
              @keyup.enter="handleSearch"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="primary" label="搜索" @click="handleSearch" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 患者列表 -->
    <q-card flat bordered class="modern-card">
      <q-card-section class="card-header q-pb-none">
        <div class="row items-center no-wrap">
          <q-icon name="list" class="q-mr-sm text-primary" />
          <span class="text-subtitle2 text-weight-medium">患者列表</span>
          <span class="text-caption text-grey-6 q-ml-sm"
            >({{ patientStore.allPatients.length }} 条记录)</span
          >
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="patientStore.allPatients"
          :columns="columns"
          :loading="patientStore.loading"
          row-key="id"
          v-model:pagination="pagination"
          @request="onRequest"
          flat
        >
          <!-- 性别列 -->
          <template v-slot:body-cell-gender="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.gender === 'female' ? 'pink-4' : 'blue-4'"
                text-color="white"
                size="sm"
                dense
              >
                {{ props.row.gender === 'female' ? '女' : '男' }}
              </q-chip>
            </q-td>
          </template>

          <!-- 出生日期/年龄列 -->
          <template v-slot:body-cell-birthDate="props">
            <q-td :props="props">
              {{ formatDate(props.row.birthDate) }}
              <span class="text-grey-6">（{{ calculateAge(props.row.birthDate) }}岁）</span>
            </q-td>
          </template>

          <!-- 性生活习惯列 -->
          <template v-slot:body-cell-sexualHistory="props">
            <q-td :props="props">
              {{ getSexualHistoryLabel(props.row.sexualHistory) }}
            </q-td>
          </template>

          <!-- 操作列 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="patient-actions-cell">
              <q-btn
                flat
                size="sm"
                no-caps
                icon="visibility"
                label="查看"
                color="primary"
                @click="viewPatient(props.row)"
              >
                <q-tooltip>查看详情</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="edit"
                label="编辑"
                color="secondary"
                @click="editPatient(props.row)"
              >
                <q-tooltip>编辑</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="folder_open"
                label="病例"
                color="teal"
                @click="viewStudies(props.row.id)"
              >
                <q-tooltip>查看病例</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="insights"
                label="洞察"
                color="indigo"
                @click="viewInsights(props.row.id)"
              >
                <q-tooltip>患者洞察</q-tooltip>
              </q-btn>
              <q-btn
                flat
                size="sm"
                no-caps
                icon="delete"
                label="删除"
                color="negative"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- 空状态 -->
          <template v-slot:no-data>
            <div class="full-width column flex-center q-pa-lg text-grey-6">
              <q-icon name="people" size="64px" class="q-mb-md" />
              <div class="text-h6">暂无患者数据</div>
              <div class="text-body2">点击右上角"新增患者"添加第一位患者</div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 新增/编辑患者对话框 -->
    <q-dialog v-model="showFormDialog" persistent>
      <q-card style="width: 700px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none dialog-header">
          <div class="text-h6">{{ isEditing ? '编辑患者' : '新增患者' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md q-px-lg" style="max-height: 70vh; overflow-y: auto">
          <PatientForm
            v-model="formData"
            :is-editing="isEditing"
            @submit="handleFormSubmit"
            @cancel="showFormDialog = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 批量导入患者对话框 -->
    <PatientImportDialog v-model="showImportDialog" @imported="handleImportCompleted" />

    <!-- 查看患者详情对话框 -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none dialog-header">
          <div class="text-h6">患者详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedPatient">
          <PatientDetail :patient="selectedPatient" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePatientStore } from 'stores/patientStore';
import {
  sexualHistoryOptions,
  type Patient,
  type CreatePatientRequest,
} from 'src/services/patientService';
import PatientForm from 'components/patients/PatientForm.vue';
import PatientDetail from 'components/patients/PatientDetail.vue';
import PatientImportDialog from 'components/patients/PatientImportDialog.vue';

const router = useRouter();
const $q = useQuasar();
const patientStore = usePatientStore();

// 搜索关键词
const searchKeyword = ref('');

// 分页配置
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

// 表格列定义
const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'name', label: '姓名', field: 'name', align: 'left' as const, sortable: true },
  { name: 'gender', label: '性别', field: 'gender', align: 'center' as const },
  {
    name: 'birthDate',
    label: '出生日期',
    field: 'birthDate',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'phone', label: '联系电话', field: 'phone', align: 'left' as const },
  { name: 'sexualHistory', label: '性生活习惯', field: 'sexualHistory', align: 'left' as const },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// 对话框状态
const showImportDialog = ref(false);
const showFormDialog = ref(false);
const showDetailDialog = ref(false);
const isEditing = ref(false);
const selectedPatient = ref<Patient | null>(null);

// 表单数据
const formData = ref<CreatePatientRequest>({
  name: '',
  gender: 'female',
  birthDate: '',
  phone: '',
  sexualHistory: 'none',
});

// 初始化空表单
const initFormData = (): CreatePatientRequest => ({
  name: '',
  gender: 'female',
  birthDate: '',
  phone: '',
  sexualHistory: 'none',
});

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 计算年龄
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 获取性生活习惯标签
const getSexualHistoryLabel = (value: string): string => {
  const option = sexualHistoryOptions.find((o) => o.value === value);
  return option?.label || value;
};

// 搜索
const handleSearch = () => {
  void patientStore.fetchPatients({ search: searchKeyword.value, page: 1 });
};

// 分页请求
const onRequest = async (props: { pagination: { page: number; rowsPerPage: number } }) => {
  const { page, rowsPerPage } = props.pagination;

  await patientStore.fetchPatients({
    page,
    limit: rowsPerPage,
    search: searchKeyword.value,
  });

  // 更新本地分页状态
  pagination.value.page = patientStore.pagination.page;
  pagination.value.rowsPerPage = patientStore.pagination.limit;
  pagination.value.rowsNumber = patientStore.pagination.total;
};

// 打开新增对话框
const openAddDialog = () => {
  isEditing.value = false;
  formData.value = initFormData();
  showFormDialog.value = true;
};

// 编辑患者
const editPatient = (patient: Patient) => {
  isEditing.value = true;
  selectedPatient.value = patient;
  formData.value = { ...patient };
  showFormDialog.value = true;
};

// 查看患者详情
const viewPatient = (patient: Patient) => {
  selectedPatient.value = patient;
  showDetailDialog.value = true;
};

// 查看患者病例
const viewStudies = (patientId: number) => {
  void router.push({ path: '/app/studies', query: { patient_id: patientId.toString() } });
};

// 查看患者洞察
const viewInsights = (patientId: number) => {
  void router.push(`/app/patients/${patientId}/insights`);
};

// 表单提交
const handleFormSubmit = async (data: CreatePatientRequest) => {
  try {
    if (isEditing.value && selectedPatient.value) {
      await patientStore.editPatient(selectedPatient.value.id, data);
      $q.notify({ type: 'positive', message: '患者信息更新成功', position: 'top' });
    } else {
      await patientStore.addPatient(data);
      $q.notify({ type: 'positive', message: '患者添加成功', position: 'top' });
    }
    showFormDialog.value = false;
  } catch {
    $q.notify({
      type: 'negative',
      message: isEditing.value ? '更新失败，请重试' : '添加失败，请重试',
      position: 'top',
    });
  }
};

// 确认删除
const confirmDelete = (patient: Patient) => {
  $q.dialog({
    title: '确认删除',
    message: `确定要删除患者"${patient.name}"吗？此操作不可恢复。`,
    cancel: { label: '取消', color: 'grey', flat: true },
    ok: { label: '删除', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await patientStore.removePatient(patient.id);
        $q.notify({ type: 'positive', message: '患者已删除', position: 'top' });
      } catch {
        $q.notify({ type: 'negative', message: '删除失败，请重试', position: 'top' });
      }
    })();
  });
};

// 导入完成后刷新列表
const handleImportCompleted = () => {
  void onRequest({ pagination: pagination.value });
};

// 组件挂载时加载数据
onMounted(() => {
  void onRequest({ pagination: pagination.value });
});
</script>

<style scoped lang="scss">
.patients-page {
  padding: 24px 32px;
  min-height: calc(100vh - 64px);
}

.page-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-default);
}

// 操作按钮间距统一
.patient-actions-cell {
  .q-btn + .q-btn {
    margin-left: 4px;
  }
}
</style>

<!-- 暗色模式适配 -->
<style lang="scss">
body.body--dark {
  .patients-page {
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

    // 对话框标题栏暗色统一
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
