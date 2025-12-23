<template>
  <div class="image-analyzer-container">
    <!-- Toolbar -->
    <div class="analyzer-toolbar q-pa-sm row items-center q-gutter-sm bg-white border-bottom-light">
      <q-btn-group flat class="shadow-1 rounded-borders bg-grey-1">
        <q-btn icon="zoom_in" @click="zoomIn" dense flat color="grey-8">
          <q-tooltip>放大 (2x/4x/8x)</q-tooltip>
        </q-btn>
        <q-btn icon="zoom_out" @click="zoomOut" dense flat color="grey-8">
          <q-tooltip>缩小</q-tooltip>
        </q-btn>
        <q-separator vertical inset />
        <q-btn icon="restart_alt" @click="resetView" dense flat color="grey-8">
          <q-tooltip>重置视图</q-tooltip>
        </q-btn>
      </q-btn-group>

      <q-separator vertical inset class="q-mx-sm" />

      <q-btn-group flat class="shadow-1 rounded-borders bg-grey-1">
        <q-btn
          icon="crop_square"
          :color="currentTool === 'rect' ? 'primary' : 'grey-7'"
          :class="{ 'bg-blue-1': currentTool === 'rect' }"
          @click="setTool('rect')"
          dense
          flat
        >
          <q-tooltip>矩形框选工具</q-tooltip>
        </q-btn>
        <q-btn
          icon="auto_fix_high"
          color="secondary"
          @click="autoDetect"
          dense
          flat
          :loading="detecting"
        >
          <q-tooltip>AI自动区域检测</q-tooltip>
        </q-btn>
        <q-btn icon="delete_outline" @click="clearAnnotations" dense flat color="negative">
          <q-tooltip>清除所有标注</q-tooltip>
        </q-btn>
      </q-btn-group>

      <q-space />

      <q-btn
        icon="download"
        label="导出JSON"
        dense
        flat
        no-caps
        size="sm"
        color="primary"
        class="bg-blue-50"
        @click="exportAnnotations"
        :disable="annotations.length === 0"
      />
    </div>

    <!-- Canvas Area -->
    <div
      class="analyzer-viewport"
      ref="viewportRef"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div
        class="analyzer-content"
        :style="{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: '0 0',
          cursor: getCursor(),
        }"
      >
        <img
          ref="imageRef"
          :src="src"
          class="analyzer-image"
          @load="onImageLoad"
          draggable="false"
        />
        <svg class="analyzer-overlay" :width="imageWidth" :height="imageHeight" v-if="imageLoaded">
          <!-- Existing Annotations -->
          <g v-for="(ann, index) in annotations" :key="index" class="annotation-group">
            <rect
              v-if="ann.type === 'rect'"
              :x="ann.x"
              :y="ann.y"
              :width="ann.width"
              :height="ann.height"
              :fill="getAnnotationFill(ann.confidence)"
              :stroke="getAnnotationColor(ann.confidence)"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
              style="cursor: pointer; pointer-events: all"
            >
              <title>{{ getFullLabel(ann) }}</title>
            </rect>
            <!-- 标注标签背景 -->
            <rect
              v-if="ann.label"
              :x="ann.x"
              :y="ann.y - 24"
              :width="getLabelWidth(ann)"
              height="20"
              :fill="getAnnotationColor(ann.confidence)"
              rx="4"
              ry="4"
              style="cursor: pointer; pointer-events: all"
            >
              <title>{{ getFullLabel(ann) }}</title>
            </rect>
            <!-- 标注文字 -->
            <text
              v-if="ann.label"
              :x="ann.x + 4"
              :y="ann.y - 9"
              fill="white"
              font-size="12"
              font-weight="bold"
              font-family="sans-serif"
              style="cursor: pointer; pointer-events: all"
            >
              {{ formatLabel(ann) }}
              <title>{{ getFullLabel(ann) }}</title>
            </text>
          </g>

          <!-- Drawing Preview -->
          <rect
            v-if="isDrawing"
            :x="drawStart.x"
            :y="drawStart.y"
            :width="drawCurrent.x - drawStart.x"
            :height="drawCurrent.y - drawStart.y"
            fill="rgba(0, 0, 255, 0.1)"
            stroke="blue"
            stroke-width="2"
            stroke-dasharray="5,5"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';

