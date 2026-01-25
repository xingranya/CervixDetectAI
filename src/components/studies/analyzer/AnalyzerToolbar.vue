<template>
  <div class="analyzer-toolbar q-pa-sm row items-center q-gutter-sm bg-white border-bottom-light">
    <!-- Zoom Controls -->
    <q-btn-group flat class="shadow-1 rounded-borders bg-grey-1">
      <q-btn icon="zoom_in" @click="$emit('zoomIn')" dense flat color="grey-8">
        <q-tooltip>放大 (2x/4x/8x)</q-tooltip>
      </q-btn>
      <q-btn icon="zoom_out" @click="$emit('zoomOut')" dense flat color="grey-8">
        <q-tooltip>缩小</q-tooltip>
      </q-btn>
      <q-separator vertical inset />
      <q-btn icon="restart_alt" @click="$emit('resetView')" dense flat color="grey-8">
        <q-tooltip>重置视图</q-tooltip>
      </q-btn>
    </q-btn-group>

    <q-separator vertical inset class="q-mx-sm" />

    <!-- Tool Controls -->
    <q-btn-group flat class="shadow-1 rounded-borders bg-grey-1">
      <q-btn
        icon="crop_square"
        :color="currentTool === 'rect' ? 'primary' : 'grey-7'"
        :class="{ 'bg-blue-1': currentTool === 'rect' }"
        @click="$emit('setTool', 'rect')"
        dense
        flat
      >
        <q-tooltip>矩形框选工具</q-tooltip>
      </q-btn>
      <q-btn
        icon="auto_fix_high"
        color="secondary"
        @click="$emit('autoDetect')"
        dense
        flat
        :loading="detecting"
      >
        <q-tooltip>AI自动区域检测</q-tooltip>
      </q-btn>
      <q-btn icon="delete_outline" @click="$emit('clearAnnotations')" dense flat color="negative">
        <q-tooltip>清除所有标注</q-tooltip>
      </q-btn>
    </q-btn-group>

    <q-space />

    <!-- Actions -->
    <q-btn
      icon="download"
      label="导出JSON"
      dense
      flat
      no-caps
      size="sm"
      color="primary"
      class="bg-blue-50"
      @click="$emit('exportAnnotations')"
      :disable="!hasAnnotations"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToolType } from './types';

defineProps<{
  currentTool: ToolType;
  detecting: boolean;
  hasAnnotations: boolean;
}>();

defineEmits<{
  (e: 'zoomIn'): void;
  (e: 'zoomOut'): void;
  (e: 'resetView'): void;
  (e: 'setTool', tool: ToolType): void;
  (e: 'autoDetect'): void;
  (e: 'clearAnnotations'): void;
  (e: 'exportAnnotations'): void;
}>();
</script>

<style scoped>
.border-bottom-light {
  border-bottom: 1px solid #e0e0e0;
}
</style>
