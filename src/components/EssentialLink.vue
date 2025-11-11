<template>
  <q-item
    clickable
    tag="a"
    target="_blank"
    :to="link"
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
  link?: string;
  icon?: string;
  route?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  link: () => '',
  icon: () => '',
  route: () => '',
  title: () => '',
  caption: () => ''
})

const route = useRoute()

const isActive = computed(() => {
  return props.route && route.path.startsWith(props.route)
})
</script>