interface Annotation {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
  timestamp?: number;
}

// ==================== 配置常量 ====================
const ZOOM_CONFIG = {
  FACTOR: 1.15, // 缩放因子（每次放大/缩小15%）
  MAX_SCALE: 8, // 最大缩放倍数
  MIN_SCALE: 0.1, // 最小缩放倍数
  FIT_RATIO: 0.9, // 适配屏幕时的填充比例
} as const;

const LABEL_CONFIG = {
  MAX_LENGTH: 30, // 标签最大字符数
  CHAR_WIDTH_CN: 16, // 中文字符估算宽度
  CHAR_WIDTH_EN: 12, // 英文字符估算宽度
  PADDING: 12, // 标签内边距
} as const;
// ==================================================

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
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imageLoaded = ref(false);
const imageWidth = ref(0);
const imageHeight = ref(0);

// Tools
const currentTool = ref<'pan' | 'rect'>('pan');
const isDrawing = ref(false);
const drawStart = ref({ x: 0, y: 0 });
const drawCurrent = ref({ x: 0, y: 0 });
const detecting = ref(false);

const annotations = ref<Annotation[]>(props.initialAnnotations || []);

// Refs
const viewportRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const initialFitScale = ref(0);

// Watchers
watch(
  () => props.initialAnnotations,
  (newVal) => {
    if (newVal) annotations.value = [...newVal];
  },
  { deep: true },
);

// Methods
const onImageLoad = () => {
  if (imageRef.value) {
    imageWidth.value = imageRef.value.naturalWidth;
    imageHeight.value = imageRef.value.naturalHeight;
    imageLoaded.value = true;
    initialFitScale.value = 0; // Reset for new image
    fitToScreen();
  }
};

const emitZoom = () => {
  const relative = initialFitScale.value > 0 ? scale.value / initialFitScale.value : 1;
  emit('zoom', relative);
};

const fitToScreen = () => {
  if (!viewportRef.value || !imageWidth.value || !imageHeight.value) return;

  const viewportW = viewportRef.value.clientWidth;
  const viewportH = viewportRef.value.clientHeight;

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

const zoomIn = () => {
  const newScale = scale.value * ZOOM_CONFIG.FACTOR;
  if (newScale <= ZOOM_CONFIG.MAX_SCALE) {
    scale.value = newScale;
    emitZoom();
  }
};

const zoomOut = () => {
  const newScale = scale.value / ZOOM_CONFIG.FACTOR;
  if (newScale >= ZOOM_CONFIG.MIN_SCALE) {
    scale.value = newScale;
    emitZoom();
  }
};

// 风险等级配置（统一管理阈值和样式）
const RISK_CONFIG = {
  HIGH: { threshold: 0.8, color: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)', label: '高风险' },
  MEDIUM_HIGH: {
    threshold: 0.6,
    color: '#f97316',
    fill: 'rgba(249, 115, 22, 0.15)',
    label: '中高风险',
  },
  MEDIUM: { threshold: 0.4, color: '#eab308', fill: 'rgba(234, 179, 8, 0.15)', label: '中风险' },
  LOW: { threshold: 0, color: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)', label: '低风险' },
} as const;

// 根据置信度获取风险等级配置
const getRiskConfig = (confidence?: number) => {
  const conf = confidence ?? 0.5;
  if (conf >= RISK_CONFIG.HIGH.threshold) return RISK_CONFIG.HIGH;
  if (conf >= RISK_CONFIG.MEDIUM_HIGH.threshold) return RISK_CONFIG.MEDIUM_HIGH;
  if (conf >= RISK_CONFIG.MEDIUM.threshold) return RISK_CONFIG.MEDIUM;
  return RISK_CONFIG.LOW;
};

// 根据置信度获取边框颜色
const getAnnotationColor = (confidence?: number): string => getRiskConfig(confidence).color;

// 根据置信度获取填充颜色
const getAnnotationFill = (confidence?: number): string => getRiskConfig(confidence).fill;

// 获取风险等级文字
const getRiskLevel = (confidence?: number): string => getRiskConfig(confidence).label;

// 格式化标签文字（截断过长的标签）
const formatLabel = (ann: Annotation): string => {
  const label = ann.label || '';
  const conf = Math.round((ann.confidence || 0) * 100);
  const displayLabel =
    label.length > LABEL_CONFIG.MAX_LENGTH
      ? label.substring(0, LABEL_CONFIG.MAX_LENGTH) + '...'
      : label;
  return `${displayLabel} ${conf}%`;
};

// 获取完整标签（用于悬停提示）
const getFullLabel = (ann: Annotation): string => {
  const label = ann.label || '未知区域';
  const conf = Math.round((ann.confidence || 0) * 100);
  const riskLevel = getRiskLevel(ann.confidence);
  return `${label}\n置信度: ${conf}%\n风险等级: ${riskLevel}`;
};

// 计算标签宽度
const getLabelWidth = (ann: Annotation): number => {
  const text = formatLabel(ann);
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return (
    chineseChars * LABEL_CONFIG.CHAR_WIDTH_CN +
    otherChars * LABEL_CONFIG.CHAR_WIDTH_EN +
    LABEL_CONFIG.PADDING
  );
};

const resetView = () => {
  fitToScreen();
  emitZoom();
};

const setTool = (tool: 'pan' | 'rect') => {
  currentTool.value = tool;
};

const getCursor = () => {
  if (currentTool.value === 'pan') return isDragging.value ? 'grabbing' : 'grab';
  if (currentTool.value === 'rect') return 'crosshair';
  return 'default';
};

// Mouse Events
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = scale.value * delta;
    if (newScale >= 0.1 && newScale <= 8) {
      scale.value = newScale;
      emitZoom();
    }
  } else {
    // Pan
    translateX.value -= e.deltaX;
    translateY.value -= e.deltaY;
  }
};

