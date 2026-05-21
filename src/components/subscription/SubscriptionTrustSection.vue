<template>
  <section class="subscription-trust-shell">
    <div class="subscription-trust-shell__heading">
      <div class="subscription-trust-shell__eyebrow">信任背书</div>
      <div class="subscription-trust-shell__title">模型可信度、采购信心与开通路径</div>
      <div class="subscription-trust-shell__subtitle">
        将临床级模型指标、服务价值、知识产权与标准化接入流程统一呈现，帮助医疗机构快速完成上线前的信任确认与部署决策。
      </div>
    </div>

    <div class="subscription-trust-shell__columns">
      <div class="subscription-trust-shell__column">
        <q-card flat bordered class="subscription-trust-card subscription-trust-card--metrics">
          <q-card-section class="subscription-trust-card__section">
            <div class="subscription-trust-card__header">
              <div class="subscription-trust-card__eyebrow">模型指标</div>
              <div class="subscription-trust-card__title">临床级 AI 引擎算力与诊断效能</div>
              <div class="subscription-trust-card__subtitle">
                历经百万级真实临床数据持续迭代，核心算法模型指标处于行业领先水平，为医疗决策提供精准、可解释的算力支持。
              </div>
            </div>

            <div class="subscription-trust-card__metrics-panel">
              <div class="subscription-trust-card__radar-wrap">
                <div ref="radarChartRef" class="subscription-trust-card__radar-chart"></div>
              </div>

              <div class="subscription-trust-card__metric-stack">
                <div
                  v-for="metric in headlineMetrics"
                  :key="metric.label"
                  class="subscription-trust-card__headline-metric"
                >
                  <div class="subscription-trust-card__headline-topline">
                    <span>{{ metric.label }}</span>
                    <q-icon
                      :name="metric.trendIcon"
                      :color="metric.emphasis ? 'positive' : 'primary'"
                      size="16px"
                    />
                  </div>
                  <div
                    class="subscription-trust-card__headline-value"
                    :class="{ 'subscription-trust-card__headline-value--accent': metric.emphasis }"
                  >
                    <span v-if="metric.prefix">{{ metric.prefix }}</span><CountUpNumber
                      :value="metric.numericValue"
                      :duration="820"
                      :decimals="metric.decimals"
                    /><span v-if="metric.suffix">{{ metric.suffix }}</span>
                  </div>
                  <div class="subscription-trust-card__headline-meta">{{ metric.caption }}</div>
                  <div class="subscription-trust-card__sparkline-track">
                    <div
                      class="subscription-trust-card__sparkline-fill"
                      :style="{ width: `${metric.trendWidth}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="subscription-trust-card">
          <q-card-section class="subscription-trust-card__section">
            <div class="subscription-trust-card__header">
              <div class="subscription-trust-card__eyebrow">服务优势</div>
              <div class="subscription-trust-card__title">专为各级医疗机构打造的弹性智诊方案</div>
              <div class="subscription-trust-card__subtitle">
                告别传统医疗软件高昂的买断与实施成本，以轻量化 SaaS 架构赋能宫颈癌早筛业务线。
              </div>
            </div>

            <div class="subscription-trust-list subscription-trust-list--divided">
              <div
                v-for="item in serviceAdvantages"
                :key="item.title"
                class="subscription-trust-list__row"
              >
                <q-icon color="primary" name="verified" size="18px" />
                <div>
                  <div class="subscription-trust-list__title">{{ item.title }}</div>
                  <div class="subscription-trust-list__desc">{{ item.description }}</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="subscription-trust-shell__column">
        <q-card flat bordered class="subscription-trust-card subscription-trust-card--copyright">
          <q-card-section class="subscription-trust-card__section">
            <div class="subscription-trust-card__header">
              <div class="subscription-trust-card__eyebrow">软著与合规</div>
              <div class="subscription-trust-card__title">知识产权保护与医疗合规资质</div>
              <div class="subscription-trust-card__subtitle">
                核心技术栈拥有完整自主知识产权。系统架构与数据流转严格遵循国家医疗器械监督管理体系与信息安全规范。
              </div>
            </div>

            <div class="subscription-trust-card__copyright-list">
              <button
                v-for="(copyright, index) in sortedSoftwareCopyrights"
                :key="copyright.id"
                type="button"
                class="subscription-copyright-card"
                :class="{ 'subscription-copyright-card--wide': index === sortedSoftwareCopyrights.length - 1 && sortedSoftwareCopyrights.length % 2 === 1 }"
                @click="$emit('preview-certificate', copyright)"
              >
                <div class="subscription-copyright-card__head">
                  <div class="subscription-copyright-card__title">{{ copyright.name }}</div>
                  <q-badge color="blue-1" text-color="primary">{{ copyright.version }}</q-badge>
                </div>
                <div class="subscription-copyright-card__meta">
                  <div>登记号：{{ copyright.registrationNo }}</div>
                  <div>证书号：{{ copyright.certificateNo }}</div>
                </div>
                <q-icon name="copyright" size="36px" class="subscription-copyright-card__decor" />
              </button>
            </div>

            <div class="subscription-trust-list subscription-trust-list--soft">
              <div
                v-for="item in complianceItems"
                :key="item"
                class="subscription-trust-list__row subscription-trust-list__row--compact"
              >
                <q-icon color="positive" name="check_circle" size="16px" />
                <span class="subscription-trust-list__plain">{{ item }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="subscription-trust-card">
          <q-card-section class="subscription-trust-card__section">
            <div class="subscription-trust-card__header">
              <div class="subscription-trust-card__eyebrow">订阅指南</div>
              <div class="subscription-trust-card__title">标准化极速接入流程</div>
              <div class="subscription-trust-card__subtitle">
                最快 15 分钟完成机构级业务初始化，让前沿 AI 诊断能力迅速转化为临床生产力。
              </div>
            </div>

            <div class="subscription-trust-list subscription-trust-list--divided">
              <div
                v-for="step in guideSteps"
                :key="step.title"
                class="subscription-trust-list__row"
              >
                <q-avatar color="primary" text-color="white" size="28px">{{ step.index }}</q-avatar>
                <div>
                  <div class="subscription-trust-list__title">{{ step.title }}</div>
                  <div class="subscription-trust-list__desc">{{ step.description }}</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import CountUpNumber from 'src/components/common/CountUpNumber.vue';
import type { SoftwareCopyrightItem } from 'src/constants/softwareCopyrights';

defineProps<{
  sortedSoftwareCopyrights: SoftwareCopyrightItem[];
}>();

defineEmits<{
  (e: 'preview-certificate', certificate: SoftwareCopyrightItem): void;
}>();

const radarChartRef = ref<HTMLElement | null>(null);
let radarChartInstance: echarts.ECharts | null = null;

const radarIndicators = [
  { name: '临床准确率', max: 100, score: 97.8 },
  { name: '病变检出率', max: 100, score: 96.3 },
  { name: '敏感性', max: 100, score: 94.7 },
  { name: '特异性', max: 100, score: 98.2 },
  { name: '鲁棒性', max: 100, score: 92 },
  { name: '推理速度', max: 100, score: 90 },
] as const;

const headlineMetrics = [
  {
    label: '临床准确率',
    numericValue: 97.8,
    caption: '核心判读稳定度持续保持高位',
    trendWidth: 92,
    trendIcon: 'trending_up',
    emphasis: true,
    decimals: 1,
    prefix: '',
    suffix: '%',
  },
  {
    label: '病变检出率',
    numericValue: 96.3,
    caption: '对高风险病灶具备良好识别能力',
    trendWidth: 88,
    trendIcon: 'north_east',
    emphasis: true,
    decimals: 1,
    prefix: '',
    suffix: '%',
  },
  {
    label: '平均分析时间',
    numericValue: 25,
    caption: '云端算力快速返回辅助结果',
    trendWidth: 74,
    trendIcon: 'schedule',
    emphasis: false,
    decimals: 0,
    prefix: '~',
    suffix: '秒',
  },
  {
    label: '训练数据量',
    numericValue: 120,
    caption: '临床数据池持续扩容迭代模型',
    trendWidth: 96,
    trendIcon: 'show_chart',
    emphasis: false,
    decimals: 0,
    prefix: '',
    suffix: '万+',
  },
] as const;

const serviceAdvantages = [
  {
    title: '灵活订阅，按需适配筛查体量',
    description: '提供标准化的周期订阅与按次计费模式。无论是基层门诊的日常筛查，还是三甲医院的高并发体检任务，均可精准匹配，实现降本增效。',
  },
  {
    title: '完整闭环，覆盖核心临床路径',
    description: '从前端样本扫查、云端 AI 辅助判读，到多格式结构化报告生成及患者随访管理，打通妇科筛查全流程业务数据。',
  },
  {
    title: '极简实施，开箱即用的云端体验',
    description: '无需复杂的本地机房部署。机构账号一键开通，浏览器与多终端即开即用，系统持续平滑升级，时刻保持最优算法版本。',
  },
];

const complianceItems = [
  'NMPA三类医疗器械认证',
  'ISO 13485医疗器械质量管理体系',
  '国家重点研发计划项目支持',
];

const guideSteps = [
  {
    index: '1',
    title: '业务体量评估',
    description: '根据科室年度筛查总人次与业务形态，选择基础门诊版或面向高阶场景的旗舰方案。',
  },
  {
    index: '2',
    title: '核心模块匹配',
    description: '确认是否需要接入 HPV 分型联合筛查、p16/Ki67 双染图像支持及全流程随访闭环系统。',
  },
  {
    index: '3',
    title: '确认授权与订阅',
    description: '选定按月或按年的 SaaS 授权周期。支持机构级账号统一管理与多级子账号并发授权。',
  },
  {
    index: '4',
    title: '云端部署与启用',
    description: '授权激活后系统即刻初始化资源池，自动接入云端算力，并可按需对接机构现有的 HIS/PACS 系统。',
  },
];

const updateRadarChart = () => {
  if (!radarChartInstance) return;

  const option: EChartsOption = {
    animationDuration: 800,
    tooltip: {},
    radar: {
      indicator: radarIndicators.map((item) => ({ name: item.name, max: item.max })),
      shape: 'polygon',
      splitNumber: 4,
      radius: '68%',
      axisName: {
        color: '#5b768a',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.22)',
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0)', 'rgba(37, 99, 235, 0.015)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarIndicators.map((item) => item.score),
            name: '模型能力',
            symbolSize: 5,
            lineStyle: {
              width: 2.5,
              color: '#2563eb',
              shadowBlur: 12,
              shadowColor: 'rgba(37, 99, 235, 0.25)',
            },
            itemStyle: {
              color: '#0f8a66',
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: 'rgba(37, 99, 235, 0.22)' },
                { offset: 1, color: 'rgba(15, 138, 102, 0.12)' },
              ]),
            },
          },
        ],
      },
    ],
  };

  radarChartInstance.setOption(option, true);
};

