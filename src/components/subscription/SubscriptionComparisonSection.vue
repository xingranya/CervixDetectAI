<template>
  <q-card flat bordered class="subscription-comparison-card">
    <q-card-section class="subscription-comparison-card__section">
      <div class="subscription-comparison-card__header">
        <div class="subscription-comparison-card__eyebrow">订阅对比</div>
        <div class="subscription-comparison-card__title">基础套餐与顶级套餐能力矩阵</div>
        <div class="subscription-comparison-card__subtitle">
          用更直观的能力符号帮助机构快速判断当前阶段更适合哪一档采购层级。
        </div>
      </div>

      <q-markup-table flat dense class="subscription-comparison-card__table">
        <thead>
          <tr>
            <th class="text-left">维度</th>
            <th class="text-center">基础套餐</th>
            <th class="text-center">顶级套餐</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in planComparisonRows" :key="row.label">
            <td>{{ row.label }}</td>
            <td class="text-center">
              <div class="comparison-cell" :class="comparisonMeta(row.basic).className">
                <q-icon
                  v-if="comparisonMeta(row.basic).icon"
                  :name="comparisonMeta(row.basic).icon!"
                  size="16px"
                />
                <span>{{ comparisonMeta(row.basic).label }}</span>
              </div>
            </td>
            <td class="text-center">
              <div class="comparison-cell" :class="comparisonMeta(row.premium).className">
                <q-icon
                  v-if="comparisonMeta(row.premium).icon"
                  :name="comparisonMeta(row.premium).icon!"
                  size="16px"
                />
                <span>{{ comparisonMeta(row.premium).label }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  planComparisonRows: Array<{
    label: string;
    basic: string;
    premium: string;
  }>;
}>();

const comparisonMeta = (value: string) => {
  if (value === '包含') {
    return {
      label: '包含',
      icon: 'done',
      className: 'comparison-cell--positive',
    };
  }

  if (value === '不含') {
    return {
      label: '—',
      icon: '',
      className: 'comparison-cell--muted',
    };
  }

  if (value === '增强版') {
    return {
      label: '增强',
      icon: 'auto_awesome',
      className: 'comparison-cell--accent',
    };
  }

  return {
    label: value,
    icon: '',
    className: 'comparison-cell--text',
  };
};
</script>

<style scoped lang="scss">
.subscription-comparison-card {
  width: 100%;
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.96) 100%);
  box-shadow: 0 18px 36px rgba(15, 57, 87, 0.07);
}

.subscription-comparison-card__section {
  padding: 20px;
}

.subscription-comparison-card__header {
  margin-bottom: 18px;
}

.subscription-comparison-card__eyebrow {
  color: #678095;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-comparison-card__title {
  margin-top: 8px;
  color: #153852;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.22;
}

.subscription-comparison-card__subtitle {
  max-width: 760px;
  margin-top: 10px;
  color: #5a7488;
  font-size: 14px;
  line-height: 1.72;
}

.subscription-comparison-card__table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}

.subscription-comparison-card__table :deep(th) {
  color: #476177;
  font-weight: 700;
  background: rgba(240, 247, 253, 0.94);
}

.subscription-comparison-card__table :deep(td),
.subscription-comparison-card__table :deep(th) {
  padding: 14px 12px;
}

.subscription-comparison-card__table :deep(tbody tr:nth-child(odd)) {
  background: rgba(242, 248, 252, 0.82);
}

.comparison-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 24px;
  font-size: 13px;
  font-weight: 700;
}

.comparison-cell--positive {
  color: #2563eb;
}

.comparison-cell--muted {
  color: #94a3b8;
}

.comparison-cell--accent {
  color: #2563eb;
}

.comparison-cell--text {
  color: #355770;
  font-weight: 600;
}

@media (max-width: 599px) {
  .subscription-comparison-card {
    border-radius: 20px;
  }

  .subscription-comparison-card__section {
    padding: 18px;
  }
}
</style>
