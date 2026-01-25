<template>
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
        <g v-for="(ann, index) in clampedAnnotations" :key="index" class="annotation-group">
          <rect
            v-if="ann.type === 'rect'"
            :x="ann.displayX"
            :y="ann.displayY"
            :width="ann.displayWidth"
            :height="ann.displayHeight"
            :fill="getAnnotationFill(ann.confidence, ann.source)"
            :stroke="getAnnotationColor(ann.confidence, ann.source)"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
            style="cursor: pointer; pointer-events: all"
          >
            <title>{{ getFullLabel(ann) }}</title>
          </rect>
          <!-- 标注标签背景 -->
          <rect
            v-if="ann.label"
            :x="ann.labelX"
            :y="ann.labelY"
            :width="getLabelWidth(ann)"
            height="20"
            :fill="getAnnotationColor(ann.confidence, ann.source)"
            rx="4"
            ry="4"
            style="cursor: pointer; pointer-events: all"
          >
            <title>{{ getFullLabel(ann) }}</title>
          </rect>
          <!-- 标注文字 -->
          <text
            v-if="ann.label"
            :x="(ann.labelX || 0) + 4"
            :y="(ann.labelY || 0) + 15"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Annotation, ToolType } from './types';
import {
  getAnnotationFill,
  getAnnotationColor,
  getFullLabel,
  getLabelWidth,
  formatLabel,
} from './utils';

const props = defineProps<{
  src: string;
  annotations: Annotation[];
  scale: number;
  translateX: number;
  translateY: number;
  currentTool: ToolType;
}>();

const emit = defineEmits<{
  (e: 'image-load', width: number, height: number): void;
  (e: 'update:translate', x: number, y: number): void;
  (e: 'update:scale', scale: number): void;
  (e: 'add-annotation', annotation: Annotation): void;
}>();

// Refs
const viewportRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

// State
const imageLoaded = ref(false);
const imageWidth = ref(0);
const imageHeight = ref(0);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const isDrawing = ref(false);
const drawStart = ref({ x: 0, y: 0 });
const drawCurrent = ref({ x: 0, y: 0 });

// Computed
const clampedAnnotations = computed(() => {
  if (!imageLoaded.value || !imageWidth.value || !imageHeight.value) return [];

  return props.annotations.map((ann) => {
    // 1. Clamp coordinates
    const x = Math.max(0, Math.min(ann.x, imageWidth.value));
    const y = Math.max(0, Math.min(ann.y, imageHeight.value));
    // Ensure width/height don't exceed image bounds from x/y
    const width = Math.min(ann.width, imageWidth.value - x);
    const height = Math.min(ann.height, imageHeight.value - y);

    // 2. Smart Label Positioning
    const labelWidth = getLabelWidth(ann);
    const labelHeight = 24; // Height of rect + padding

    // Horizontal: Align left, shift left if overflow
    let labelX = x;
    if (labelX + labelWidth > imageWidth.value) {
      labelX = Math.max(0, imageWidth.value - labelWidth);
    }

    // Vertical: Top > Bottom > Inside Top
    let labelY = y - 24;
    // If top overflow
    if (labelY < 0) {
      // Try bottom
      labelY = y + height + 4;
      // If bottom overflow
      if (labelY + labelHeight > imageHeight.value) {
        // Inside top
        labelY = y;
      }
    }

    return {
      ...ann,
      displayX: x,
      displayY: y,
      displayWidth: width,
      displayHeight: height,
      labelX,
      labelY,
    };
  });
});

// Methods
const onImageLoad = () => {
  if (imageRef.value) {
    imageWidth.value = imageRef.value.naturalWidth;
    imageHeight.value = imageRef.value.naturalHeight;
    imageLoaded.value = true;
    emit('image-load', imageWidth.value, imageHeight.value);
  }
};

const getCursor = () => {
  if (props.currentTool === 'pan') return isDragging.value ? 'grabbing' : 'grab';
  if (props.currentTool === 'rect') return 'crosshair';
  return 'default';
};

const getLocalCoords = (e: MouseEvent) => {
  if (!viewportRef.value) return { x: 0, y: 0 };
  const rect = viewportRef.value.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;

  const x = (clientX - props.translateX) / props.scale;
  const y = (clientY - props.translateY) / props.scale;

  return { x, y };
};

// Event Handlers
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Zoom handled by parent mostly, but we calculate delta here
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = props.scale * delta;
    // Bounds check usually done in parent, but good to emit intention
    emit('update:scale', newScale);
  } else {
    // Pan
    emit('update:translate', props.translateX - e.deltaX, props.translateY - e.deltaY);
  }
};

const handleMouseDown = (e: MouseEvent) => {
  if (props.currentTool === 'pan') {
    isDragging.value = true;
    dragStart.value = {
      x: e.clientX - props.translateX,
      y: e.clientY - props.translateY
    };
  } else if (props.currentTool === 'rect') {
    isDrawing.value = true;
    const coords = getLocalCoords(e);
    drawStart.value = coords;
    drawCurrent.value = coords;
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    emit('update:translate', e.clientX - dragStart.value.x, e.clientY - dragStart.value.y);
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
      emit('add-annotation', {
        type: 'rect',
        x,
        y,
        width,
        height,
        label: '手动标注区域',
        confidence: 1.0,
        timestamp: Date.now(),
        source: 'manual',
      });
    }
  }
};

// Expose internal viewport dimensions for parent fit-to-screen logic
defineExpose({
  viewport: viewportRef,
});
</script>

<style scoped>
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
  pointer-events: none;
}

.analyzer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
