<template>
  <q-page class="q-pa-md app-gradient-page">
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
                  {{ uploadProcessingTitle }}
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
                <div class="text-caption text-grey-7">
                  {{ uploadProcessingHint }}
                </div>
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
                'upload-zone--has-file': selectedFiles.length > 0,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.tif,.tiff,.bmp"
                class="hidden"
                @change="onFileChange"
              />

              <transition name="fade" mode="out-in">
                <div v-if="selectedFiles.length === 0" key="empty" class="upload-zone__content">
                  <q-icon name="cloud_upload" size="56px" color="primary" class="q-mb-md" />
                  <div class="text-subtitle1 text-grey-8 q-mb-xs">拖拽图像到此处（支持多张）</div>
                  <div class="text-body2 text-grey-6 q-mb-md">或点击选择文件（最多 10 张）</div>
                  <q-btn
                    color="primary"
                    outline
                    label="选择图像文件"
                    icon="add_photo_alternate"
                    @click.stop="triggerFileInput"
                  />
                </div>

                <div v-else key="preview" class="upload-zone__preview">
                  <q-img
                    v-if="imagePreviewUrl"
                    :src="imagePreviewUrl"
                    spinner-color="primary"
                    class="preview-image"
                  />
                  <div class="preview-info q-mt-md q-gutter-sm">
                    <q-chip icon="collections" color="primary" text-color="white">
                      已选择 {{ selectedFiles.length }} 张
                    </q-chip>
                    <q-chip color="grey-2" text-color="grey-8">
                      总计 {{ formatFileSize(totalSelectedSize) }}
                    </q-chip>
                    <q-chip
                      v-if="remainingUploadSlots > 0"
                      icon="add_photo_alternate"
                      color="light-blue-1"
                      text-color="light-blue-9"
                    >
                      还可添加 {{ remainingUploadSlots }} 张
                    </q-chip>
                    <q-chip v-else icon="check_circle" color="green-1" text-color="green-9">
                      已达到最多 {{ MAX_FILES }} 张
                    </q-chip>
                  </div>

                  <div class="preview-actions q-mt-sm">
                    <div class="text-caption text-grey-7">
                      可继续拖拽文件到此区域，或点击按钮追加影像
                    </div>
                    <q-btn
                      class="q-mt-sm"
                      color="primary"
                      outline
                      icon="add_photo_alternate"
                      label="继续添加影像"
                      :disable="remainingUploadSlots === 0"
                      @click.stop="triggerFileInput"
                    />
                  </div>

                  <q-list bordered separator class="file-list q-mt-md">
                    <q-item
                      v-for="(file, index) in selectedFiles"
                      :key="`${file.name}-${index}`"
                      clickable
                      :class="{ 'file-item--active': index === activePreviewIndex }"
                      @click.stop="setActivePreview(index)"
                    >
                      <q-item-section avatar>
                        <q-icon name="image" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label lines="1">{{ file.name }}</q-item-label>
                        <q-item-label caption>{{ formatFileSize(file.size) }}</q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="index === activePreviewIndex">
                        <q-chip dense color="primary" text-color="white" icon="visibility">
                          预览中
                        </q-chip>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          flat
                          round
                          dense
                          icon="close"
                          color="grey-6"
                          @click.stop="removeFile(index)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </transition>
            </div>
          </q-card-section>

          <q-separator v-if="selectedFiles.length > 0" />

          <q-card-actions v-if="selectedFiles.length > 0" align="right" class="q-pa-md">
            <q-btn flat label="清空" icon="delete_outline" @click="clearAllFiles" />
            <q-btn
              color="primary"
              :label="`上传并分析（${selectedFiles.length}）`"
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

        <q-card flat bordered class="q-mt-md prep-card">
          <q-card-section class="row items-center q-pb-sm">
            <q-icon name="fact_check" size="24px" color="primary" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">上传前检查</div>
            <q-space />
            <q-chip
              dense
              :color="uploadReadyRate === 100 ? 'positive' : 'amber-8'"
              text-color="white"
              icon="rule"
            >
              完成度 {{ uploadReadyRate }}%
            </q-chip>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-md">
            <q-linear-progress
              :value="uploadReadyRate / 100"
              rounded
              size="8px"
              color="primary"
              track-color="grey-3"
              class="q-mb-md"
            />

            <div class="row q-col-gutter-md">
              <div class="col-md-7 col-12">
                <q-list bordered separator class="prep-list">
                  <q-item v-for="item in uploadChecklist" :key="item.key">
                    <q-item-section avatar>
                      <q-icon
                        :name="item.passed ? 'check_circle' : 'radio_button_unchecked'"
                        :color="item.passed ? 'positive' : 'grey-6'"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label :class="item.passed ? 'text-grey-9' : 'text-grey-7'">
                        {{ item.label }}
                      </q-item-label>
                      <q-item-label caption>{{ item.hint }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col-md-5 col-12">
                <q-card flat bordered class="prep-tip-card">
                  <q-card-section class="q-py-sm">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">
                      <q-icon name="lightbulb" color="amber-8" class="q-mr-xs" />
                      提升识别效果
                    </div>
                    <q-list dense>
                      <q-item class="q-pa-none q-mb-xs">
                        <q-item-section avatar class="tip-avatar">
                          <q-icon name="done" color="primary" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>优先上传清晰、无强反光图像</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item class="q-pa-none q-mb-xs">
                        <q-item-section avatar class="tip-avatar">
                          <q-icon name="done" color="primary" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>一次批量建议 3-6 张，质量更稳定</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item class="q-pa-none">
                        <q-item-section avatar class="tip-avatar">
                          <q-icon name="done" color="primary" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label caption>上传后可在“病例中心”查看批次状态</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
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
                      <q-btn flat round icon="close" size="sm" @click="selectedPatient = null" aria-label="清除患者" />
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
              <q-popup-proxy cover transition-show="fade" transition-hide="fade">
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
                <q-item-section avatar class="tip-avatar">
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
    <q-dialog
      v-model="showAddPatientDialog"
      persistent
      transition-show="fade"
      transition-hide="fade"
    >
      <q-card class="add-patient-dialog-card">
        <q-card-section class="row items-center bg-primary text-white">
          <q-icon name="person_add" size="sm" class="q-mr-sm" />
          <div class="text-h6">新增患者</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md q-px-lg add-patient-dialog-body">
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { isAxiosError } from 'axios';
import { analysisTaskAPI, type BatchAnalysisTaskItem } from 'src/services/api';
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
const selectedFiles = ref<File[]>([]);
const activePreviewIndex = ref(-1);
const previewObjectUrl = ref('');
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const progressInterval = ref<ReturnType<typeof setInterval> | null>(null);
const MAX_FILES = 10;

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
  { icon: 'check_circle', color: 'orange', text: '单次最多上传 10 张影像' },
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
const activePreviewFile = computed(() => {
  if (selectedFiles.value.length === 0) {
    return null;
  }

  if (
    activePreviewIndex.value < 0 ||
    activePreviewIndex.value >= selectedFiles.value.length
  ) {
    return selectedFiles.value[selectedFiles.value.length - 1];
  }

  return selectedFiles.value[activePreviewIndex.value];
});

watch(
  activePreviewFile,
  (file) => {
    if (previewObjectUrl.value) {
      URL.revokeObjectURL(previewObjectUrl.value);
      previewObjectUrl.value = '';
    }

    if (file) {
      previewObjectUrl.value = URL.createObjectURL(file);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = '';
  }
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
    progressInterval.value = null;
  }
});

