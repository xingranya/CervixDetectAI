<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">AI模型</div>
        <p>监控和管理用于宫颈癌检测的AI模型。</p>
        <q-btn
          color="primary"
          label="上传新模型"
          icon="upload"
          class="q-mb-md"
          @click="showUploadDialog = true"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-primary text-white">
            <q-icon name="smart_toy" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">CervixDetectAI v2.1</div>
            <div class="text-caption text-grey">当前模型</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-6 text-center">
                <div class="text-bold">95.22%</div>
                <div class="text-caption text-grey">准确率</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-bold">92.13%</div>
                <div class="text-caption text-grey">敏感性</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-secondary text-white">
            <q-icon name="memory" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">性能</div>
            <div class="text-caption text-grey">资源利用</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-6 text-center">
                <div class="text-bold">28.48s</div>
                <div class="text-caption text-grey">平均推理时间</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-bold">12.68GB</div>
                <div class="text-caption text-grey">内存使用</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-accent text-white">
            <q-icon name="trending_up" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">更新</div>
            <div class="text-caption text-grey">模型改进</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-bold">最新版本: v2.1.3</div>
            <q-btn color="primary" label="检查更新" class="q-mt-md" size="sm" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-h6">模型信息</div>
      </q-card-section>
      <q-card-section>
        <p>
          CervixDetectAI模型使用专为宫颈细胞学分析优化的深度学习架构。
          它已在来自多个临床站点的超过10万个带注释的宫颈图像上进行了训练。
        </p>

        <div class="text-h6 q-mt-md">技术规格</div>
        <ul class="q-mt-sm">
          <li><strong>架构:</strong> 以EfficientNet为骨干的自定义CNN</li>
          <li><strong>输入:</strong> 高分辨率宫颈图像 (1024x1024像素)</li>
          <li>
            <strong>输出:</strong> 分类 (正常, ASC-US, LSIL, HSIL, 癌症), 生物标志物检测,
            异常区域定位
          </li>
          <li><strong>训练数据:</strong> 10万个+带注释的图像</li>
          <li><strong>验证准确率:</strong> 95.2%</li>
          <li><strong>监管状态:</strong> FDA注册, CE认证</li>
        </ul>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-h6">云端模型库</div>
      </q-card-section>
      <q-card-section>
        <q-table :rows="models" :columns="modelColumns" row-key="id" :loading="isLoading" flat>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.status === 'active' ? 'positive' : 'negative'"
                text-color="white"
                dense
              >
                {{ props.row.status === 'active' ? '激活' : '未激活' }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="visibility"
                @click="viewModelDetails(props.row)"
              />
              <q-btn
                flat
                round
                :color="props.row.status === 'active' ? 'negative' : 'positive'"
                :icon="props.row.status === 'active' ? 'toggle_off' : 'toggle_on'"
                @click="toggleModelStatus(props.row)"
              />
              <q-btn flat round color="negative" icon="delete" @click="deleteModel(props.row.id)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 上传模型对话框 -->
    <q-dialog v-model="showUploadDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">上传新模型</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="uploadModel">
            <q-file
              v-model="uploadFile"
              label="选择模型文件"
              filled
              accept=".pth,.onnx,.pb,.h5"
              class="q-mb-md"
            />
            <q-input v-model="modelName" label="模型名称" filled class="q-mb-md" />
            <q-input v-model="modelVersion" label="版本" filled class="q-mb-md" />
            <q-input
              v-model="modelDescription"
              label="描述"
              type="textarea"
              filled
              class="q-mb-md"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="上传" color="primary" :loading="isLoading" @click="uploadModel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useModelStore } from 'src/stores/modelStore';
import { useQuasar } from 'quasar';
import type { ModelInfo } from 'src/services/modelService';

const $q = useQuasar();
const modelStore = useModelStore();

const showUploadDialog = ref(false);
const uploadFile = ref<File | null>(null);
const modelName = ref('');
const modelVersion = ref('');
const modelDescription = ref('');

const models = computed(() => modelStore.models);
const isLoading = computed(() => modelStore.isLoading);

const modelColumns = [
  { name: 'name', label: '模型名称', field: 'name', align: 'left' as const },
  { name: 'version', label: '版本', field: 'version', align: 'center' as const },
  {
    name: 'accuracy',
    label: '准确率',
    field: 'accuracy',
    align: 'center' as const,
    format: (val: number) => `${(val * 100).toFixed(1)}%`,
  },
  { name: 'size', label: '大小', field: 'size', align: 'center' as const },
  { name: 'status', label: '状态', field: 'status', align: 'center' as const },
  {
    name: 'updatedAt',
    label: '更新时间',
    field: 'updatedAt',
    align: 'center' as const,
    format: (val: string) => new Date(val).toLocaleDateString(),
  },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

onMounted(async () => {
  await modelStore.fetchModels();
});

async function uploadModel() {
  if (!uploadFile.value || !modelName.value || !modelVersion.value) {
    $q.notify({
      type: 'warning',
      message: '请填写所有必填字段',
    });
    return;
  }

  try {
    await modelStore.uploadModel(uploadFile.value, {
      name: modelName.value,
      version: modelVersion.value,
      description: modelDescription.value,
    });

    $q.notify({
      type: 'positive',
      message: '模型上传成功',
    });

    showUploadDialog.value = false;
    uploadFile.value = null;
    modelName.value = '';
    modelVersion.value = '';
    modelDescription.value = '';
  } catch (error) {
    console.error('uploadModel error', error);
    $q.notify({
      type: 'negative',
      message: `模型上传失败: ${extractErrorMessage(error)}`,
    });
  }
}

async function viewModelDetails(model: ModelInfo) {
  await modelStore.fetchModel(model.id);
  // 这里可以导航到模型详情页
}

async function toggleModelStatus(model: ModelInfo) {
  try {
    await modelStore.updateModelStatus(model.id, model.status === 'active' ? 'inactive' : 'active');
    $q.notify({
      type: 'positive',
      message: '模型状态已更新',
    });
  } catch (error) {
    console.error('toggleModelStatus error', error);
    $q.notify({
      type: 'negative',
      message: `更新模型状态失败: ${extractErrorMessage(error)}`,
    });
  }
}

function deleteModel(modelId: string) {
  $q.dialog({
    title: '确认删除',
    message: '确定要删除这个模型吗？此操作不可恢复。',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void modelStore
      .deleteModel(modelId)
      .then(() => {
        $q.notify({
          type: 'positive',
          message: '模型已删除',
        });
      })
      .catch((error) => {
        console.error('deleteModel error', error);
        $q.notify({
          type: 'negative',
          message: `删除模型失败: ${extractErrorMessage(error)}`,
        });
      });
  });
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}
</script>
