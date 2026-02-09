<template>
  <router-view />

  <!-- 仅在开发环境渲染标注工具 -->
  <Suspense v-if="isDev">
    <DevAnnotationTool />
  </Suspense>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import { useAuthStore } from 'stores/authStore';

// 使用 import.meta.env 获取 Vite 环境变量
const isDev = import.meta.env.DEV;

const authStore = useAuthStore();

// 动态导入组件 - 生产构建时这部分代码会被 Tree-shaking 移除
// 只有 isDev 为 true 时才会请求该组件及其依赖
const DevAnnotationTool = isDev
  ? defineAsyncComponent(() => import('src/components/Dev/GlobalAnnotationTool.vue'))
  : null;

// 初始化认证状态，避免首屏误判
onMounted(() => {
  if (!authStore.hasInitialized) {
    authStore.initializeAuth();
  }
});
</script>
