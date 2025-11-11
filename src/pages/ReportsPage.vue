<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">报告中心</div>
        <p>访问和下载已完成病例的分析报告。</p>
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
              <q-btn 
                flat 
                size="sm" 
                icon="description" 
                @click="viewReport(props.row.id)"
              >
                <q-tooltip>查看报告</q-tooltip>
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
import { useRouter } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';

const router = useRouter();
const studyStore = useStudyStore();

// Define table columns for reports
const reportColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'patientName', label: '患者姓名', field: 'patientName', align: 'left' as const, sortable: true },
  { name: 'patientId', label: '患者ID', field: 'patientId', align: 'left' as const, sortable: true },
  { name: 'studyDate', label: '检查日期', field: 'studyDate', align: 'left' as const, sortable: true },
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' as const },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const }
];

// Function to view a report
const viewReport = (id: string) => {
  void router.push(`/app/studies/${id}`);
};

// Function to download a report
const downloadReport = (id: string) => {
  // In a real app, this would download the actual report
  console.log(`下载病例 ${id} 的报告`);
  alert(`下载功能将在实际应用中实现，病例 ${id}`);
};
</script>