const imagePreviewUrl = computed(() => previewObjectUrl.value);

const totalSelectedSize = computed(() =>
  selectedFiles.value.reduce((sum, file) => sum + file.size, 0),
);
const remainingUploadSlots = computed(() => Math.max(0, MAX_FILES - selectedFiles.value.length));

const uploadChecklist = computed(() => {
  const hasPatient = !!selectedPatient.value;
  const hasFiles = selectedFiles.value.length > 0;
  const hasModality = !!studyInfo.value.modality;
  const hasStudyDate = !!studyInfo.value.studyDate;

  return [
    {
      key: 'patient',
      label: '已选择患者',
      passed: hasPatient,
      hint: hasPatient ? `当前：${selectedPatient.value?.name || ''}` : '请先在右侧选择或新增患者',
    },
    {
      key: 'files',
      label: '已选择影像',
      passed: hasFiles,
      hint: hasFiles ? `当前 ${selectedFiles.value.length} 张` : '请至少选择 1 张图像',
    },
    {
      key: 'modality',
      label: '检查方式已填写',
      passed: hasModality,
      hint: hasModality ? studyInfo.value.modality : '请填写检查方式',
    },
    {
      key: 'studyDate',
      label: '检查日期已填写',
      passed: hasStudyDate,
      hint: hasStudyDate ? studyInfo.value.studyDate : '请填写检查日期',
    },
  ];
});

const uploadReadyRate = computed(() => {
  const passedCount = uploadChecklist.value.filter((item) => item.passed).length;
  return Math.round((passedCount / uploadChecklist.value.length) * 100);
});

