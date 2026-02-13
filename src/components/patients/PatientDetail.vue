<template>
  <div class="patient-detail">
    <!-- 基本信息 -->
    <div class="detail-section">
      <div class="section-title">
        <q-icon name="person" color="primary" class="q-mr-sm" />
        基本信息
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <div class="detail-label">姓名</div>
          <div class="detail-value">{{ patient.name }}</div>
        </div>
        <div class="col-6">
          <div class="detail-label">性别</div>
          <div class="detail-value">
            <q-chip
              :color="patient.gender === 'female' ? 'pink-4' : 'blue-4'"
              text-color="white"
              size="sm"
            >
              {{ patient.gender === 'female' ? '女' : '男' }}
            </q-chip>
          </div>
        </div>
        <div class="col-6">
          <div class="detail-label">出生日期</div>
          <div class="detail-value">
            {{ formatDate(patient.birthDate) }}
            <span class="text-grey-6">（{{ calculateAge(patient.birthDate) }}岁）</span>
          </div>
        </div>
        <div class="col-6">
          <div class="detail-label">联系电话</div>
          <div class="detail-value">{{ patient.phone }}</div>
        </div>
        <div class="col-12">
          <div class="detail-label">性生活习惯</div>
          <div class="detail-value">{{ getSexualHistoryLabel(patient.sexualHistory) }}</div>
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- 证件信息 -->
    <div class="detail-section" v-if="patient.idCard || patient.medicalCardNo || patient.address">
      <div class="section-title">
        <q-icon name="credit_card" color="primary" class="q-mr-sm" />
        证件信息
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-6" v-if="patient.idCard">
          <div class="detail-label">身份证号码</div>
          <div class="detail-value">{{ patient.idCard }}</div>
        </div>
        <div class="col-6" v-if="patient.medicalCardNo">
          <div class="detail-label">医保卡号</div>
          <div class="detail-value">{{ patient.medicalCardNo }}</div>
        </div>
        <div class="col-12" v-if="patient.address">
          <div class="detail-label">家庭住址</div>
          <div class="detail-value">{{ patient.address }}</div>
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" v-if="patient.emergencyContact" />

    <!-- 紧急联络人 -->
    <div class="detail-section" v-if="patient.emergencyContact">
      <div class="section-title">
        <q-icon name="contact_phone" color="primary" class="q-mr-sm" />
        紧急联络人
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-4">
          <div class="detail-label">联络人姓名</div>
          <div class="detail-value">{{ patient.emergencyContact }}</div>
        </div>
        <div class="col-4" v-if="patient.emergencyPhone">
          <div class="detail-label">联络人电话</div>
          <div class="detail-value">{{ patient.emergencyPhone }}</div>
        </div>
        <div class="col-4" v-if="patient.emergencyRelation">
          <div class="detail-label">与患者关系</div>
          <div class="detail-value">{{ patient.emergencyRelation }}</div>
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" v-if="hasHealthInfo" />

    <!-- 健康档案 -->
    <div class="detail-section" v-if="hasHealthInfo">
      <div class="section-title">
        <q-icon name="medical_information" color="primary" class="q-mr-sm" />
        健康档案
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12" v-if="patient.allergyHistory">
          <div class="detail-label">过敏史</div>
          <div class="detail-value">{{ patient.allergyHistory }}</div>
        </div>
        <div class="col-12" v-if="patient.medicalHistory">
          <div class="detail-label">既往病史</div>
          <div class="detail-value">{{ patient.medicalHistory }}</div>
        </div>
        <div class="col-12" v-if="patient.familyHistory">
          <div class="detail-label">家族病史</div>
          <div class="detail-value">{{ patient.familyHistory }}</div>
        </div>
        <div class="col-12" v-if="patient.notes">
          <div class="detail-label">其他备注</div>
          <div class="detail-value">{{ patient.notes }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sexualHistoryOptions, type Patient } from 'src/services/patientService';

const props = defineProps<{
  patient: Patient;
}>();

// 是否有健康档案信息
const hasHealthInfo = computed(() => {
  return (
    props.patient.allergyHistory ||
    props.patient.medicalHistory ||
    props.patient.familyHistory ||
    props.patient.notes
  );
});

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 计算年龄
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 获取性生活习惯标签
const getSexualHistoryLabel = (value: string): string => {
  const option = sexualHistoryOptions.find((o) => o.value === value);
  return option?.label || value;
};
</script>

<style scoped lang="scss">
.patient-detail {
  .detail-section {
    .section-title {
      font-weight: 600;
      font-size: 14px;
      color: #1976d2;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
  }

  .detail-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .detail-value {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .patient-detail {
    .detail-label {
      color: var(--app-text-tertiary) !important;
    }

    .detail-value {
      color: var(--app-text-primary) !important;
    }

    .section-title {
      color: var(--q-primary) !important;
    }
  }
}
</style>
