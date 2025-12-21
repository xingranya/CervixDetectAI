<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6">上传宫颈刷片细胞学图像</div>
      <p>上传高分辨率宫颈刷片细胞学图像进行AI分析。支持格式：JPG, PNG, TIFF</p>
    </q-card-section>

    <q-separator />

    <!-- 上传进度条 -->
    <q-linear-progress
      v-if="uploading && uploadProgress < 100"
      :value="uploadProgress / 100"
      color="primary"
      class="q-mt-sm"
      size="8px"
    >
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="primary" :label="`${uploadProgress}%`" />
      </div>
    </q-linear-progress>

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
              <div class="q-uploader__title">选择或拖拽宫颈细胞学图像</div>
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
      <q-btn color="primary" label="上传并分析" @click="handleUpload" :loading="uploading">
        <template v-slot:loading>
          <q-spinner-hourglass class="on-left" />
          上传中...
        </template>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

defineProps({
  uploading: {
    type: Boolean,
    default: false,
  },
  uploadProgress: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['file-selected', 'upload']);

// QUploader internal type definition
type UploaderInstance = {
  removeQueuedFiles: () => void;
};

const uploaderRef = ref<UploaderInstance | null>(null);
const selectedFile = ref<File | null>(null);

const imagePreviewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  return '';
});

const onFileAdded = (files: readonly File[]) => {
  const [file] = files;
  if (file) {
    selectedFile.value = file;
    emit('file-selected', file);
  }
};

const onFileRemoved = () => {
  selectedFile.value = null;
  emit('file-selected', null);
};

const clearFile = () => {
  selectedFile.value = null;
  if (uploaderRef.value) {
    uploaderRef.value.removeQueuedFiles();
  }
  emit('file-selected', null);
};

const handleUpload = () => {
  emit('upload');
};
</script>