const isBatchUploadMode = computed(() => selectedFiles.value.length > 1);
const uploadProcessingTitle = computed(() =>
  isBatchUploadMode.value ? '正在批量处理...' : '正在上传并启动分析...',
);
const uploadProcessingHint = computed(() =>
  isBatchUploadMode.value
    ? '正在上传影像并创建分析任务，请勿关闭页面...'
    : '正在创建分析任务，即将跳转到进度页面...',
);

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
  const files = Array.from(input.files || []);
  if (files.length > 0) {
    appendFiles(files);
  }

  // 允许重复选择同名文件
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 拖放处理
const onDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length > 0) {
    appendFiles(files);
  }
};

// 校验并追加文件
const appendFiles = (files: File[]) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp'];
  const maxSize = 20 * 1024 * 1024; // 20MB
  const accepted: File[] = [];
  const rejected: string[] = [];

  files.forEach((file) => {
    if (!validTypes.includes(file.type)) {
      rejected.push(`${file.name}: 格式不支持`);
      return;
    }

    if (file.size > maxSize) {
      rejected.push(`${file.name}: 超过20MB`);
      return;
    }

    const duplicated = selectedFiles.value.some(
      (item) =>
        item.name === file.name &&
        item.size === file.size &&
        item.lastModified === file.lastModified,
    );
    if (duplicated) {
      rejected.push(`${file.name}: 已存在`);
      return;
    }

    accepted.push(file);
  });

  const remainSlots = MAX_FILES - selectedFiles.value.length;
  if (remainSlots <= 0) {
    $q.notify({
      type: 'warning',
      message: `最多只能上传 ${MAX_FILES} 张影像`,
      position: 'top',
    });
    return;
  }

  const toAdd = accepted.slice(0, remainSlots);
  if (toAdd.length > 0) {
    selectedFiles.value = [...selectedFiles.value, ...toAdd];
    activePreviewIndex.value = selectedFiles.value.length - 1;
  }

  if (accepted.length > remainSlots) {
    rejected.push(`超过数量上限，已忽略 ${accepted.length - remainSlots} 张`);
  }

  if (rejected.length > 0) {
    $q.notify({
      type: 'warning',
      message: `部分文件未加入：${rejected[0]}`,
      position: 'top',
    });
  }
};

// 切换主预览
const setActivePreview = (index: number) => {
  if (index < 0 || index >= selectedFiles.value.length) {
    return;
  }
  activePreviewIndex.value = index;
};

// 删除单个文件
const removeFile = (index: number) => {
  if (index < 0 || index >= selectedFiles.value.length) {
    return;
  }

  selectedFiles.value.splice(index, 1);

  if (selectedFiles.value.length === 0) {
    activePreviewIndex.value = -1;
    return;
  }

  if (activePreviewIndex.value === index) {
    activePreviewIndex.value = Math.min(index, selectedFiles.value.length - 1);
    return;
  }

  if (activePreviewIndex.value > index) {
    activePreviewIndex.value -= 1;
  }
};

