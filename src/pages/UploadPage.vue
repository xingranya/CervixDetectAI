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
          <q-card-section>
            <div class="text-h6">病例信息</div>
            <q-form class="q-gutter-md">
              <q-input
                v-model="studyInfo.patientName"
                outlined
                label="患者姓名"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '患者姓名为必填项']"
              />

              <q-input
                v-model="studyInfo.patientId"
                outlined
                label="患者ID"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '患者ID为必填项']"
              />

              <q-input v-model="studyInfo.description" outlined label="病例描述" type="textarea" />

              <q-select
                v-model="studyInfo.modality"
                outlined
                label="检查方式"
                :options="modalities"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '检查方式为必填项']"
              />

              <q-input v-model="studyInfo.studyDate" outlined label="检查日期" type="date" />
            </q-form>
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
import { useStudyStore } from 'stores/studyStore';
import { useAnalysisStore } from 'stores/analysisStore';

const router = useRouter();
const studyStore = useStudyStore();
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
  modality: '阴道镜检查',
  studyDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
});

// Available modalities
const modalities = ['阴道镜检查', '巴氏涂片', '液基细胞学', 'HPV检测', '其他'];

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
  if (!selectedFile.value) {
    $q.notify({
      type: 'warning',
      message: '请先选择图像文件',
      position: 'top',
    });
    return;
  }

  if (!studyInfo.value.patientName || !studyInfo.value.patientId || !studyInfo.value.modality) {
    $q.notify({
      type: 'warning',
      message: '请填写所有必填字段',
      position: 'top',
    });
    return;
  }

  uploading.value = true;

  try {
    // In a real app, this would upload the file to the backend
    // For now, we'll simulate the upload and create a study
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate upload time

    // Create the study with the provided information
    const newStudy = await studyStore.createStudy({
      patientName: studyInfo.value.patientName,
      patientId: studyInfo.value.patientId,
      studyDate: studyInfo.value.studyDate + 'T00:00:00Z', // Convert to ISO format
      modality: studyInfo.value.modality,
      bodyPart: '宫颈',
      description: studyInfo.value.description,
      imageUrl: imagePreviewUrl.value, // In a real app, this would come from the backend
    });

    // Create an analysis task for this study
    await analysisStore.createAnalysisTask(newStudy.id);

    $q.notify({
      type: 'positive',
      message: '病例上传成功，AI分析已启动！',
      position: 'top',
    });

    // Navigate to the study details page
    void router.push(`/app/studies/${newStudy.id}`);
  } catch (error) {
    console.error('上传错误:', error);
    $q.notify({
      type: 'negative',
      message: '上传和分析图像时发生错误。请重试。',
      position: 'top',
    });
  } finally {
    uploading.value = false;
  }
};
</script>
