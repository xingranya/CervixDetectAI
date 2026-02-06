<script setup lang="ts">
import type { Annotation } from 'agent-ui-annotation/vue';
import { useQuasar } from 'quasar';
import { shallowRef } from 'vue';
import type { Component } from 'vue';

const $q = useQuasar();
const AgentUIAnnotationComponent = shallowRef<Component | null>(null);

try {
  const module = await import('agent-ui-annotation/vue');
  AgentUIAnnotationComponent.value = module.AgentUIAnnotation ?? null;
} catch (error) {
  console.warn('[Agent Annotation] Load failed:', error);
}

function handleCreate(annotation: Annotation) {
  console.log('[Agent Annotation] Created:', annotation);
  $q.notify({
    message: '标注已创建',
    color: 'positive',
    icon: 'check',
    position: 'top',
    timeout: 1000,
  });
}

function handleCopy() {
  console.log('[Agent Annotation] Copied output');
  $q.notify({
    message: '标注数据已复制到剪贴板',
    color: 'info',
    icon: 'content_copy',
    position: 'top',
  });
}
</script>

<template>
  <!-- 标注工具主组件（开发辅助，加载失败时不渲染以避免影响业务页面） -->
  <component
    :is="AgentUIAnnotationComponent"
    v-if="AgentUIAnnotationComponent"
    theme="auto"
    output-level="standard"
    @annotation-create="handleCreate"
    @copy="handleCopy"
  />
</template>
