<template>
  <q-item
    clickable
    :to="route"
    :active="isActive"
    active-class="q-item--active text-weight-bold text-primary"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

interface EssentialLinkProps {
  title: string;
  caption?: string;
  icon?: string;
  route?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  icon: '',
  route: '',
  title: '',
  caption: ''
})

const currentRoute = useRoute()

const isActive = computed(() => {
  if (!props.route) return false
  if (props.route === '/app') {
    return currentRoute.path === props.route
  }

  return currentRoute.path === props.route || currentRoute.path.startsWith(`${props.route}/`)
})
</script>
