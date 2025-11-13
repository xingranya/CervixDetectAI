<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">病例管理</div>
        <div class="text-subtitle2">管理所有宫颈筛查病例</div>
      </div>
      <div class="col-auto">
        <q-btn 
          color="primary" 
          icon="upload" 
          label="新病例" 
          no-caps
          to="/app/upload"
        />
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
            <q-input 
              borderless 
              dense 
              debounce="300" 
              v-model="filter" 
              placeholder="搜索"
            >
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
              <q-chip
                :color="getStatusColor(props.row.status)"
                text-color="white"
                dense
              >
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn 
                flat 
                size="sm" 
                icon="remove_red_eye" 
                @click="viewStudy(props.row.id)"
                v-if="props.row.status === 'completed'"
              >
                <q-tooltip>查看结果</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                size="sm" 
                icon="schedule" 
                v-else
              >
                <q-tooltip>分析中</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                size="sm" 
                icon="file_download" 
                @click="downloadReport(props.row.id)"
              >
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';
import { useQuasar } from 'quasar';

console.log('📦 [StudiesPage] 组件已初始化');

const router = useRouter();
const studyStore = useStudyStore();
const $q = useQuasar();
const filter = ref('');

console.log('🔍 [StudiesPage] studyStore 已初始化，当前 studies 数量:', studyStore.allStudies.length);

// Define table columns
const studyColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'patientName', label: '患者姓名', field: 'patientName', align: 'left' as const, sortable: true },
  { name: 'patientId', label: '患者ID', field: 'patientId', align: 'left' as const, sortable: true },
  { name: 'studyDate', label: '检查日期', field: 'studyDate', align: 'left' as const, sortable: true },
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' as const, sortable: true },
  { name: 'bodyPart', label: '检查部位', field: 'bodyPart', align: 'left' as const },
  { name: 'status', label: '状态', field: 'status', align: 'center' as const, sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const }
];

// Function to get status color based on status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'processing': return 'orange';
    case 'failed': return 'red';
    default: return 'grey';
  }
};

// Function to view a study
const viewStudy = (id: string) => {
  void router.push(`/app/studies/${id}`);
};

// Function to download report
const downloadReport = (id: string) => {
  $q.notify({
    type: 'info',
    message: `正在生成病例 ${id} 的报告...`,
    position: 'top'
  });
  
  // Simulate report generation and download
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: `病例 ${id} 的报告下载成功！`,
      position: 'top'
    });
  }, 1500);
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