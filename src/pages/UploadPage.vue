<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">上传新病例</div>
        <q-breadcrumbs class="q-mb-md">
          <q-breadcrumbs-el label="仪表盘" to="/app" />
          <q-breadcrumbs-el label="病例管理" to="/app/studies" />
          <q-breadcrumbs-el label="上传" />
        </q-breadcrumbs>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">上传宫颈图像</div>
            <p>上传高分辨率宫颈图像进行AI分析。支持格式：JPG, PNG, TIFF</p>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-uploader
              ref="uploaderRef"
              accept=".jpg, .jpeg, .png, .tiff"
              :multiple="false"
              :batch="false"
              @added="onFileAdded"
              @removed="onFileRemoved"
              style="max-width: 600px"
            >
              <template v-slot:header="scope">
                <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
                  <q-spinner v-if="scope.isUploading" class="q-uploader__spinner" />
                  <div class="col">
                    <div class="q-uploader__title">选择或拖拽宫颈图像</div>
                    <div class="q-uploader__subtitle">
                      {{ scope.uploadSizeLabel }} / {{ scope.uploadProgressLabel }}
                    </div>
                  </div>

                  <q-btn
                    v-if="!scope.isUploading"
                    icon="cloud_upload"
                    @click="scope.pickFiles"
                    round
                    dense
                    flat
                  >
                    <q-uploader-add-trigger />
                  </q-btn>

                  <q-btn v-else icon="clear" @click="scope.removeQueuedFiles" round dense flat />
                </div>
              </template>
            </q-uploader>
          </q-card-section>

          <q-card-section v-if="selectedFile">
            <div class="text-h6">预览</div>
            <q-img
              :src="imagePreviewUrl"
              spinner-color="primary"
              style="max-width: 100%; max-height: 400px"
              class="q-mt-md rounded-borders"
            />
          </q-card-section>

          <q-card-actions align="right" v-if="selectedFile">
            <q-btn flat label="清除" @click="clearFile" />
            <q-btn
              color="primary"
              label="上传并分析"
              @click="uploadAndAnalyze"
              :loading="uploading"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                上传中...
              </template>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-12">
        <q-card flat bordered>
          <q-card-section class="bg-blue-1">
            <div class="text-h6">
              <q-icon name="info" color="primary" class="q-mr-sm" />
              病例信息
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              请填写完整的患者信息，带 * 的为必填项
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input
                v-model="studyInfo.patientName"
                outlined
                label="患者姓名 *"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '请输入患者姓名']"
              >
                <template v-slot:prepend>
                  <q-icon name="person" color="primary" />
                </template>
                <template v-slot:hint>
                  <div class="text-caption">
                    <q-icon name="info" size="xs" class="q-mr-xs" />
                    请输入患者的真实姓名
                  </div>
                </template>
              </q-input>

              <q-input
                v-model="studyInfo.patientId"
                outlined
                label="患者ID *"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '请输入患者ID']"
              >
                <template v-slot:prepend>
                  <q-icon name="badge" color="primary" />
                </template>
                <template v-slot:hint>
                  <div class="text-caption">
                    <q-icon name="info" size="xs" class="q-mr-xs" />
                    唯一识别码，如：P001234
                  </div>
                </template>
              </q-input>

              <q-input
                v-model="studyInfo.description"
                outlined
                label="病例描述（可选）"
                type="textarea"
                rows="3"
              >
                <template v-slot:prepend>
                  <q-icon name="description" color="primary" />
                </template>
                <template v-slot:hint>
                  <div class="text-caption">
                    <q-icon name="info" size="xs" class="q-mr-xs" />
                    简要描述病例情况、症状等
                  </div>
                </template>
              </q-input>

              <q-select
                v-model="studyInfo.modality"
                outlined
                label="检查方式 *"
                :options="modalities"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '请选择检查方式']"
              >
                <template v-slot:prepend>
                  <q-icon name="medical_services" color="primary" />
                </template>
                <template v-slot:hint>
                  <div class="text-caption">
                    <q-icon name="info" size="xs" class="q-mr-xs" />
                    选择本次医学影像检查类型
                  </div>
                </template>
              </q-select>

              <q-input
                v-model="studyInfo.studyDate"
                outlined
                label="检查日期 *"
                type="date"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '请选择检查日期']"
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
                <template v-slot:hint>
                  <div class="text-caption">
                    <q-icon name="info" size="xs" class="q-mr-xs" />
                    选择患者进行检查的日期
                  </div>
                </template>
              </q-input>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- 注意事项 -->
        <q-card flat bordered class="q-mt-md bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold text-orange-9">
              <q-icon name="warning" class="q-mr-sm" />
              注意事项
            </div>
            <q-list dense class="q-mt-sm">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">
                    请确保医学影像清晰、质量良好
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">
                    支持格式：DICOM、JPG、PNG、TIFF
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9"> 文件大小不超过20MB </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">
                    AI分析需要约30-60秒左右
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">
                    建议上传平扫或冠状位图像
                  </q-item-label>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAnalysisStore } from 'stores/analysisStore';
import { uploadImage } from 'src/services/apiService';

const router = useRouter();
const analysisStore = useAnalysisStore();
const $q = useQuasar();

