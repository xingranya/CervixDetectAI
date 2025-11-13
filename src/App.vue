<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

// Initialize auth on app mount
onMounted(() => {
  authStore.initializeAuth()
})
</script>
