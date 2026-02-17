<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'public-layout--auth': isAuthRoute }">
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Footer -->
    <AppFooter />
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppFooter from 'components/AppFooter.vue';

const route = useRoute();

const authPaths = new Set(['/', '/login', '/register', '/forgot-password']);
const isAuthRoute = computed(() => authPaths.has(route.path));

// Public layout for login, registration, and other public-facing pages
// Minimal layout without sidebar or header
// 支持深色模式,不强制切换到浅色模式
</script>
