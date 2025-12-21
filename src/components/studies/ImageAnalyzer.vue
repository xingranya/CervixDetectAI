<template>
  <div class="image-analyzer-container">
    <!-- Toolbar -->
    <div class="analyzer-toolbar q-pa-sm row items-center q-gutter-sm bg-grey-2">
      <q-btn-group flat>
        <q-btn icon="zoom_in" @click="zoomIn" dense flat title="放大">
          <q-tooltip>放大 (2x/4x/8x)</q-tooltip>
        </q-btn>
        <q-btn icon="zoom_out" @click="zoomOut" dense flat title="缩小" />
        <q-btn icon="restart_alt" @click="resetView" dense flat title="重置视图" />
        <div class="q-px-sm text-caption">{{ Math.round(scale * 100) }}%</div>
      </q-btn-group>

      <q-separator vertical />

      <q-btn-group flat>
        <q-btn
          icon="crop_square"
          :color="currentTool === 'rect' ? 'primary' : 'grey-7'"
          @click="setTool('rect')"
          dense
          flat
          title="矩形框选"
        >
          <q-tooltip>矩形框选工具</q-tooltip>
        </q-btn>
        <q-btn
          icon="auto_fix_high"
          color="secondary"
          @click="autoDetect"
          dense
          flat
          title="自动区域检测"
          :loading="detecting"
        >
          <q-tooltip>AI自动区域检测</q-tooltip>
        </q-btn>
        <q-btn icon="delete_outline" @click="clearAnnotations" dense flat title="清除所有标注" />
      </q-btn-group>

      <q-space />

      <q-btn
        icon="download"
        label="导出JSON"
        dense
        flat
        no-caps
        size="sm"
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
          <g v-for="(ann, index) in annotations" :key="index">
            <rect
              v-if="ann.type === 'rect'"
              :x="ann.x"
              :y="ann.y"
              :width="ann.width"
              :height="ann.height"
              fill="rgba(255, 0, 0, 0.1)"
              stroke="red"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            />
            <text
              v-if="ann.label"
              :x="ann.x"
              :y="ann.y - 5"
              fill="red"
              font-size="14"
              font-weight="bold"
            >
              {{ ann.label }} ({{ Math.round((ann.confidence || 0) * 100) }}%)
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

const props = defineProps<{
  src: string;
  initialAnnotations?: Annotation[];
}>();

const emit = defineEmits(['update:annotations', 'export']);

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

// Annotations
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

const annotations = ref<Annotation[]>(props.initialAnnotations || []);

// Refs
const viewportRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

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
    fitToScreen();
  }
};

const fitToScreen = () => {
  if (!viewportRef.value || !imageWidth.value || !imageHeight.value) return;

  const viewportW = viewportRef.value.clientWidth;
  const viewportH = viewportRef.value.clientHeight;

  const scaleW = viewportW / imageWidth.value;
  const scaleH = viewportH / imageHeight.value;

  scale.value = Math.min(scaleW, scaleH) * 0.9; // 90% fit

  // Center image
  translateX.value = (viewportW - imageWidth.value * scale.value) / 2;
  translateY.value = (viewportH - imageHeight.value * scale.value) / 2;
};

const zoomIn = () => {
  const newScale = scale.value * 1.5;
  if (newScale <= 8) scale.value = newScale; // Max 8x
};

const zoomOut = () => {
  const newScale = scale.value / 1.5;
  if (newScale >= 0.1) scale.value = newScale;
};

const resetView = () => {
  fitToScreen();
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
    if (newScale >= 0.1 && newScale <= 8) scale.value = newScale;
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
  height: 600px; /* Fixed height or flex */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #f5f5f5;
}

.analyzer-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
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
