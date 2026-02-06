<template>
  <router-view />

  <!-- 仅在开发环境渲染标注工具 -->
  <DevAnnotationTool v-if="isDev" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import { useAuthStore } from 'stores/authStore';

// Quasar 中 process.env.DEV 是布尔值，构建时会被静态替换
const isDev = process.env.DEV;

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
