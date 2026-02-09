<script setup lang="ts">
import type { Annotation } from 'agent-ui-annotation/vue';
import { useQuasar } from 'quasar';
import { onMounted, ref } from 'vue';

const $q = useQuasar();
const elementRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  try {
    // 动态导入并初始化中文
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import('agent-ui-annotation') as any;
    if (module.initI18n) {
      module.initI18n({ locale: 'zh-CN' });
    }
    console.log('[Agent Annotation] Web Component 注册成功，已切换中文');
  } catch (error) {
    console.warn('[Agent Annotation] 加载失败:', error);
  }
});

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
  <!-- 直接使用 Web Component -->
  <agent-ui-annotation
    ref="elementRef"
    theme="auto"
    output-level="standard"
    @annotation:scope="handleCreate"
    @annotation:copy="handleCopy"
  />
</template>
