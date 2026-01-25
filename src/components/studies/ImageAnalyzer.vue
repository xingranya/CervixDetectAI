<template>
  <div class="image-analyzer-container">
    <AnalyzerToolbar
      :current-tool="currentTool"
      :detecting="detecting"
      :has-annotations="annotations.length > 0"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
      @set-tool="setTool"
      @auto-detect="autoDetect"
      @clear-annotations="clearAnnotations"
      @export-annotations="exportAnnotations"
    />

    <AnalyzerCanvas
      ref="canvasRef"
      :src="src"
      :annotations="annotations"
      :scale="scale"
      :translate-x="translateX"
      :translate-y="translateY"
      :current-tool="currentTool"
      @image-load="onImageLoad"
      @update:translate="updateTranslate"
      @update:scale="updateScale"
      @add-annotation="addAnnotation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import type { Annotation, ToolType } from './analyzer/types';
import { ZOOM_CONFIG } from './analyzer/constants';
import AnalyzerToolbar from './analyzer/AnalyzerToolbar.vue';
import AnalyzerCanvas from './analyzer/AnalyzerCanvas.vue';

const props = defineProps<{
  src: string;
  initialAnnotations?: Annotation[];
}>();

const emit = defineEmits(['update:annotations', 'export', 'zoom']);

const $q = useQuasar();

// State
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const imageWidth = ref(0);
const imageHeight = ref(0);
const initialFitScale = ref(0);
const annotations = ref<Annotation[]>(props.initialAnnotations || []);

// Tools
const currentTool = ref<ToolType>('pan');
const detecting = ref(false);

// Refs
const canvasRef = ref<InstanceType<typeof AnalyzerCanvas> | null>(null);

// Watchers
watch(
  () => props.initialAnnotations,
  (newVal) => {
    if (newVal) annotations.value = [...newVal];
  },
  { deep: true },
);

// Methods
const onImageLoad = (width: number, height: number) => {
  imageWidth.value = width;
  imageHeight.value = height;
  initialFitScale.value = 0; // Reset for new image
  fitToScreen();
};

const updateTranslate = (x: number, y: number) => {
  translateX.value = x;
  translateY.value = y;
};

const updateScale = (newScale: number) => {
  if (newScale >= ZOOM_CONFIG.MIN_SCALE && newScale <= ZOOM_CONFIG.MAX_SCALE) {
    scale.value = newScale;
    emitZoom();
  }
};

const emitZoom = () => {
  const relative = initialFitScale.value > 0 ? scale.value / initialFitScale.value : 1;
  emit('zoom', relative);
};

const fitToScreen = async () => {
  // Wait for component to update so refs are available
  await nextTick();

  const viewport = canvasRef.value?.viewport;
  if (!viewport || !imageWidth.value || !imageHeight.value) return;

  const viewportW = viewport.clientWidth;
  const viewportH = viewport.clientHeight;

  const scaleW = viewportW / imageWidth.value;
  const scaleH = viewportH / imageHeight.value;

  scale.value = Math.min(scaleW, scaleH) * ZOOM_CONFIG.FIT_RATIO;

  // Center image
  translateX.value = (viewportW - imageWidth.value * scale.value) / 2;
  translateY.value = (viewportH - imageHeight.value * scale.value) / 2;

  if (initialFitScale.value === 0) {
    initialFitScale.value = scale.value;
  }
  emitZoom();
};

const resetView = () => {
  fitToScreen();
  emitZoom();
};

const zoomIn = () => {
  updateScale(scale.value * ZOOM_CONFIG.FACTOR);
};

const zoomOut = () => {
  updateScale(scale.value / ZOOM_CONFIG.FACTOR);
};

const setTool = (tool: ToolType) => {
  currentTool.value = tool;
};

const addAnnotation = (ann: Annotation) => {
  annotations.value.push(ann);
  emit('update:annotations', annotations.value);
};

const clearAnnotations = () => {
  annotations.value = [];
  emit('update:annotations', []);
};

const autoDetect = async () => {
  detecting.value = true;
  try {
    // Simulate AI detection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock detection results (randomly within image bounds)
    const mockAnns: Annotation[] = [];
    const count = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < count; i++) {
      const w = Math.random() * (imageWidth.value * 0.2);
      const h = Math.random() * (imageHeight.value * 0.2);
      const x = Math.random() * (imageWidth.value - w);
      const y = Math.random() * (imageHeight.value - h);

      mockAnns.push({
        type: 'rect',
        x,
        y,
        width: w,
        height: h,
        label: 'AI检测区域',
        confidence: 0.85 + Math.random() * 0.14,
        timestamp: Date.now(),
      });
    }

    annotations.value = [...annotations.value, ...mockAnns];
    emit('update:annotations', annotations.value);

    $q.notify({
      type: 'positive',
      message: `检测完成，发现 ${count} 个可疑区域`,
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: '自动检测失败',
      position: 'top',
    });
  } finally {
    detecting.value = false;
  }
};

const exportAnnotations = () => {
  const data = {
    imageId: 'current-image', // Should be passed as prop
    timestamp: new Date().toISOString(),
    annotations: annotations.value,
  };

  // Create download link
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `annotations-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  emit('export', data);
};
</script>

<style scoped>
.image-analyzer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: none;
  border-radius: 0;
  background: #f5f5f5;
}
</style>
