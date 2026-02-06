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
    <transition name="fade">
      <div v-if="uploading" class="row q-mb-md">
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section class="row items-center q-gutter-md">
              <q-spinner-orbit color="primary" size="32px" />
              <div class="col">
                <div class="text-subtitle1 text-weight-bold q-mb-xs">
                  <q-icon name="cloud_upload" class="q-mr-sm" />
                  正在上传...
                </div>
                <q-linear-progress
                  :value="uploadProgress / 100"
                  color="primary"
                  size="10px"
                  rounded
                  class="q-mb-xs"
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" text-color="primary" :label="`${uploadProgress}%`" />
                  </div>
                </q-linear-progress>
                <div class="text-caption text-grey-7">正在上传图像到服务器，请勿关闭页面...</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </transition>

    <div class="row q-col-gutter-md">
      <!-- 上传区域 -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered class="upload-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="image" size="28px" color="primary" class="q-mr-sm" />
              <div>
                <div class="text-h6">上传宫颈刷片细胞学图像</div>
                <div class="text-caption text-grey-6">支持 JPG、PNG、TIFF 格式，最大 20MB</div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- 拖拽上传区域 -->
          <q-card-section>
            <div
              class="upload-zone"
              :class="{
                'upload-zone--active': isDragging,
                'upload-zone--has-file': selectedFile,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.tif,.tiff,.bmp"
                class="hidden"
                @change="onFileChange"
              />

              <transition name="fade" mode="out-in">
                <div v-if="!selectedFile" key="empty" class="upload-zone__content">
                  <q-icon name="cloud_upload" size="56px" color="primary" class="q-mb-md" />
                  <div class="text-subtitle1 text-grey-8 q-mb-xs">拖拽图像到此处</div>
                  <div class="text-body2 text-grey-6 q-mb-md">或点击选择文件</div>
                  <q-btn
                    color="primary"
                    outline
                    label="选择图像"
                    icon="add_photo_alternate"
                    @click.stop="triggerFileInput"
                  />
                </div>

                <div v-else key="preview" class="upload-zone__preview">
                  <q-img :src="imagePreviewUrl" spinner-color="primary" class="preview-image" />
                  <div class="preview-info q-mt-md">
                    <q-chip icon="check_circle" color="positive" text-color="white">
                      {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                    </q-chip>
                  </div>
                </div>
              </transition>
            </div>
          </q-card-section>

          <q-separator v-if="selectedFile" />

          <q-card-actions v-if="selectedFile" align="right" class="q-pa-md">
            <q-btn flat label="清除" icon="delete_outline" @click="clearFile" />
            <q-btn
              color="primary"
              label="上传并分析"
              icon="rocket_launch"
              :loading="uploading"
              @click="uploadAndAnalyze"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                处理中...
              </template>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <!-- 信息表单区域 -->
      <div class="col-lg-4 col-md-12">
        <!-- 患者选择卡片 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="bg-blue-1">
            <div class="text-h6">
              <q-icon name="person_search" color="primary" class="q-mr-sm" />
              选择患者
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">搜索已有患者或新增患者信息</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-lg">
            <PatientSelector
              v-model="selectedPatient"
              label="搜索或选择患者 *"
              :show-add-button="true"
              @add-new="showAddPatientDialog = true"
            />

            <!-- 已选患者信息展示 -->
            <transition name="fade">
              <div v-if="selectedPatient" class="q-mt-md">
                <q-card flat bordered class="bg-green-1">
                  <q-card-section class="q-py-sm">
                    <div class="row items-center">
                      <q-avatar
                        :color="selectedPatient.gender === 'female' ? 'pink-3' : 'blue-3'"
                        text-color="white"
                        size="40px"
                        class="q-mr-md"
                      >
                        {{ selectedPatient.name?.charAt(0) }}
                      </q-avatar>
                      <div class="col">
                        <div class="text-subtitle1 text-weight-bold">
                          {{ selectedPatient.name }}
                        </div>
                        <div class="text-caption text-grey-7">
                          {{ selectedPatient.gender === 'female' ? '女' : '男' }} ·
                          {{ selectedPatient.phone }} · ID: {{ selectedPatient.id }}
                        </div>
                      </div>
                      <q-btn flat round icon="close" size="sm" @click="selectedPatient = null" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </transition>
          </q-card-section>
        </q-card>

        <!-- 检查信息表单 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="bg-blue-1">
            <div class="text-h6">
              <q-icon name="assignment" color="primary" class="q-mr-sm" />
              检查信息
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">填写本次检查的相关信息</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md q-pa-lg">
            <q-select
              v-model="studyInfo.modality"
              outlined
              label="检查方式 *"
              :options="modalities"
              :rules="[(val) => (val && val.length > 0) || '请选择检查方式']"
            >
              <template v-slot:prepend>
                <q-icon name="medical_services" color="primary" />
              </template>
            </q-select>

            <q-input
              v-model="studyInfo.studyDate"
              outlined
              label="检查日期 *"
              readonly
              :rules="[(val) => (val && val.length > 0) || '请选择检查日期']"
            >
              <template v-slot:prepend>
                <q-icon name="event" color="primary" />
              </template>
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="studyInfo.studyDate"
                  mask="YYYY-MM-DD"
                  :locale="dateLocale"
                  today-btn
                >
                  <div class="row items-center justify-end q-gutter-sm">
                    <q-btn label="取消" color="primary" flat v-close-popup />
                    <q-btn label="确定" color="primary" flat v-close-popup />
                  </div>
                </q-date>
              </q-popup-proxy>
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
            </q-input>
          </q-card-section>
        </q-card>

        <!-- 注意事项 -->
        <q-card flat bordered class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold text-orange-9">
              <q-icon name="tips_and_updates" class="q-mr-sm" />
              上传须知
            </div>
            <q-list dense class="q-mt-sm">
              <q-item v-for="(tip, index) in tips" :key="index" class="q-pa-none q-mb-xs">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon :name="tip.icon" :color="tip.color" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-orange-9">{{ tip.text }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 新增患者对话框 -->
    <q-dialog v-model="showAddPatientDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="row items-center bg-primary text-white">
          <q-icon name="person_add" size="sm" class="q-mr-sm" />
          <div class="text-h6">新增患者</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md q-px-lg" style="max-height: 70vh; overflow-y: auto">
          <PatientForm
            v-model="newPatientData"
            @submit="handleAddPatient"
            @cancel="showAddPatientDialog = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { uploadImage } from 'src/services/apiService';
import { usePatientStore } from 'stores/patientStore';
import type { Patient, CreatePatientRequest } from 'src/services/patientService';
import PatientSelector from 'src/components/patients/PatientSelector.vue';
import PatientForm from 'src/components/patients/PatientForm.vue';

const router = useRouter();
const $q = useQuasar();
const patientStore = usePatientStore();

// 患者选择相关
const selectedPatient = ref<Patient | null>(null);
const showAddPatientDialog = ref(false);
const newPatientData = ref<CreatePatientRequest>({
  name: '',
  gender: 'female',
  birthDate: '',
  phone: '',
  sexualHistory: 'none',
});

// 文件相关
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

// 检查方式选项
const modalities = [
  '巴氏染色涂片（Pap Smear）',
  '液基细胞学（TCT/LCT）',
  '宫颈活检切片（HE染色）',
  'HPV分型检测图像',
  'p16/Ki67双染图像',
  '阴道镜检查',
  '其他细胞学检查',
];

// 注意事项列表
const tips = [
  { icon: 'check_circle', color: 'orange', text: '请确保图像清晰、质量良好' },
  { icon: 'check_circle', color: 'orange', text: '支持格式：JPG, PNG, TIFF' },
  { icon: 'check_circle', color: 'orange', text: '文件大小不超过 20MB' },
  { icon: 'check_circle', color: 'orange', text: 'AI 分析约需 30-60 秒' },
];

// 日期选择器中文配置
const dateLocale = {
  days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  daysShort: ['日', '一', '二', '三', '四', '五', '六'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthsShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
};

// 检查信息
const studyInfo = ref({
  description: '',
  modality: '巴氏染色涂片（Pap Smear）',
  studyDate: new Date().toISOString().split('T')[0] as string,
});

// 初始化加载患者列表
onMounted(async () => {
  await patientStore.fetchPatients();
});

// 图像预览 URL
const imagePreviewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  return '';
});

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 文件选择变化
const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
};