const initRadarChart = () => {
  if (!radarChartRef.value || radarChartInstance) return;
  radarChartInstance = echarts.init(radarChartRef.value);
  updateRadarChart();
};

const handleResize = () => {
  radarChartInstance?.resize();
};

onMounted(() => {
  initRadarChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  radarChartInstance?.dispose();
  radarChartInstance = null;
});
</script>

<style scoped lang="scss">
.subscription-trust-shell {
  display: grid;
  gap: 18px;
  width: 100%;
}

.subscription-trust-shell__heading {
  display: grid;
  gap: 8px;
}

.subscription-trust-shell__eyebrow,
.subscription-trust-card__eyebrow {
  color: #678095;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subscription-trust-shell__title {
  color: #153852;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
}

.subscription-trust-shell__subtitle,
.subscription-trust-card__subtitle {
  max-width: 760px;
  color: #5a7488;
  font-size: 14px;
  line-height: 1.72;
}

.subscription-trust-shell__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.subscription-trust-shell__column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
}

.subscription-trust-card {
  border: 1px solid rgba(17, 76, 114, 0.08);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.96) 100%);
  box-shadow: 0 16px 34px rgba(15, 57, 87, 0.07);
  transition:
    transform 0.26s ease,
    box-shadow 0.3s ease,
    border-color 0.26s ease,
    background 0.3s ease;
}

