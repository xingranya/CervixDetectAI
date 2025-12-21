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

    <!-- 上传进度显示 -->
    <div v-if="uploading" class="row q-mb-md">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              <q-icon name="cloud_upload" class="q-mr-sm" />
              上传中...
            </div>
            <q-linear-progress
              :value="uploadProgress / 100"
              color="primary"
              size="12px"
              class="q-mb-sm"
            >
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="primary" :label="`${uploadProgress}%`" />
              </div>
            </q-linear-progress>
            <div class="text-caption text-grey-7">正在上传图像到服务器...</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 上传区域 -->
      <div class="col-lg-8 col-md-12">
        <ImageUploader
          :uploading="uploading"
          :upload-progress="uploadProgress"
          @file-selected="onFileSelected"
          @upload="uploadAndAnalyze"
        />
      </div>

      <!-- 信息表单区域 -->
      <div class="col-lg-4 col-md-12">
        <StudyForm v-model="studyInfo" />

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
                    请确保细胞学图像清晰、质量良好
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="orange" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">
                    支持格式：JPG, PNG, TIFF
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
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { uploadImage } from 'src/services/apiService';
import ImageUploader from 'components/studies/ImageUploader.vue';
import StudyForm from 'components/studies/StudyForm.vue';
import type { StudyInfo } from 'components/studies/StudyForm.vue';

const router = useRouter();
const $q = useQuasar();

const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const currentStudyId = ref<number | null>(null);

// Study information form
const studyInfo = ref<StudyInfo>({
  patientName: '',
  patientId: '',
  description: '',
  modality: '巴氏染色涂片（Pap Smear）',
  studyDate: new Date().toISOString().split('T')[0] as string,
});

const onFileSelected = (file: File | null) => {
  selectedFile.value = file;
};

// Upload and analyze the image
const uploadAndAnalyze = async () => {
  console.log('🔵 uploadAndAnalyze 函数被调用');

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
  uploadProgress.value = 0;

  try {
    console.log('📝 开始上传图像...');

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    // 调用后端 API 上传图像并创建分析任务
    const response = await uploadImage({
      image: selectedFile.value,
      patientName: studyInfo.value.patientName,
      patientId: studyInfo.value.patientId,
      studyDate: studyInfo.value.studyDate,
      modality: studyInfo.value.modality,
      description: studyInfo.value.description,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;
    uploading.value = false;

    // 保存病例ID（确保类型正确）
    const studyId = response.studyDbId || parseInt(response.studyId);
    currentStudyId.value = studyId;

    $q.notify({
      type: 'positive',
      message: '✅ 上传成功！正在跳转到分析页面...',
      position: 'top',
      timeout: 2000,
      icon: 'check_circle',
    });

    // 立即跳转到病例详情页，让分析页面处理进度显示
    console.log(`🚀 跳转到病例详情: /app/studies/${studyId}`);
    await router.push(`/app/studies/${studyId}`);
  } catch (error) {
    console.error('❌ 上传错误:', error);

    uploadProgress.value = 0;

    let errorMessage = '上传失败，请重试';
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        errorMessage = '❌ 无法连接到后端服务，请确保后端已启动';
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
    });
  } finally {
    uploading.value = false;
  }
};
</script>
