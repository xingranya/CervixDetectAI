<template>
  <q-card flat bordered>
    <q-card-section class="bg-blue-1">
      <div class="text-h6">
        <q-icon name="info" color="primary" class="q-mr-sm" />
        病例信息
      </div>
      <div class="text-caption text-grey-7 q-mt-sm">
        请填写完整的患者信息，带 * 的为必填项
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-form class="q-gutter-md">
        <q-input
          v-model="internalInfo.patientName"
          outlined
          label="患者姓名 *"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || '请输入患者姓名']"
          @update:model-value="updateInfo"
        >
          <template v-slot:prepend>
            <q-icon name="person" color="primary" />
          </template>
        </q-input>

        <q-input
          v-model="internalInfo.patientId"
          outlined
          label="患者ID *"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || '请输入患者ID']"
          @update:model-value="updateInfo"
        >
          <template v-slot:prepend>
            <q-icon name="badge" color="primary" />
          </template>
        </q-input>

        <q-input
          v-model="internalInfo.description"
          outlined
          label="病例描述（可选）"
          type="textarea"
          rows="3"
          @update:model-value="updateInfo"
        >
          <template v-slot:prepend>
            <q-icon name="description" color="primary" />
          </template>
        </q-input>

        <q-select
          v-model="internalInfo.modality"
          outlined
          label="检查方式 *"
          :options="modalities"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || '请选择检查方式']"
          @update:model-value="updateInfo"
        >
          <template v-slot:prepend>
            <q-icon name="medical_services" color="primary" />
          </template>
        </q-select>

        <q-input
          v-model="internalInfo.studyDate"
          outlined
          label="检查日期 *"
          type="date"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || '请选择检查日期']"
          @update:model-value="updateInfo"
        >
          <template v-slot:prepend>
            <q-icon name="event" color="primary" />
          </template>
        </q-input>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PropType } from 'vue';

export interface StudyInfo {
  patientName: string;
  patientId: string;
  description: string;
  modality: string;
  studyDate: string;
}

const props = defineProps({
  modelValue: {
    type: Object as PropType<StudyInfo>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const internalInfo = ref<StudyInfo>({ ...props.modelValue });

const modalities = [
  'MRI（磁共振成像）',
  'CT（计算机断层扫描）',
  'PET-CT（正电子发射断层扫描）',
  '超声检查',
  '阴道镜检查',
  'X线造影',
  '其他',
];

watch(
  () => props.modelValue,
  (newVal) => {
    internalInfo.value = { ...newVal };
  },
  { deep: true },
);

const updateInfo = () => {
  emit('update:modelValue', internalInfo.value);
};
</script>