.subscription-trust-card:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 24px 42px rgba(15, 57, 87, 0.1);
}

.subscription-trust-card__section {
  padding: 18px;
}

.subscription-trust-card__header {
  margin-bottom: 16px;
}

.subscription-trust-card__title {
  margin-top: 8px;
  color: #153852;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
}

.subscription-trust-card__metrics-panel {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr);
  gap: 18px;
  align-items: stretch;
}

.subscription-trust-card__radar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 8px;
  border-radius: 20px;
  background:
    radial-gradient(circle at center, rgba(37, 99, 235, 0.07), transparent 58%),
    linear-gradient(180deg, rgba(245, 249, 253, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 1px solid rgba(17, 76, 114, 0.06);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.subscription-trust-card:hover .subscription-trust-card__radar-wrap {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 18px 26px rgba(15, 57, 87, 0.06);
}

.subscription-trust-card__radar-chart {
  width: 100%;
  height: 290px;
}

.subscription-trust-card__metric-stack {
  display: grid;
  gap: 12px;
}

.subscription-trust-card__headline-metric {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(244, 249, 253, 0.96);
  border: 1px solid rgba(17, 76, 114, 0.06);
  transition:
    transform 0.22s ease,
    box-shadow 0.24s ease,
    border-color 0.22s ease;
}

.subscription-trust-card__headline-metric:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 14px 22px rgba(15, 57, 87, 0.06);
}

.subscription-trust-card__headline-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.subscription-trust-card__headline-topline span {
  color: #617a8e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.subscription-trust-card__headline-value {
  color: #18364d;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.subscription-trust-card__headline-value--accent {
  color: #0f8a66;
}

.subscription-trust-card__headline-meta {
  color: #5f798e;
  font-size: 12px;
  line-height: 1.6;
}

.subscription-trust-card__sparkline-track {
  position: relative;
  overflow: hidden;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.subscription-trust-card__sparkline-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.84) 0%, rgba(15, 138, 102, 0.88) 100%);
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.2);
  transition: width 0.7s ease, filter 0.24s ease;
}

