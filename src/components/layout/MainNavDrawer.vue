<template>
  <q-drawer
    :model-value="modelValue"
    show-if-above
    bordered
    class="bg-grey-2 main-nav-drawer"
    :width="200"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-list>
      <q-item-label header class="text-weight-bold">CervixDetectAI</q-item-label>

      <template v-for="(section, index) in MAIN_NAVIGATION_SECTIONS" :key="section.title || index">
        <q-separator v-if="index > 0" class="q-my-sm" />
        <q-item-label v-if="section.title" header class="text-weight-bold">
          {{ section.title }}
        </q-item-label>
        <EssentialLink
          v-for="link in section.links"
          :key="link.title"
          v-bind="link"
        />
      </template>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import EssentialLink from 'src/components/EssentialLink.vue';
import { MAIN_NAVIGATION_SECTIONS } from 'src/constants/navigation';

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.main-nav-drawer {
  max-width: 200px;
}
</style>
