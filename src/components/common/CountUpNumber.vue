<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number;
    duration?: number;
    decimals?: number;
    format?: 'number' | 'currency' | 'percent' | 'raw';
  }>(),
  {
    duration: 720,
    decimals: 0,
    format: 'number',
  },
);

const currentValue = ref(0);
let frameId: number | null = null;

const formatValue = (value: number): string => {
  if (props.format === 'raw') {
    return value.toFixed(props.decimals);
  }

  if (props.format === 'percent') {
    return `${value.toFixed(props.decimals)}%`;
  }

  const rounded =
    props.decimals > 0 ? Number(value.toFixed(props.decimals)) : Math.round(value);

  return rounded.toLocaleString('zh-CN', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  });
};

const displayValue = computed(() => formatValue(currentValue.value));

const animateTo = (nextValue: number) => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }

  const startValue = currentValue.value;
  const startTime = performance.now();

  const tick = (timestamp: number) => {
    const progress = Math.min((timestamp - startTime) / props.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    currentValue.value = startValue + (nextValue - startValue) * eased;

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    currentValue.value = nextValue;
    frameId = null;
  };

  frameId = requestAnimationFrame(tick);
};

watch(
  () => props.value,
  (nextValue) => {
    animateTo(nextValue);
  },
);

onMounted(() => {
  animateTo(props.value);
});
</script>
