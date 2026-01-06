<template>
  <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
    <!-- 基本信息 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm">
      <q-icon name="person" class="q-mr-sm" />
      基本信息
    </div>

    <div class="row q-col-gutter-md">
      <!-- 姓名 -->
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.name"
          outlined
          label="患者姓名 *"
          :rules="[(val) => !!val || '请输入患者姓名']"
        >
          <template v-slot:prepend>
            <q-icon name="person" color="primary" />
          </template>
        </q-input>
      </div>

      <!-- 性别 -->
      <div class="col-md-6 col-12">
        <q-select
          v-model="formData.gender"
          outlined
          label="性别 *"
          :options="genderOptions"
          emit-value
          map-options
          :rules="[(val) => !!val || '请选择性别']"
        >
          <template v-slot:prepend>
            <q-icon name="wc" color="primary" />
          </template>
        </q-select>
      </div>

      <!-- 出生日期 -->
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.birthDate"
          outlined
          label="出生日期 *"
          readonly
          :rules="[(val) => !!val || '请选择出生日期']"
        >
          <template v-slot:prepend>
            <q-icon name="cake" color="primary" />
          </template>
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="formData.birthDate"
              mask="YYYY-MM-DD"
              :locale="dateLocale"
              default-year-month="2000/01"
              today-btn
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="取消" color="primary" flat v-close-popup />
                <q-btn label="确定" color="primary" flat v-close-popup />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-input>
      </div>

      <!-- 联系电话 -->
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.phone"
          outlined
          label="联系电话 *"
          :rules="[(val) => !!val || '请输入联系电话']"
        >
          <template v-slot:prepend>
            <q-icon name="phone" color="primary" />
          </template>
        </q-input>
      </div>

      <!-- 性生活习惯 -->
      <div class="col-12">
        <q-select
          v-model="formData.sexualHistory"
          outlined
          label="性生活习惯 *"
          :options="sexualHistoryOptions"
          emit-value
          map-options
          :rules="[(val) => !!val || '请选择性生活习惯']"
        >
          <template v-slot:prepend>
            <q-icon name="favorite" color="primary" />
          </template>
        </q-select>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- 证件信息 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm">
      <q-icon name="credit_card" class="q-mr-sm" />
      证件信息（可选）
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-md-6 col-12">
        <q-input v-model="formData.idCard" outlined label="身份证号码">
          <template v-slot:prepend>
            <q-icon name="badge" color="grey" />
          </template>
        </q-input>
      </div>
      <div class="col-md-6 col-12">
        <q-input v-model="formData.medicalCardNo" outlined label="医保卡号">
          <template v-slot:prepend>
            <q-icon name="credit_card" color="grey" />
          </template>
        </q-input>
      </div>
      <div class="col-12">
        <q-input v-model="formData.address" outlined label="家庭住址">
          <template v-slot:prepend>
            <q-icon name="home" color="grey" />
          </template>
        </q-input>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- 紧急联络人 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm">
      <q-icon name="contact_phone" class="q-mr-sm" />
      紧急联络人（可选）
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-md-4 col-12">
        <q-input v-model="formData.emergencyContact" outlined label="联络人姓名">
          <template v-slot:prepend>
            <q-icon name="person" color="grey" />
          </template>
        </q-input>
      </div>
      <div class="col-md-4 col-12">
        <q-input v-model="formData.emergencyPhone" outlined label="联络人电话">
          <template v-slot:prepend>
            <q-icon name="phone" color="grey" />
          </template>
        </q-input>
      </div>
      <div class="col-md-4 col-12">
        <q-input v-model="formData.emergencyRelation" outlined label="与患者关系">
          <template v-slot:prepend>
            <q-icon name="family_restroom" color="grey" />
          </template>
        </q-input>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- 健康档案 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm">
      <q-icon name="medical_information" class="q-mr-sm" />
      健康档案（可选）
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.allergyHistory"
          outlined
          label="过敏史"
          type="textarea"
          rows="2"
          placeholder="如：青霉素过敏、花粉过敏等"
        />
      </div>
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.medicalHistory"
          outlined
          label="既往病史"
          type="textarea"
          rows="2"
          placeholder="如：高血压、糖尿病、手术史等"
        />
      </div>
      <div class="col-md-6 col-12">
        <q-input
          v-model="formData.familyHistory"
          outlined
          label="家族病史"
          type="textarea"
          rows="2"
          placeholder="如：家族遗传病史"
        />
      </div>
      <div class="col-md-6 col-12">
        <q-input v-model="formData.notes" outlined label="其他备注" type="textarea" rows="2" />
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="row justify-end q-gutter-md q-mt-lg">
      <q-btn flat label="取消" color="grey" @click="$emit('cancel')" />
      <q-btn type="submit" color="primary" :label="isEditing ? '保存修改' : '添加患者'" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  genderOptions,
  sexualHistoryOptions,
  type CreatePatientRequest,
} from 'src/services/patientService';

const props = defineProps<{
  modelValue: CreatePatientRequest;
  isEditing?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: CreatePatientRequest): void;
  (e: 'submit', value: CreatePatientRequest): void;
  (e: 'cancel'): void;
}>();

const formData = ref<CreatePatientRequest>({ ...props.modelValue });

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newVal) => {
    formData.value = { ...newVal };
  },
  { deep: true },
);

// 日期选择器中文配置
const dateLocale = {
  days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  daysShort: ['日', '一', '二', '三', '四', '五', '六'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthsShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
};

// 提交表单
const handleSubmit = () => {
  emit('submit', formData.value);
};
</script>
