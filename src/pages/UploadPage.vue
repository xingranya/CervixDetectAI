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
      <!-- 上传区域 -->
      <div class="col-lg-8 col-md-12">
        <ImageUploader
          :uploading="uploading"
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
import { useAnalysisStore } from 'stores/analysisStore';
import { uploadImage } from 'src/services/apiService';
import ImageUploader from 'components/studies/ImageUploader.vue';
import StudyForm from 'components/studies/StudyForm.vue';
import type { StudyInfo } from 'components/studies/StudyForm.vue';

const router = useRouter();
const analysisStore = useAnalysisStore();
const $q = useQuasar();

const selectedFile = ref<File | null>(null);
const uploading = ref(false);

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

    // 开始轮询任务状态
    analysisStore
      .pollTaskStatus(response.taskId)
      .then((task) => {
        if (task.status === 'SUCCESS') {
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
                  window.location.reload();
                },
              },
            ],
          });
        } else if (task.status === 'FAILED') {
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
      });
  } catch (error) {
    console.error('❌ 上传错误:', error);

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