// 拖放处理
const onDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    validateAndSetFile(file);
  }
};

// 验证并设置文件
const validateAndSetFile = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/tiff'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!validTypes.includes(file.type)) {
    $q.notify({
      type: 'warning',
      message: '不支持的文件格式，请选择 JPG、PNG 或 TIFF 图像',
      position: 'top',
    });
    return;
  }

  if (file.size > maxSize) {
    $q.notify({
      type: 'warning',
      message: '文件过大，请选择小于 20MB 的图像',
      position: 'top',
    });
    return;
  }

  selectedFile.value = file;
};

// 清除文件
const clearFile = () => {
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

/**
 * 获取有效的患者业务编号（patient_id）
 */
const resolvePatientBusinessId = async (): Promise<string | null> => {
  if (!selectedPatient.value) return null;
  const directId = selectedPatient.value.patientId?.trim();
  if (directId) {
    return directId;
  }

  if (!selectedPatient.value.id) {
    return null;
  }

  try {
    const refreshed = await patientStore.loadPatientById(selectedPatient.value.id, true);
    if (refreshed?.patientId?.trim()) {
      selectedPatient.value = refreshed;
      return refreshed.patientId.trim();
    }
  } catch (error) {
    console.error('❌ [UploadPage] 刷新患者信息失败:', error);
  }

  return null;
};

// 上传并分析
const uploadAndAnalyze = async () => {
  if (!selectedFile.value) {
    $q.notify({
      type: 'warning',
      message: '请先选择图像文件',
      position: 'top',
    });
    return;
  }

  // 验证患者选择
  if (!selectedPatient.value) {
    $q.notify({
      type: 'warning',
      message: '请先选择患者',
      position: 'top',
    });
    return;
  }

  const resolvedPatientId = await resolvePatientBusinessId();
  if (!resolvedPatientId) {
    $q.notify({
      type: 'warning',
      message: '患者编号缺失，请刷新患者信息后重试',
      position: 'top',
    });
    return;
  }

  if (!studyInfo.value.modality || !studyInfo.value.studyDate) {
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
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    // 调用后端 API 上传图像并创建分析任务
    const response = await uploadImage({
      image: selectedFile.value,
      patientName: selectedPatient.value.name,
      // /api/analyze 使用 patient_id（业务号），不是数据库自增 id
      patientId: resolvedPatientId,
      studyDate: studyInfo.value.studyDate,
      modality: studyInfo.value.modality,
      description: studyInfo.value.description,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;
    uploading.value = false;

    const studyId = response.studyDbId || parseInt(response.studyId);

    $q.notify({
      type: 'positive',
      message: '✅ 上传成功！正在跳转到分析页面...',
      position: 'top',
      timeout: 2000,
      icon: 'check_circle',
    });

    await router.push(`/app/studies/${studyId}`);
  } catch (error) {
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

/**
 * 处理新增患者
 */
const handleAddPatient = async (data: CreatePatientRequest) => {
  try {
    const newPatient = await patientStore.addPatient(data);
    selectedPatient.value = newPatient;
    showAddPatientDialog.value = false;

    // 重置表单
    newPatientData.value = {
      name: '',
      gender: 'female',
      birthDate: '',
      phone: '',
      sexualHistory: 'none',
    };

    $q.notify({
      type: 'positive',
      message: `患者「${newPatient.name}」添加成功`,
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: '添加患者失败，请重试',
      position: 'top',
    });
  }
};
</script>

<style scoped lang="scss">
.upload-card {
  min-height: 400px;
}

.upload-zone {
  border: 2px dashed #d0d7de;
  border-radius: 12px;
  background: #fafbfc;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--q-primary);
    background: #f0f7ff;
  }

  &--active {
    border-color: var(--q-primary);
    background: #e3f2fd;
    border-style: solid;
  }

  &--has-file {
    border-style: solid;
    border-color: var(--q-positive);
    background: #f9fafb;
    cursor: default;
  }

  &__content {
    text-align: center;
    padding: 32px;
  }

  &__preview {
    width: 100%;
    padding: 16px;
    text-align: center;
  }
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}

.preview-info {
  display: flex;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