.subscription-trust-card__headline-metric:hover .subscription-trust-card__sparkline-fill {
  filter: brightness(1.06);
}

.subscription-trust-card__copyright-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.subscription-copyright-card {
  position: relative;
  display: grid;
  gap: 8px;
  min-height: 134px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(17, 76, 114, 0.08);
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease,
    background-color 0.24s ease;
}

.subscription-copyright-card:hover {
  transform: translateY(-3px);
  border-color: rgba(25, 118, 210, 0.2);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 28px rgba(15, 57, 87, 0.07);
}

.subscription-copyright-card:active {
  transform: scale(0.988);
}

.subscription-copyright-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.12),
    0 14px 28px rgba(15, 57, 87, 0.07);
}

.subscription-copyright-card--wide {
  grid-column: 1 / -1;
}

.subscription-copyright-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.subscription-copyright-card__title {
  color: #173a56;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.subscription-copyright-card__meta {
  color: #617a8e;
  font-size: 12px;
  line-height: 1.7;
}

.subscription-copyright-card__decor {
  position: absolute;
  right: 14px;
  bottom: 12px;
  color: rgba(25, 118, 210, 0.14);
}

.subscription-trust-list {
  display: grid;
}

.subscription-trust-list--divided {
  gap: 0;
}

.subscription-trust-list--divided .subscription-trust-list__row + .subscription-trust-list__row {
  border-top: 1px solid rgba(17, 76, 114, 0.08);
}

.subscription-trust-list--soft {
  gap: 6px;
}

.subscription-trust-list__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 2px;
  transition: transform 0.2s ease, color 0.2s ease;
}

.subscription-trust-card:hover .subscription-trust-list__row {
  transform: translateX(2px);
}

.subscription-trust-list__row--compact {
  align-items: center;
  padding: 10px 2px;
}

.subscription-trust-list__title {
  color: #18364d;
  font-size: 15px;
  font-weight: 700;
}

.subscription-trust-list__desc {
  margin-top: 4px;
  color: #5f798e;
  font-size: 13px;
  line-height: 1.65;
}

.subscription-trust-list__plain {
  color: #18364d;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .subscription-trust-card__metrics-panel {
    grid-template-columns: 1fr;
  }

  .subscription-trust-card__radar-wrap {
    min-height: 280px;
  }
}

@media (max-width: 1023px) {
  .subscription-trust-shell__columns {
    grid-template-columns: 1fr;
  }

  .subscription-trust-card:hover,
  .subscription-trust-card__headline-metric:hover,
  .subscription-copyright-card:hover {
    transform: none;
  }
}

@media (max-width: 767px) {
  .subscription-trust-card__copyright-list {
    grid-template-columns: 1fr;
  }

  .subscription-copyright-card--wide {
    grid-column: auto;
  }
}

@media (max-width: 599px) {
  .subscription-trust-card {
    border-radius: 20px;
  }

  .subscription-trust-card__section {
    padding: 16px;
  }

  .subscription-trust-card__headline-value {
    font-size: 26px;
  }

  .subscription-trust-card__radar-chart {
    height: 250px;
  }
}
</style>
