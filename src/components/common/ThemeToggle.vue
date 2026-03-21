<template>
  <q-btn-dropdown flat dense round icon="brightness_6" aria-label="切换主题">
    <q-list dense style="min-width: 160px">
      <q-item
        v-for="option in themeOptions"
        :key="option.value"
        clickable
        v-close-popup
        :active="themeStore.themeMode === option.value"
        active-class="text-primary"
        @click="themeStore.setTheme(option.value)"
      >
        <q-item-section avatar>
          <q-icon :name="option.icon" size="sm" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ option.label }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="themeStore.themeMode === option.value">
          <q-icon name="check" color="primary" size="xs" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { useThemeStore } from 'stores/themeStore';

const themeStore = useThemeStore();

const themeOptions = [
  { value: 'light' as const, label: '浅色模式', icon: 'light_mode' },
  { value: 'dark' as const, label: '深色模式', icon: 'dark_mode' },
  { value: 'system' as const, label: '跟随系统', icon: 'settings_brightness' },
];
</script>