type UploaderInstance = {
  removeQueuedFiles: () => void;
};

const uploaderRef = ref<UploaderInstance | null>(null);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);

// Study information form
const studyInfo = ref({
  patientName: '',
  patientId: '',
  description: '',
  modality: 'MRI（磁共振成像）',
  studyDate: new Date().toISOString().split('T')[0] as string, // Today's date in YYYY-MM-DD format
});

// Available modalities - 真实的宫颈癌医学影像检查类型
const modalities = [
  'MRI（磁共振成像）',
  'CT（计算机断层扫描）',
  'PET-CT（正电子发射断层扫描）',
  '超声检查',
  '阴道镜检查',
  'X线造影',
  '其他',
];

// Computed property for image preview
const imagePreviewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  return '';
});

// Handle file added event
const onFileAdded = (files: readonly File[]) => {
  const [file] = files;
  if (file) {
    selectedFile.value = file;
  }
};

// Handle file removed event
const onFileRemoved = () => {
  selectedFile.value = null;
};

// Clear selected file
const clearFile = () => {
  selectedFile.value = null;
  if (uploaderRef.value) {
    uploaderRef.value.removeQueuedFiles();
  }
};

// Upload and analyze the image
const uploadAndAnalyze = async () => {
  console.log('🔵 uploadAndAnalyze 函数被调用');
  console.log('📁 选中的文件:', selectedFile.value);
  console.log('📋 病例信息:', studyInfo.value);

  if (!selectedFile.value) {
    console.warn('⚠️ 未选择文件');
    $q.notify({
      type: 'warning',
      message: '请先选择图像文件',
      position: 'top',
    });
    return;
  }

  if (
    !studyInfo.value.patientName ||
    !studyInfo.value.patientId ||
    !studyInfo.value.modality ||
    !studyInfo.value.studyDate
  ) {
    console.warn('⚠️ 缺少必填字段');
    $q.notify({
      type: 'warning',
      message: '请填写所有必填字段',
      position: 'top',
    });
    return;
  }

  uploading.value = true;

  try {
    console.log('📝 开始上传图像...');

    // 显示上传开始通知
    $q.notify({
      type: 'info',
      message: '📤 正在上传图像，请稍候...',
      position: 'top',
      timeout: 3000,
      icon: 'cloud_upload',
    });

    // 调用后端 API 上传图像并创建分析任务
    const response = await uploadImage({
      image: selectedFile.value,
      patientName: studyInfo.value.patientName,
      patientId: studyInfo.value.patientId,
      studyDate: studyInfo.value.studyDate,
      modality: studyInfo.value.modality,
      description: studyInfo.value.description,
    });

    console.log('✅ 上传成功，任务ID:', response.taskId);
    console.log('🏯 病例ID:', response.studyId);
    console.log('📊 数据库ID:', response.studyDbId);

    // 使用数据库 ID（如果有），否则使用字符串 ID
    const studyIdForRoute = response.studyDbId || response.studyId;

    $q.notify({
      type: 'positive',
      message: `✅ 病例上传成功！AI分析已启动，预计${response.estimatedTime}秒完成`,
      position: 'top',
      timeout: 4000,
      icon: 'check_circle',
    });

    // 跳转到病例详情页面
    console.log(`🚀 跳转到病例详情: /app/studies/${studyIdForRoute}`);
    void router.push(`/app/studies/${studyIdForRoute}`);

    // 开始轮询任务状态，分析完成后显示通知
    console.log(`🔄 开始轮询任务状态: ${response.taskId}`);
    analysisStore
      .pollTaskStatus(response.taskId)
      .then((task) => {
        console.log('🎉 分析完成！状态:', task.status);
        console.log('📋 结果:', task.result);

        if (task.status === 'SUCCESS') {
          console.log('✅ 显示成功通知');
          $q.notify({
            type: 'positive',
            message: '🎉 AI分析完成！请查看分析结果',
            position: 'top',
            timeout: 5000,
            actions: [
              {
                label: '查看结果',
                color: 'white',
                handler: () => {
                  console.log('🔄 刷新页面以显示最新结果');
                  // 刷新页面以显示最新结果
                  window.location.reload();
                },
              },
            ],
          });
        } else if (task.status === 'FAILED') {
          console.error('❌ 显示失败通知:', task.error);
          $q.notify({
            type: 'negative',
            message: `❌ 分析失败: ${task.error || '未知错误'}`,
            position: 'top',
            timeout: 5000,
          });
        }
      })
      .catch((error) => {
        console.error('❓ 轮询失败:', error);
        $q.notify({
          type: 'warning',
          message: '轮询任务状态失败，请刷新页面查看结果',
          position: 'top',
        });
      });
  } catch (error) {
    console.error('❌ 上传错误:', error);

    let errorMessage = '上传失败，请重试';
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        errorMessage = '❌ 无法连接到后端服务，请确保后端已启动（运行: cd server && npm start）';
      } else {
        errorMessage = `❌ 上传失败: ${error.message}`;
      }
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 8000,
      icon: 'error',
      actions: [
        {
          label: '关闭',
          color: 'white',
        },
      ],
    });
  } finally {
    uploading.value = false;
  }
};
</script>