// 清空文件
const clearAllFiles = () => {
  selectedFiles.value = [];
  activePreviewIndex.value = -1;
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
  if (selectedFiles.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: '请先选择至少一张图像文件',
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
  progressInterval.value = null;
  const isSingleUpload = selectedFiles.value.length === 1;

  try {
    // 模拟上传进度
    progressInterval.value = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 5;
      }
    }, 250);

    if (isSingleUpload) {
      const firstFile = selectedFiles.value[0];
      if (!firstFile) {
        throw new Error('未找到可上传的影像文件');
      }

      const singleResponse = await uploadImage({
        image: firstFile,
        patientName: selectedPatient.value.name,
        patientId: resolvedPatientId,
        studyDate: studyInfo.value.studyDate,
        modality: studyInfo.value.modality,
        description: studyInfo.value.description,
      });

      clearInterval(progressInterval.value);
      progressInterval.value = null;
      uploadProgress.value = 100;
      uploading.value = false;

      $q.notify({
        type: 'positive',
        message: '分析任务已创建，正在进入病例进度页面',
        position: 'top',
        timeout: 2500,
        icon: 'check_circle',
      });

      clearAllFiles();

      if (singleResponse.studyDbId) {
        await router.push(`/app/studies/${singleResponse.studyDbId}`);
      } else {
        await router.push('/app/studies');
      }
      return;
    }

    // 调用后端 API 批量创建分析任务
    const response = await analysisTaskAPI.createBatchTasks({
      images: selectedFiles.value,
      patientName: selectedPatient.value.name,
      patientId: resolvedPatientId,
      studyDate: studyInfo.value.studyDate,
      modality: studyInfo.value.modality,
      description: studyInfo.value.description,
      priority: 'normal',
    });

    clearInterval(progressInterval.value);
    progressInterval.value = null;
    uploadProgress.value = 100;
    uploading.value = false;

    if (!response.success || !response.data) {
      throw new Error(response.message || '批量创建任务失败');
    }

    const failedItems = response.data.items.filter(
      (item: BatchAnalysisTaskItem) => item.status === 'FAILED',
    );
    const { created, failed, total } = response.data.summary;

    if (created > 0) {
      $q.notify({
        type: failed > 0 ? 'warning' : 'positive',
        message: `已创建 ${created}/${total} 个分析任务${failed > 0 ? `，失败 ${failed} 个` : ''}`,
        position: 'top',
        timeout: 3500,
        icon: failed > 0 ? 'warning_amber' : 'check_circle',
      });
    }

    if (failedItems.length > 0) {
      const firstError = failedItems[0]?.error || '未知错误';
      $q.notify({
        type: 'negative',
        message: `部分影像创建失败：${firstError}`,
        position: 'top',
        timeout: 6000,
        icon: 'error',
      });
    }

    if (created === 0) {
      return;
    }

    clearAllFiles();

    await router.push({
      path: '/app/studies',
      query: { batch: response.data.batchId },
    });
  } catch (error) {
    uploadProgress.value = 0;

    let errorMessage = '上传失败，请重试';
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const serverMessage =
        typeof error.response?.data === 'object' && error.response?.data
          ? (error.response.data as { message?: string }).message
          : undefined;

      if (status === 404) {
        errorMessage = isSingleUpload
          ? '❌ 后端未找到单张分析接口 /analyze，请重启后端后重试'
          : '❌ 后端未找到批量接口 /analysis-tasks/batch，请重启后端后重试';
      } else if (status === 401) {
        errorMessage = '❌ 登录状态已失效，请重新登录后重试';
      } else if (status === 413) {
        errorMessage = '❌ 上传内容过大，请减少文件大小或数量后重试';
      } else if (typeof status === 'number') {
        errorMessage = `❌ 上传失败（HTTP ${status}）${serverMessage ? `: ${serverMessage}` : ''}`;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = isSingleUpload
          ? '❌ 网络连接中断，请确认前端到后端连通，且后端已加载 /analyze 接口'
          : '❌ 网络连接中断，请确认前端到后端连通，且后端已加载 /analysis-tasks/batch 接口';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '❌ 请求超时，请稍后重试';
      } else if (error.message) {
        errorMessage = `❌ 上传失败: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = `❌ 上传失败: ${error.message}`;
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 8000,
      icon: 'error',
    });
  } finally {
    if (progressInterval.value) {
      clearInterval(progressInterval.value);
    }
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
  border-radius: var(--app-radius-lg);
}

.prep-card {
  border-radius: var(--app-radius-lg);
}

.prep-list {
  border-radius: var(--app-radius-md);
}

.prep-tip-card {
  border-radius: var(--app-radius-md);
  background: linear-gradient(160deg, #fff 0%, #f7faff 100%);
}

.tip-avatar {
  min-width: 32px;
}

.add-patient-dialog-card {
  min-width: 500px;
  max-width: 600px;
  border-radius: var(--app-radius-lg);
}

.add-patient-dialog-body {
  max-height: 70vh;
  overflow-y: auto;
}

.upload-zone {
  border: 2px dashed var(--app-upload-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-upload-bg);
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-sm));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-sm));
  transition:
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-default);

  &:hover {
    border-color: var(--q-primary);
    background: var(--app-primary-soft-bg);
    box-shadow: var(--app-shadow-sm);
  }

  &--active {
    border-color: var(--q-primary);
    background: var(--app-primary-soft-bg);
    border-style: solid;
  }

  &--has-file {
    border-style: solid;
    border-color: var(--q-positive);
    background: var(--app-elevated-bg);
    cursor: pointer;
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
  border-radius: var(--app-radius-md);
  object-fit: contain;
}

.preview-info {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-actions {
  text-align: center;
}

.file-list {
  max-height: 220px;
  overflow-y: auto;
  border-radius: var(--app-radius-md);
}

.file-item--active {
  background: #e3f2fd;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--app-motion-duration-normal) var(--app-motion-ease-default);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
body.body--dark {
  .upload-zone {
    border-color: var(--app-upload-border);
    background: var(--app-upload-bg);

    &:hover {
      border-color: var(--q-primary);
      background: var(--app-elevated-bg);
      box-shadow: var(--app-shadow-sm);
    }

    &--active {
      border-color: var(--q-primary);
      background: var(--app-primary-soft-bg);
    }

    &--has-file {
      border-color: var(--q-positive);
      background: var(--app-upload-bg);
    }
  }

  .file-item--active {
    background: rgba(25, 118, 210, 0.22);
  }
}
</style>
