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
import { ZOOM_CONFIG, AI_DETECTION_LABELS, type DetectionLabelKey } from './analyzer/constants';
import AnalyzerToolbar from './analyzer/AnalyzerToolbar.vue';
import AnalyzerCanvas from './analyzer/AnalyzerCanvas.vue';

const props = defineProps<{
  src: string;
  initialAnnotations?: Annotation[];
}>();

const emit = defineEmits<{
  (e: 'update:annotations', annotations: Annotation[]): void;
  (e: 'export', data: unknown): void;
  (e: 'zoom', relative: number): void;
  (e: 'image-load', width: number, height: number): void;
}>();

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
  emit('image-load', width, height);
  void fitToScreen();
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
  void fitToScreen();
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
    // 模拟 AI 检测延迟（1.5-2.5秒）
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // 检测标签权重配置（模拟真实场景中的分布）
    const labelWeights: { key: DetectionLabelKey; weight: number; confRange: [number, number] }[] = [
      { key: 'NILM', weight: 35, confRange: [0.85, 0.98] },
      { key: 'INFLAMMATION', weight: 25, confRange: [0.70, 0.92] },
      { key: 'ASC_US', weight: 15, confRange: [0.55, 0.80] },
      { key: 'LSIL', weight: 12, confRange: [0.60, 0.85] },
      { key: 'ASC_H', weight: 6, confRange: [0.65, 0.88] },
      { key: 'HSIL', weight: 5, confRange: [0.70, 0.92] },
      { key: 'AGC', weight: 1.5, confRange: [0.60, 0.85] },
      { key: 'SCC', weight: 0.5, confRange: [0.75, 0.95] },
    ];

    // 根据权重随机选择标签
    const selectLabel = () => {
      const totalWeight = labelWeights.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      for (const item of labelWeights) {
        random -= item.weight;
        if (random <= 0) return item;
      }
      // 默认返回第一个（数组非空）
      return labelWeights[0]!;
    };

    // 生成更真实的检测区域位置（基于图像中心区域）
    const generateRegion = (index: number, total: number) => {
      // 将检测区域分布在图像的中心60%区域内
      const marginX = imageWidth.value * 0.2;
      const marginY = imageHeight.value * 0.2;
      const availableW = imageWidth.value * 0.6;
      const availableH = imageHeight.value * 0.6;

      // 根据索引分散位置，避免重叠
      const gridCols = Math.ceil(Math.sqrt(total));
      const gridRows = Math.ceil(total / gridCols);
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);

      const cellW = availableW / gridCols;
      const cellH = availableH / gridRows;

      // 在格子内随机偏移
      const baseX = marginX + col * cellW + Math.random() * cellW * 0.3;
      const baseY = marginY + row * cellH + Math.random() * cellH * 0.3;

      // 检测框大小（图像尺寸的8%-18%）
      const w = imageWidth.value * (0.08 + Math.random() * 0.10);
      const h = imageHeight.value * (0.08 + Math.random() * 0.10);

      return {
        x: Math.max(0, Math.min(baseX, imageWidth.value - w)),
        y: Math.max(0, Math.min(baseY, imageHeight.value - h)),
        width: w,
        height: h,
      };
    };

    // 生成 2-4 个检测结果
    const count = 2 + Math.floor(Math.random() * 3);
    const mockAnns: Annotation[] = [];

    for (let i = 0; i < count; i++) {
      const selected = selectLabel();
      const labelInfo = AI_DETECTION_LABELS[selected.key];
      const region = generateRegion(i, count);

      // 在配置的置信度范围内生成随机值
      const [minConf, maxConf] = selected.confRange;
      const confidence = minConf + Math.random() * (maxConf - minConf);

      mockAnns.push({
        type: 'rect',
        ...region,
        label: labelInfo.name,
        confidence: Math.round(confidence * 100) / 100,
        timestamp: Date.now(),
        source: 'ai',
        severity: labelInfo.severity,
        description: `${labelInfo.fullName}\n\n${labelInfo.description}`,
      });
    }

    // 按置信度降序排列
    mockAnns.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    annotations.value = [...annotations.value, ...mockAnns];
    emit('update:annotations', annotations.value);

    // 统计结果
    const highRiskCount = mockAnns.filter(a => a.severity === 'high' || a.severity === 'critical').length;
    const message = highRiskCount > 0
      ? `检测完成，发现 ${count} 个区域，其中 ${highRiskCount} 处需重点关注`
      : `检测完成，发现 ${count} 个区域`;

    $q.notify({
      type: highRiskCount > 0 ? 'warning' : 'positive',
      message,
      position: 'top',
      timeout: 3000,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: '自动检测失败，请重试',
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