const getLocalCoords = (e: MouseEvent) => {
  if (!viewportRef.value) return { x: 0, y: 0 };
  const rect = viewportRef.value.getBoundingClientRect();
  // Calculate coordinates relative to the image content (unscaled)
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;

  const x = (clientX - translateX.value) / scale.value;
  const y = (clientY - translateY.value) / scale.value;

  return { x, y };
};

const handleMouseDown = (e: MouseEvent) => {
  if (currentTool.value === 'pan') {
    isDragging.value = true;
    dragStart.value = { x: e.clientX - translateX.value, y: e.clientY - translateY.value };
  } else if (currentTool.value === 'rect') {
    isDrawing.value = true;
    const coords = getLocalCoords(e);
    drawStart.value = coords;
    drawCurrent.value = coords;
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    translateX.value = e.clientX - dragStart.value.x;
    translateY.value = e.clientY - dragStart.value.y;
  } else if (isDrawing.value) {
    drawCurrent.value = getLocalCoords(e);
  }
};

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false;
  } else if (isDrawing.value) {
    isDrawing.value = false;
    // Finalize rectangle
    const width = Math.abs(drawCurrent.value.x - drawStart.value.x);
    const height = Math.abs(drawCurrent.value.y - drawStart.value.y);
    const x = Math.min(drawCurrent.value.x, drawStart.value.x);
    const y = Math.min(drawCurrent.value.y, drawStart.value.y);

    if (width > 5 && height > 5) {
      // Minimum size
      addAnnotation({
        type: 'rect',
        x,
        y,
        width,
        height,
        label: '人工标注',
        confidence: 1.0,
        timestamp: Date.now(),
      });
    }
  }
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
  height: 100%; /* Fit parent container */
  border: none; /* Remove border as parent handles it */
  border-radius: 0; /* Remove radius as parent handles it */
  background: #f5f5f5;
}

.analyzer-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* background handled by parent */
}

.analyzer-content {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.analyzer-image {
  display: block;
  pointer-events: none; /* Let events pass to container */
}

.analyzer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none; /* Let events pass to container */
}
</style>
