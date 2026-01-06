<template>
  <div class="patient-selector">
    <q-select
      v-model="selectedPatient"
      :options="filteredPatients"
      :loading="loading"
      outlined
      use-input
      input-debounce="300"
      :label="label"
      option-label="name"
      option-value="id"
      clearable
      @filter="onFilter"
      @update:model-value="onSelect"
    >
      <template v-slot:prepend>
        <q-icon name="person_search" color="primary" />
      </template>

      <template v-slot:option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section avatar>
            <q-avatar
              :color="opt.gender === 'female' ? 'pink-3' : 'blue-3'"
              text-color="white"
              size="36px"
            >
              {{ opt.name?.charAt(0) }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ opt.name }}</q-item-label>
            <q-item-label caption>
              {{ opt.gender === 'female' ? '女' : '男' }} · {{ opt.phone }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> 未找到匹配的患者 </q-item-section>
        </q-item>
      </template>

      <template v-slot:after-options v-if="showAddButton">
        <q-item clickable @click="$emit('add-new')">
          <q-item-section avatar>
            <q-icon name="person_add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-primary">+ 新增患者</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- 快捷新增按钮（始终显示） -->
    <div v-if="showAddButton" class="q-mt-sm">
      <q-btn
        flat
        dense
        color="primary"
        icon="person_add"
        label="快捷新增患者"
        no-caps
        @click="$emit('add-new')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePatientStore } from 'stores/patientStore';
import type { Patient } from 'src/services/patientService';

const props = withDefaults(
  defineProps<{
    modelValue?: Patient | null;
    label?: string;
    showAddButton?: boolean;
  }>(),
  {
    label: '选择患者',
    showAddButton: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Patient | null): void;
  (e: 'add-new'): void;
}>();

const patientStore = usePatientStore();
const selectedPatient = ref<Patient | null>(props.modelValue || null);
const filteredPatients = ref<Patient[]>([]);
const loading = ref(false);

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    selectedPatient.value = newVal || null;
  },
);

// 搜索过滤
const onFilter = async (val: string, update: (fn: () => void) => void) => {
  loading.value = true;
  try {
    // 无论有没有搜索词，都通过 API 获取数据（默认 limit 为 20）
    const results = await patientStore.search(val);
    update(() => {
      filteredPatients.value = results;
    });
  } catch (error) {
    console.error('搜索患者失败:', error);
    update(() => {
      filteredPatients.value = [];
    });
  } finally {
    loading.value = false;
  }
};

// 选择患者
const onSelect = (patient: Patient | null) => {
  emit('update:modelValue', patient);
};
</script>
