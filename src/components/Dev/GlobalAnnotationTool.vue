<script setup lang="ts">
import { AgentUIAnnotation } from 'agent-ui-annotation/vue';
import type { Annotation } from 'agent-ui-annotation/vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

function handleCreate(annotation: Annotation) {
  console.log('[Agent Annotation] Created:', annotation);
  $q.notify({
    message: '标注已创建',
    color: 'positive',
    icon: 'check',
    position: 'top',
    timeout: 1000
  });
}

function handleCopy() {
  console.log('[Agent Annotation] Copied output');
  $q.notify({
    message: '标注数据已复制到剪贴板',
    color: 'info',
    icon: 'content_copy',
    position: 'top'
  });
}
</script>

<template>
  <!-- 标注工具主组件 -->
  <AgentUIAnnotation
    theme="auto"
    output-level="standard"
    @annotation-create="handleCreate"
    @copy="handleCopy"
  />
</template>
