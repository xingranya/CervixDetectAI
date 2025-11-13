<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Welcome Banner -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white">
            <div class="text-h5">仪表盘</div>
            <div class="text-subtitle2">
              欢迎回来，{{
                authStore.currentUser?.real_name || authStore.currentUser?.username || '用户'
              }}
            </div>
          </q-card-section>
          <q-card-section>
            <div class="row items-center">
              <div class="col-8">
                <p class="q-my-none">AI驱动的宫颈癌筛查仪表盘。上传患者图像以进行即时分析。</p>
              </div>
              <div class="col-4 flex justify-end">
                <q-btn color="primary" icon="upload" label="新分析" no-caps to="/app/upload" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Stats Cards -->
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-card flat bordered class="text-center">
              <q-card-section class="bg-blue-1">
                <q-icon name="folder" size="3rem" color="blue" />
              </q-card-section>
              <q-card-section>
                <div class="text-h6 text-weight-bold">{{ studyStore.allStudies.length }}</div>
                <div class="text-caption text-grey">研究总数</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-card flat bordered class="text-center">
              <q-card-section class="bg-green-1">
                <q-icon name="check_circle" size="3rem" color="green" />
              </q-card-section>
              <q-card-section>
                <div class="text-h6 text-weight-bold">{{ studyStore.completedStudies.length }}</div>
                <div class="text-caption text-grey">已完成</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-card flat bordered class="text-center">
              <q-card-section class="bg-orange-1">
                <q-icon name="schedule" size="3rem" color="orange" />
              </q-card-section>
              <q-card-section>
                <div class="text-h6 text-weight-bold">
                  {{ studyStore.processingStudies.length }}
                </div>
                <div class="text-caption text-grey">处理中</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-card flat bordered class="text-center">
              <q-card-section class="bg-purple-1">
                <q-icon name="notifications" size="3rem" color="purple" />
              </q-card-section>
              <q-card-section>
                <div class="text-h6 text-weight-bold">3</div>
                <div class="text-caption text-grey">提醒</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Recent Studies and Quick Actions -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">近期研究</div>
              </div>
              <div class="col-auto">
                <q-btn flat no-caps color="primary" to="/app/studies" label="查看全部" />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-table
              :rows="studyStore.recentStudies"
              :columns="studyColumns"
              :loading="studyStore.loading"
              row-key="id"
              hide-bottom
              :pagination="{ rowsPerPage: 5 }"
            >
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip :color="getStatusColor(props.row.status)" text-color="white" dense>
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
                  <q-btn flat size="sm" icon="schedule" v-else>
                    <q-tooltip>分析中</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">快捷操作</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-list>
              <q-item clickable v-ripple to="/app/upload">
                <q-item-section avatar>
                  <q-icon color="primary" name="upload" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>上传新研究</q-item-label>
                  <q-item-label caption>上传宫颈图像进行分析</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/app/studies">
                <q-item-section avatar>
                  <q-icon color="secondary" name="folder" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>查看所有研究</q-item-label>
                  <q-item-label caption>浏览所有患者研究</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/app/reports">
                <q-item-section avatar>
                  <q-icon color="accent" name="description" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>查看报告</q-item-label>
                  <q-item-label caption>访问分析报告</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/app/models">
                <q-item-section avatar>
                  <q-icon color="teal" name="smart_toy" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>AI模型状态</q-item-label>
                  <q-item-label caption>检查模型性能</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/authStore';
import { useStudyStore } from 'stores/studyStore';

const router = useRouter();
const authStore = useAuthStore();
const studyStore = useStudyStore();

// Define table columns
const studyColumns = [
  {
    name: 'patientName',
    label: '患者',
    field: 'patientName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'studyDate',
    label: '日期',
    field: 'studyDate',
    align: 'left' as const,
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString(),
  },
  { name: 'modality', label: '检查方式', field: 'modality', align: 'left' as const },
  { name: 'status', label: '状态', field: 'status', align: 'left' as const },
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
const viewStudy = (id: string) => {
  void router.push(`/app/studies/${id}`);
};

// Load studies when component mounts
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await studyStore.fetchStudies();
  }
});
</script>
