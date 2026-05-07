<!-- 已归档：当前不接入项目路由与导航，后续如需恢复可重新挂载 -->
<template>
  <q-page class="q-pa-md app-gradient-page order-page">
    <div class="row items-start justify-between q-col-gutter-md q-mb-md">
      <div class="col-12 col-lg">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-auto">
            <q-chip dense color="primary" text-color="white" icon="receipt_long"
              >医疗 AI 订阅运营台</q-chip
            >
          </div>
          <div class="col-auto">
            <q-chip dense outline color="teal-7" icon="calendar_month">2026 年 3 月账单窗口</q-chip>
          </div>
        </div>
        <div class="text-h4 text-weight-bold q-mt-sm">
          <q-icon name="domain_verification" class="q-mr-sm" color="primary" />
          订单管理中心
        </div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">
          医院订阅、账单回款、续约进展与套餐结构统一展示
        </div>
      </div>
      <div class="col-12 col-lg-auto">
        <div class="row q-col-gutter-sm justify-end">
          <div class="col-auto">
            <q-btn flat no-caps color="primary" icon="notifications">
              通知中心
              <q-badge floating color="negative" rounded>2</q-badge>
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn flat no-caps color="primary" icon="download">导出账单</q-btn>
          </div>
          <div class="col-auto">
            <q-btn unelevated no-caps color="primary" icon="insights">运营摘要</q-btn>
          </div>
        </div>
      </div>
    </div>

    <q-card flat bordered class="hero-card q-mb-md">
      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-lg-8">
            <div class="eyebrow">CervixDetectAI · 医院订阅与账单管理</div>
            <div class="hero-title q-mt-sm">
              让医院订阅、账单回款与续费决策
              <span class="hero-title__accent">尽在一屏掌握</span>
            </div>
            <div class="hero-desc q-mt-sm">
              围绕机构订阅周期、订单状态、回款表现与续约提醒建立统一管理视图，
              帮助医院管理者与运营团队更快掌握重点机构、回款进展与服务周期安排。
            </div>
            <div class="row q-col-gutter-sm q-mt-lg">
              <div v-for="item in heroCards" :key="item.label" class="col-12 col-sm-4">
                <div class="hero-mini-card">
                  <div class="hero-mini-card__label">{{ item.label }}</div>
                  <div class="hero-mini-card__value">{{ item.value }}</div>
                  <div class="hero-mini-card__desc">{{ item.desc }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-lg-4">
            <div class="focus-card">
              <div class="eyebrow">当前焦点医院</div>
              <div class="row items-center no-wrap q-col-gutter-sm q-mt-md">
                <div class="col-auto">
                  <HospitalAvatar :hospital-id="selectedHospitalId" size="58px" />
                </div>
                <div class="col">
                  <div class="text-subtitle1 text-weight-bold">{{ selectedOverview.name }}</div>
                  <div class="text-caption text-grey-7">
                    {{ selectedOverview.planName }} · {{ selectedOverview.billingCycle }}
                  </div>
                </div>
                <div class="col-auto">
                  <StatusChip :status="selectedOverview.status" />
                </div>
              </div>
              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-4">
                  <div class="focus-stat">
                    <span>当前应收</span><strong>{{ money(selectedDetail.currentAmount) }}</strong>
                  </div>
                </div>
                <div class="col-4">
                  <div class="focus-stat">
                    <span>未结金额</span
                    ><strong>{{ money(selectedDetail.outstandingAmount) }}</strong>
                  </div>
                </div>
                <div class="col-4">
                  <div class="focus-stat">
                    <span>合同到期</span><strong>{{ selectedOverview.expireDate }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="filter-card q-mb-md">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="timeRange"
              :options="timeOptions"
              dense
              outlined
              emit-value
              map-options
              label="时间范围"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="hospitalFilter"
              :options="hospitalOptions"
              dense
              outlined
              emit-value
              map-options
              label="医院筛选"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="planFilter"
              :options="planOptions"
              dense
              outlined
              emit-value
              map-options
              label="套餐筛选"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              dense
              outlined
              emit-value
              map-options
              label="支付状态"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div v-for="item in kpis" :key="item.label" class="col-12 col-sm-6 col-lg-2">
        <q-card flat bordered class="kpi-card">
          <q-card-section>
            <div class="row items-start justify-between no-wrap">
              <div class="col">
                <div class="kpi-label">{{ item.label }}</div>
                <div class="kpi-value q-mt-sm">{{ item.value }}</div>
                <div class="kpi-trend q-mt-sm" :class="item.className">
                  <q-icon :name="item.trendIcon" size="16px" />{{ item.trend }}
                </div>
              </div>
              <q-avatar size="46px" :color="item.color" text-color="white"
                ><q-icon :name="item.icon" size="22px"
              /></q-avatar>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="section-head">
        <div class="row items-center justify-between">
          <div>
            <div class="eyebrow">医院订阅分布</div>
            <div class="text-h6 text-weight-bold q-mt-xs">机构订阅概览矩阵</div>
          </div>
          <q-chip dense color="primary" text-color="white" icon="apartment"
            >{{ hospitals.length }} 家机构在线</q-chip
          >
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div
            v-for="hospital in hospitals"
            :key="hospital.hospitalId"
            class="col-12 col-md-6 col-xl-4"
          >
            <button
              class="hospital-card"
              :class="{ 'hospital-card--active': selectedHospitalId === hospital.hospitalId }"
              @click="selectHospital(hospital.hospitalId)"
            >
              <div class="row items-start justify-between no-wrap">
                <div class="row items-center no-wrap q-gutter-sm">
                  <HospitalAvatar :hospital-id="hospital.hospitalId" size="52px" />
                  <div>
                    <div class="text-subtitle2 text-weight-bold">{{ hospital.name }}</div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ hospital.planName }} · {{ hospital.billingCycle }}
                    </div>
                  </div>
                </div>
                <StatusChip :status="hospital.status" compact />
              </div>
              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-4">
                  <div class="hospital-meta">
                    <span>应收金额</span><strong>{{ money(hospital.amount) }}</strong>
                  </div>
                </div>
                <div class="col-4">
                  <div class="hospital-meta">
                    <span>到期时间</span><strong>{{ hospital.expireDate }}</strong>
                  </div>
                </div>
                <div class="col-4">
                  <div class="hospital-meta">
                    <span>自动续费</span><strong>{{ hospital.autoRenew }}</strong>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-xl-8">
        <q-card flat bordered class="q-mb-md order-table-card">
          <q-card-section class="section-head">
            <div class="row items-center justify-between">
              <div>
                <div class="eyebrow">订单主表</div>
                <div class="text-h5 text-weight-bold q-mt-xs">订单与账单状态</div>
              </div>
              <div class="text-body2 text-grey-7">
                共 {{ filteredOrders.length }} 条 · 当前选中 {{ selectedOverview.name }}
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-lg">
            <q-table
              flat
              :rows="filteredOrders"
              :columns="columns"
              row-key="id"
              hide-bottom
              :pagination="{ rowsPerPage: 0 }"
              class="orders-table orders-table--large"
            >
              <template #body="props">
                <q-tr
                  :props="props"
                  class="order-row order-row--large"
                  :class="{ 'order-row--active': selectedOrderId === props.row.id }"
                  @click="selectOrder(props.row.id)"
                >
                  <q-td key="orderNo" class="order-td--large">{{ props.row.orderNo }}</q-td>
                  <q-td key="hospitalName" class="order-td--large">
                    <div class="row items-center no-wrap q-gutter-sm">
                      <HospitalAvatar :hospital-id="props.row.hospitalId" size="42px" />
                      <span class="text-body1">{{ props.row.hospitalName }}</span>
                    </div>
                  </q-td>
                  <q-td key="planName" class="order-td--large">{{ props.row.planName }}</q-td>
                  <q-td key="billingCycle" class="order-td--large">{{
                    props.row.billingCycle
                  }}</q-td>
                  <q-td key="paymentMethod" class="order-td--large">{{
                    props.row.paymentMethod
                  }}</q-td>
                  <q-td key="amount" class="text-weight-bold order-td--large order-td--amount">{{
                    money(props.row.amount)
                  }}</q-td>
                  <q-td key="status" class="order-td--large"
                    ><StatusChip :status="props.row.status"
                  /></q-td>
                  <q-td key="billStatus" class="order-td--large">{{ props.row.billStatus }}</q-td>
                  <q-td key="orderTime" class="order-td--large">{{ props.row.orderTime }}</q-td>
                  <q-td key="paymentTime" class="order-td--large">{{ props.row.paymentTime }}</q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <div class="order-table-standalone q-mb-xl">
          <q-card flat bordered class="order-table-card-only">
            <q-card-section class="q-pa-xl">
              <div class="text-h2 text-weight-bold q-mb-lg" style="color: var(--app-text-primary)">
                <q-icon name="receipt_long" class="q-mr-sm" color="primary" size="48px" />
                订单主表
              </div>
              <div class="text-body1 text-grey-7 q-mb-xl">
                订单与账单状态 · 共 {{ filteredOrders.length }} 条
              </div>
              <q-table
                flat
                :rows="filteredOrders"
                :columns="columns"
                row-key="id"
                hide-bottom
                :pagination="{ rowsPerPage: 0 }"
                class="orders-table orders-table--standalone"
              >
                <template #body="props">
                  <q-tr :props="props" class="order-row order-row--standalone">
                    <q-td key="orderNo" class="order-td--standalone text-weight-medium">{{
                      props.row.orderNo
                    }}</q-td>
                    <q-td key="hospitalName" class="order-td--standalone">
                      <div class="row items-center no-wrap q-gutter-md">
                        <HospitalAvatar :hospital-id="props.row.hospitalId" size="64px" />
                        <span class="text-h5 text-weight-medium">{{ props.row.hospitalName }}</span>
                      </div>
                    </q-td>
                    <q-td key="planName" class="order-td--standalone text-h5">{{
                      props.row.planName
                    }}</q-td>
                    <q-td key="billingCycle" class="order-td--standalone text-h5">{{
                      props.row.billingCycle
                    }}</q-td>
                    <q-td key="paymentMethod" class="order-td--standalone text-h5">{{
                      props.row.paymentMethod
                    }}</q-td>
                    <q-td
                      key="amount"
                      class="order-td--standalone order-td--amount-standalone text-weight-bold"
                      >{{ money(props.row.amount) }}</q-td
                    >
                    <q-td key="status" class="order-td--standalone"
                      ><StatusChip :status="props.row.status"
                    /></q-td>
                    <q-td key="billStatus" class="order-td--standalone text-h5">{{
                      props.row.billStatus
                    }}</q-td>
                    <q-td key="orderTime" class="order-td--standalone text-h5">{{
                      props.row.orderTime
                    }}</q-td>
                    <q-td key="paymentTime" class="order-td--standalone text-h5">{{
                      props.row.paymentTime
                    }}</q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>

        <q-card flat bordered>
          <q-card-section class="section-head">
            <div class="row items-center justify-between">
              <div>
                <div class="eyebrow">回款走势</div>
                <div class="text-h6 text-weight-bold q-mt-xs">近 6 个月账单回款趋势</div>
              </div>
              <div class="text-caption text-grey-7">
                峰值出现在 1 月，当前重点转向续费与异常跟进
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section><div ref="trendRef" class="chart-box"></div></q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section class="section-head">
            <div class="row items-center justify-between">
              <div>
                <div class="eyebrow">账单联动摘要</div>
                <div class="text-h6 text-weight-bold q-mt-xs">本月续约与回款动态</div>
              </div>
              <div class="text-caption text-grey-7">用于辅助评估当期续费推进节奏</div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <div class="summary-card">
                  <div class="summary-card__label">本月已完成续约</div>
                  <div class="summary-card__value">4 家</div>
                  <div class="summary-card__desc">年度与连续包月客户续约进展稳定</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="summary-card">
                  <div class="summary-card__label">年度套餐贡献</div>
                  <div class="summary-card__value">62%</div>
                  <div class="summary-card__desc">核心收入主要来自高阶长期订阅</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="summary-card">
                  <div class="summary-card__label">待跟进机构</div>
                  <div class="summary-card__value">1 家</div>
                  <div class="summary-card__desc">当前仅保留 1 家待确认付款机构</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-4">
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="section-head">
            <div class="eyebrow">账单详情</div>
            <div class="text-h6 text-weight-bold q-mt-xs">机构订阅明细面板</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap q-gutter-sm">
              <HospitalAvatar :hospital-id="selectedHospitalId" size="64px" />
              <div>
                <div class="text-subtitle1 text-weight-bold">{{ selectedOverview.name }}</div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ selectedDetail.planName }} · {{ selectedDetail.contractPeriod }}
                </div>
              </div>
            </div>
            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-6">
                <div class="detail-stat">
                  <span>当前应收</span><strong>{{ money(selectedDetail.currentAmount) }}</strong>
                </div>
              </div>
              <div class="col-6">
                <div class="detail-stat">
                  <span>未结金额</span
                  ><strong>{{ money(selectedDetail.outstandingAmount) }}</strong>
                </div>
              </div>
              <div class="col-6">
                <div class="detail-stat">
                  <span>套餐周期</span><strong>{{ selectedOverview.billingCycle }}</strong>
                </div>
              </div>
              <div class="col-6">
                <div class="detail-stat">
                  <span>自动续费</span><strong>{{ selectedOverview.autoRenew }}</strong>
                </div>
              </div>
            </div>

            <div class="q-mt-lg">
              <div class="text-weight-bold">套餐权益摘要</div>
              <div class="tag-list q-mt-sm">
                <q-chip
                  v-for="item in selectedDetail.benefits"
                  :key="item"
                  dense
                  square
                  color="blue-1"
                  text-color="primary"
                  >{{ item }}</q-chip
                >
              </div>
            </div>

            <div class="q-mt-lg">
              <div class="text-weight-bold">最近 3 次账单记录</div>
              <div class="q-mt-sm column q-gutter-sm">
                <div
                  v-for="bill in selectedDetail.recentBills"
                  :key="`${bill.date}-${bill.amount}`"
                  class="bill-item"
                >
                  <div>
                    <div class="text-body2 text-weight-medium">{{ bill.planName }}</div>
                    <div class="text-caption text-grey-7">{{ bill.date }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-body2 text-weight-bold">{{ money(bill.amount) }}</div>
                    <StatusChip :status="bill.status" compact />
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-lg">
              <div class="text-weight-bold">续费建议</div>
              <q-list separator class="rounded-borders q-mt-sm suggestion-list">
                <q-item v-for="item in selectedDetail.advices" :key="item" dense>
                  <q-item-section avatar top
                    ><q-avatar size="26px" color="amber-1" text-color="warning"
                      ><q-icon name="tips_and_updates" size="16px" /></q-avatar
                  ></q-item-section>
                  <q-item-section>{{ item }}</q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md">
          <q-card-section class="section-head">
            <div class="eyebrow">套餐结构</div>
            <div class="text-h6 text-weight-bold q-mt-xs">订阅层级占比</div>
          </q-card-section>
          <q-separator />
          <q-card-section
            ><div ref="pieRef" class="chart-box chart-box--small"></div
          ></q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section class="section-head">
            <div class="eyebrow">运营提醒</div>
            <div class="text-h6 text-weight-bold q-mt-xs">续约节奏与服务周期提示</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md">
            <div class="risk risk--warning">
              <div class="risk__title">近期到期机构</div>
              <div class="risk__content">华中科技大学同济医学院、江陵县三湖管理区卫生院</div>
            </div>
            <div class="risk risk--info">
              <div class="risk__title">续约沟通中</div>
              <div class="risk__content">
                江陵县三湖管理区卫生院 · 当前待确认金额 {{ money(299) }}
              </div>
            </div>
            <div class="risk risk--soft">
              <div class="risk__title">重点关注机构</div>
              <div class="risk__content">华中科技大学同济医学院建议提前确认下一周期续约安排</div>
            </div>
            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-6">
                <div class="detail-stat"><span>自动续费开启率</span><strong>43%</strong></div>
              </div>
              <div class="col-6">
                <div class="detail-stat"><span>待确认事项</span><strong>1 项</strong></div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import { QAvatar, QChip, QIcon, useQuasar } from 'quasar';
import * as echarts from 'echarts';
import { HOSPITALS } from 'src/constants/hospitals';

type Status = '续约中' | '已支付' | '历史归档';
interface HospitalItem {
  hospitalId: string;
  name: string;
  planName: string;
  billingCycle: string;
  amount: number;
  expireDate: string;
  status: Status;
  autoRenew: string;
}
interface OrderRow {
  id: string;
  orderNo: string;
  hospitalId: string;
  hospitalName: string;
  planName: string;
  billingCycle: string;
  paymentMethod: string;
  amount: number;
  status: Status;
  billStatus: string;
  orderTime: string;
  paymentTime: string;
}
interface DetailItem {
  planName: string;
  contractPeriod: string;
  currentAmount: number;
  outstandingAmount: number;
  benefits: string[];
  recentBills: { date: string; planName: string; amount: number; status: Status }[];
  advices: string[];
}

const $q = useQuasar();
const trendRef = ref<HTMLElement | null>(null);
const pieRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const timeRange = ref('month');
const hospitalFilter = ref('all');
const planFilter = ref('all');
const statusFilter = ref('all');
const selectedHospitalId = ref('HUST_TONGJI');
const selectedOrderId = ref('CD202603270004');

const heroCards = [
  {
    label: '订阅全景',
    value: '机构订阅一屏总览',
    desc: '覆盖套餐结构、账单周期、应收金额与续费状态',
  },
  { label: '回款追踪', value: '订单链路清晰可查', desc: '从下单、支付到开票状态保持统一追踪' },
  {
    label: '运营提醒',
    value: '关键节点提前识别',
    desc: '围绕续约窗口、服务周期与机构跟进统一提醒',
  },
];

const kpis = [
  {
    label: '总订单数',
    value: '128',
    trend: '较上月 +9 笔',
    trendIcon: 'north_east',
    className: 'text-positive',
    icon: 'receipt_long',
    color: 'primary',
  },
  {
    label: '已支付金额',
    value: '¥78,241',
    trend: '回款率保持稳定',
    trendIcon: 'task_alt',
    className: 'text-primary',
    icon: 'payments',
    color: 'teal-7',
  },
  {
    label: '待确认金额',
    value: '¥299',
    trend: '当前仅 1 项续约确认',
    trendIcon: 'schedule',
    className: 'text-primary',
    icon: 'schedule_send',
    color: 'blue-7',
  },
  {
    label: '本月续费率',
    value: '86%',
    trend: '临近目标区间',
    trendIcon: 'trending_up',
    className: 'text-positive',
    icon: 'autorenew',
    color: 'blue-8',
  },
  {
    label: '活跃订阅医院数',
    value: '7',
    trend: '院内覆盖持续扩大',
    trendIcon: 'apartment',
    className: 'text-primary',
    icon: 'apartment',
    color: 'cyan-8',
  },
  {
    label: '待续约机构数',
    value: '2',
    trend: '服务周期进入提醒窗口',
    trendIcon: 'event_upcoming',
    className: 'text-primary',
    icon: 'notification_important',
    color: 'teal-7',
  },
];

const hospitals: HospitalItem[] = [
  {
    hospitalId: 'JZ_CENTRAL',
    name: '荆州市中心医院',
    planName: '顶级套餐一年版',
    billingCycle: '年度',
    amount: 12699,
    expireDate: '2027-01-18',
    status: '已支付',
    autoRenew: '已开启',
  },
  {
    hospitalId: 'JZ_JINDUN',
    name: '荆州区金盾门诊',
    planName: '基础套餐连续包月',
    billingCycle: '月度',
    amount: 888,
    expireDate: '2026-04-06',
    status: '已支付',
    autoRenew: '已开启',
  },
  {
    hospitalId: 'WH_PEOPLE',
    name: '武汉大学人民医院',
    planName: '顶级套餐半年版',
    billingCycle: '半年',
    amount: 6699,
    expireDate: '2026-07-30',
    status: '已支付',
    autoRenew: '未开启',
  },
  {
    hospitalId: 'HUST_TONGJI',
    name: '华中科技大学同济医学院',
    planName: '顶级套餐一年版',
    billingCycle: '年度',
    amount: 12699,
    expireDate: '2026-03-30',
    status: '已支付',
    autoRenew: '未开启',
  },
  {
    hospitalId: 'JL_SANHU',
    name: '江陵县三湖管理区卫生院',
    planName: '基础套餐一月版',
    billingCycle: '月度',
    amount: 299,
    expireDate: '2026-03-29',
    status: '续约中',
    autoRenew: '未开启',
  },
  {
    hospitalId: 'JZ_BAOHETANG',
    name: '荆州保和堂中医诊所',
    planName: '基础套餐单次正式',
    billingCycle: '按次',
    amount: 29.9,
    expireDate: '2026-03-27',
    status: '已支付',
    autoRenew: '不适用',
  },
  {
    hospitalId: 'JZ_FUYOU',
    name: '荆州市妇幼保健院',
    planName: '顶级套餐连续包月',
    billingCycle: '月度',
    amount: 999,
    expireDate: '2026-04-09',
    status: '已支付',
    autoRenew: '已开启',
  },
];

const orders: OrderRow[] = [
  {
    id: 'CD202603270001',
    orderNo: 'CD202603270001',
    hospitalId: 'JZ_CENTRAL',
    hospitalName: '荆州市中心医院',
    planName: '顶级套餐一年版',
    billingCycle: '年度',
    paymentMethod: '银行转账',
    amount: 12699,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2026-01-18 09:12',
    paymentTime: '2026-01-18 11:03',
  },
  {
    id: 'CD202603270002',
    orderNo: 'CD202603270002',
    hospitalId: 'JZ_JINDUN',
    hospitalName: '荆州区金盾门诊',
    planName: '基础套餐连续包月',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 888,
    status: '已支付',
    billStatus: '本期账单已结清',
    orderTime: '2026-03-06 08:22',
    paymentTime: '2026-03-06 08:27',
  },
  {
    id: 'CD202603270003',
    orderNo: 'CD202603270003',
    hospitalId: 'WH_PEOPLE',
    hospitalName: '武汉大学人民医院',
    planName: '顶级套餐半年版',
    billingCycle: '半年',
    paymentMethod: '支付宝',
    amount: 6699,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2026-01-30 14:08',
    paymentTime: '2026-01-30 14:19',
  },
  {
    id: 'CD202603270004',
    orderNo: 'CD202603270004',
    hospitalId: 'HUST_TONGJI',
    hospitalName: '华中科技大学同济医学院',
    planName: '顶级套餐一年版',
    billingCycle: '年度',
    paymentMethod: '银行转账',
    amount: 12699,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2026-03-24 10:45',
    paymentTime: '2026-03-24 14:08',
  },
  {
    id: 'CD202603270005',
    orderNo: 'CD202603270005',
    hospitalId: 'JL_SANHU',
    hospitalName: '江陵县三湖管理区卫生院',
    planName: '基础套餐一月版',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 299,
    status: '续约中',
    billStatus: '续约确认中',
    orderTime: '2026-03-26 16:18',
    paymentTime: '—',
  },
  {
    id: 'CD202603270006',
    orderNo: 'CD202603270006',
    hospitalId: 'JZ_BAOHETANG',
    hospitalName: '荆州保和堂中医诊所',
    planName: '基础套餐单次正式',
    billingCycle: '按次',
    paymentMethod: '支付宝',
    amount: 29.9,
    status: '已支付',
    billStatus: '无需开票',
    orderTime: '2026-03-27 09:05',
    paymentTime: '2026-03-27 09:06',
  },
  {
    id: 'CD202603270007',
    orderNo: 'CD202603270007',
    hospitalId: 'JZ_FUYOU',
    hospitalName: '荆州市妇幼保健院',
    planName: '顶级套餐连续包月',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 999,
    status: '已支付',
    billStatus: '本期账单已结清',
    orderTime: '2026-03-09 12:12',
    paymentTime: '2026-03-09 12:14',
  },
  {
    id: 'CD202603270008',
    orderNo: 'CD202603270008',
    hospitalId: 'JZ_CENTRAL',
    hospitalName: '荆州市中心医院',
    planName: '顶级套餐连续包月',
    billingCycle: '月度',
    paymentMethod: '银行转账',
    amount: 999,
    status: '历史归档',
    billStatus: '已归档',
    orderTime: '2025-12-18 09:40',
    paymentTime: '—',
  },
  {
    id: 'CD202603270009',
    orderNo: 'CD202603270009',
    hospitalId: 'WH_PEOPLE',
    hospitalName: '武汉大学人民医院',
    planName: '顶级套餐一月版',
    billingCycle: '月度',
    paymentMethod: '支付宝',
    amount: 1280,
    status: '已支付',
    billStatus: '本期账单已结清',
    orderTime: '2026-02-28 13:36',
    paymentTime: '2026-02-28 13:41',
  },
  {
    id: 'CD202603270010',
    orderNo: 'CD202603270010',
    hospitalId: 'JZ_JINDUN',
    hospitalName: '荆州区金盾门诊',
    planName: '基础套餐一月版',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 980,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2026-02-05 10:10',
    paymentTime: '2026-02-05 10:13',
  },
  {
    id: 'CD202603270011',
    orderNo: 'CD202603270011',
    hospitalId: 'JZ_CENTRAL',
    hospitalName: '荆州市中心医院',
    planName: '顶级套餐连续包月',
    billingCycle: '月度',
    paymentMethod: '银行转账',
    amount: 999,
    status: '已支付',
    billStatus: '本期账单已结清',
    orderTime: '2026-02-18 10:20',
    paymentTime: '2026-02-18 10:25',
  },
  {
    id: 'CD202603270012',
    orderNo: 'CD202603270012',
    hospitalId: 'HUST_TONGJI',
    hospitalName: '华中科技大学同济医学院',
    planName: '顶级套餐半年版',
    billingCycle: '半年',
    paymentMethod: '银行转账',
    amount: 6699,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2025-09-30 15:30',
    paymentTime: '2025-10-01 09:15',
  },
  {
    id: 'CD202603270013',
    orderNo: 'CD202603270013',
    hospitalId: 'JZ_FUYOU',
    hospitalName: '荆州市妇幼保健院',
    planName: '顶级套餐连续包月',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 999,
    status: '已支付',
    billStatus: '本期账单已结清',
    orderTime: '2026-02-09 11:05',
    paymentTime: '2026-02-09 11:08',
  },
  {
    id: 'CD202603270014',
    orderNo: 'CD202603270014',
    hospitalId: 'JZ_JINDUN',
    hospitalName: '荆州区金盾门诊',
    planName: '基础套餐一月版',
    billingCycle: '月度',
    paymentMethod: '微信支付',
    amount: 980,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2026-01-05 09:30',
    paymentTime: '2026-01-05 09:35',
  },
  {
    id: 'CD202603270015',
    orderNo: 'CD202603270015',
    hospitalId: 'WH_PEOPLE',
    hospitalName: '武汉大学人民医院',
    planName: '顶级套餐半年版',
    billingCycle: '半年',
    paymentMethod: '支付宝',
    amount: 6699,
    status: '已支付',
    billStatus: '已开票',
    orderTime: '2025-07-30 16:45',
    paymentTime: '2025-07-30 17:02',
  },
];

const details: Record<string, DetailItem> = {
  JZ_CENTRAL: {
    planName: '顶级套餐一年版',
    contractPeriod: '2026-01-18 至 2027-01-18',
    currentAmount: 12699,
    outstandingAmount: 0,
    benefits: ['多格式完整报告', '随访管理闭环', '院内报告输出', '高阶 AI 医疗助手'],
    recentBills: [
      { date: '2026-01-18', planName: '顶级套餐一年版', amount: 12699, status: '已支付' },
      { date: '2025-12-18', planName: '顶级套餐连续包月', amount: 999, status: '历史归档' },
      { date: '2025-11-18', planName: '顶级套餐连续包月', amount: 999, status: '已支付' },
    ],
    advices: ['年度合同已稳定执行，可继续保持高阶服务包配置', '适合在汇报中展示大型机构订阅价值'],
  },
  JZ_JINDUN: {
    planName: '基础套餐连续包月',
    contractPeriod: '2026-03-06 至 2026-04-06',
    currentAmount: 888,
    outstandingAmount: 0,
    benefits: ['基础三种检测方式', 'AI 医疗助手', '完整 PDF 报告'],
    recentBills: [
      { date: '2026-03-06', planName: '基础套餐连续包月', amount: 888, status: '已支付' },
      { date: '2026-02-05', planName: '基础套餐一月版', amount: 980, status: '已支付' },
      { date: '2026-01-05', planName: '基础套餐一月版', amount: 980, status: '已支付' },
    ],
    advices: [
      '当前可引导升级到半年版以降低月度重复操作',
      '自动续费已开启，适合展示低频人工干预场景',
    ],
  },
  WH_PEOPLE: {
    planName: '顶级套餐半年版',
    contractPeriod: '2026-01-30 至 2026-07-30',
    currentAmount: 6699,
    outstandingAmount: 0,
    benefits: ['高阶 AI 医疗助手', '多格式报告', '随访管理闭环', '院内自定义输出'],
    recentBills: [
      { date: '2026-01-30', planName: '顶级套餐半年版', amount: 6699, status: '已支付' },
      { date: '2026-02-28', planName: '顶级套餐一月版', amount: 1280, status: '已支付' },
      { date: '2025-07-30', planName: '顶级套餐半年版', amount: 6699, status: '已支付' },
    ],
    advices: [
      '当前使用节奏稳定，可结合临床科室规模评估年度版',
      '自动续费关闭，适合作为人工续约管理示例',
    ],
  },
  HUST_TONGJI: {
    planName: '顶级套餐一年版',
    contractPeriod: '2025-03-31 至 2026-03-30',
    currentAmount: 12699,
    outstandingAmount: 0,
    benefits: ['多格式完整报告', '随访管理闭环', '高阶 AI 医疗助手', '自定义水印与院内报告输出'],
    recentBills: [
      { date: '2026-03-24', planName: '顶级套餐一年版', amount: 12699, status: '已支付' },
      { date: '2025-03-31', planName: '顶级套餐一年版', amount: 12699, status: '已支付' },
      { date: '2024-03-28', planName: '顶级套餐半年版', amount: 6699, status: '已支付' },
    ],
    advices: [
      '建议在到期前完成下一周期续约确认',
      '建议切换自动续费以降低人工跟进频次',
      '当前合同将在 6 天内到期',
    ],
  },
  JL_SANHU: {
    planName: '基础套餐一月版',
    contractPeriod: '2026-02-28 至 2026-03-29',
    currentAmount: 299,
    outstandingAmount: 299,
    benefits: ['基础三种检测方式', 'AI 医疗助手', '标准 PDF 报告'],
    recentBills: [
      { date: '2026-03-26', planName: '基础套餐一月版', amount: 299, status: '续约中' },
      { date: '2026-01-29', planName: '基础套餐一月版', amount: 980, status: '已支付' },
      { date: '2025-12-29', planName: '基础套餐连续包月', amount: 888, status: '已支付' },
    ],
    advices: ['建议尽快完成本期续约确认', '可在到期前统一发起续约提醒，减少人工反复跟进'],
  },
  JZ_BAOHETANG: {
    planName: '基础套餐单次正式',
    contractPeriod: '2026-03-27 当日按次',
    currentAmount: 29.9,
    outstandingAmount: 0,
    benefits: ['单次正式权益', '基础三种检测方式', '完整 PDF 报告'],
    recentBills: [
      { date: '2026-03-27', planName: '基础套餐单次正式', amount: 29.9, status: '已支付' },
      { date: '2026-03-11', planName: '基础套餐单次正式', amount: 29.9, status: '已支付' },
      { date: '2026-02-26', planName: '基础套餐单次正式', amount: 29.9, status: '已支付' },
    ],
    advices: ['按次使用特征明显，适合展示轻量客户转订阅空间', '可引导升级到连续包月以提升留存'],
  },
  JZ_FUYOU: {
    planName: '顶级套餐连续包月',
    contractPeriod: '2026-03-09 至 2026-04-09',
    currentAmount: 999,
    outstandingAmount: 0,
    benefits: ['多格式完整报告', '高阶 AI 医疗助手', '随访管理闭环', '自定义水印'],
    recentBills: [
      { date: '2026-03-09', planName: '顶级套餐连续包月', amount: 999, status: '已支付' },
      { date: '2026-02-09', planName: '顶级套餐连续包月', amount: 999, status: '已支付' },
      { date: '2026-01-09', planName: '顶级套餐一月版', amount: 1280, status: '已支付' },
    ],
    advices: ['连续包月稳定，可作为妇幼场景高频续费样本', '适合展示自动续费开启后的稳定回款表现'],
  },
};

const statusMap: Record<Status, { color: string; soft: string; text: string }> = {
  已支付: { color: 'positive', soft: 'positive', text: 'white' },
  续约中: { color: 'primary', soft: 'blue-1', text: 'primary' },
  历史归档: { color: 'grey-7', soft: 'grey-2', text: 'grey-8' },
};

const HospitalAvatar = defineComponent({
  props: {
    hospitalId: { type: String, required: true },
    size: { type: String, default: '52px' },
    small: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const hospital = HOSPITALS.find((item) => item.id === props.hospitalId);
      return h(
        QAvatar,
        {
          size: props.size,
          class: ['hospital-avatar', props.small ? 'hospital-avatar--small' : ''],
        },
        () =>
          hospital?.iconUrl
            ? h('img', { src: hospital.iconUrl, alt: hospital.name })
            : h(QIcon, {
                name: hospital?.icon || 'local_hospital',
                size: props.small ? '18px' : '26px',
                color: 'primary',
              }),
      );
    };
  },
});

const StatusChip = defineComponent({
  props: {
    status: { type: String as () => Status, required: true },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h(
        QChip,
        {
          dense: true,
          square: true,
          color: props.compact ? statusMap[props.status].soft : statusMap[props.status].color,
          textColor: props.compact ? statusMap[props.status].text : 'white',
          class: props.compact ? 'status-chip--compact' : '',
        },
        () => props.status,
      );
  },
});

const timeOptions = [
  { label: '本月账单窗口', value: 'month' },
  { label: '近 30 天', value: 'last30' },
  { label: '本季度', value: 'quarter' },
];
const hospitalOptions = [
  { label: '全部医院', value: 'all' },
  ...HOSPITALS.map((item) => ({ label: item.name, value: item.id })),
];
const planOptions = [
  { label: '全部套餐', value: 'all' },
  { label: '基础套餐', value: 'basic' },
  { label: '顶级套餐', value: 'premium' },
  { label: '按次服务', value: 'usage' },
];
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已支付', value: '已支付' },
  { label: '续约中', value: '续约中' },
  { label: '历史归档', value: '历史归档' },
];

const columns: QTableColumn<OrderRow>[] = [
  { name: 'orderNo', label: '订单号', field: 'orderNo', align: 'left' },
  { name: 'hospitalName', label: '医院名称', field: 'hospitalName', align: 'left' },
  { name: 'planName', label: '套餐名称', field: 'planName', align: 'left' },
  { name: 'billingCycle', label: '账单周期', field: 'billingCycle', align: 'left' },
  { name: 'paymentMethod', label: '支付方式', field: 'paymentMethod', align: 'left' },
  { name: 'amount', label: '金额', field: 'amount', align: 'left' },
  { name: 'status', label: '支付状态', field: 'status', align: 'left' },
  { name: 'billStatus', label: '开票/账单状态', field: 'billStatus', align: 'left' },
  { name: 'orderTime', label: '下单时间', field: 'orderTime', align: 'left' },
  { name: 'paymentTime', label: '支付时间', field: 'paymentTime', align: 'left' },
];

const selectedOverview = computed<HospitalItem>(
  () => hospitals.find((item) => item.hospitalId === selectedHospitalId.value) ?? hospitals[0]!,
);
const selectedDetail = computed<DetailItem>(
  () => details[selectedHospitalId.value] ?? details.HUST_TONGJI!,
);
const filteredOrders = computed(() =>
  orders.filter((row) => {
    const byHospital = hospitalFilter.value === 'all' || row.hospitalId === hospitalFilter.value;
    const byStatus = statusFilter.value === 'all' || row.status === statusFilter.value;
    const byPlan =
      planFilter.value === 'all' ||
      (planFilter.value === 'basic' && row.planName.includes('基础套餐')) ||
      (planFilter.value === 'premium' && row.planName.includes('顶级套餐')) ||
      (planFilter.value === 'usage' && row.billingCycle === '按次');
    return byHospital && byStatus && byPlan;
  }),
);

const money = (value: number) =>
  `¥${new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)}`;

const selectHospital = (hospitalId: string) => {
  selectedHospitalId.value = hospitalId;
  const order = filteredOrders.value.find((item) => item.hospitalId === hospitalId);
  if (order) selectedOrderId.value = order.id;
};

const selectOrder = (orderId: string) => {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;
  selectedOrderId.value = orderId;
  selectedHospitalId.value = order.hospitalId;
};

const renderCharts = () => {
  const textColor = $q.dark.isActive ? '#94a3b8' : '#64748b';
  const splitColor = $q.dark.isActive ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.2)';
  const lineColor = $q.dark.isActive ? '#bfdbfe' : '#2563eb';

  if (trendRef.value) {
    if (!trendChart) trendChart = echarts.init(trendRef.value);
    trendChart.setOption({
      animationDuration: 700,
      grid: { left: 24, right: 24, top: 24, bottom: 20, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: $q.dark.isActive ? 'rgba(15,23,42,.92)' : 'rgba(255,255,255,.96)',
        borderWidth: 0,
        textStyle: { color: $q.dark.isActive ? '#e2e8f0' : '#1e293b' },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['10 月', '11 月', '12 月', '1 月', '2 月', '3 月'],
        axisLine: { lineStyle: { color: splitColor } },
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textColor, formatter: (v: number) => `${Math.round(v / 1000)}k` },
        splitLine: { lineStyle: { color: splitColor } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbolSize: 8,
          data: [8900, 12780, 16240, 21598, 18430, 14567],
          lineStyle: { color: lineColor, width: 3 },
          itemStyle: { color: lineColor },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: $q.dark.isActive ? 'rgba(59,130,246,.42)' : 'rgba(37,99,235,.22)',
              },
              {
                offset: 1,
                color: $q.dark.isActive ? 'rgba(20,184,166,.08)' : 'rgba(20,184,166,.04)',
              },
            ]),
          },
        },
      ],
    });
  }

  if (pieRef.value) {
    if (!pieChart) pieChart = echarts.init(pieRef.value);
    pieChart.setOption({
      animationDuration: 700,
      tooltip: {
        trigger: 'item',
        backgroundColor: $q.dark.isActive ? 'rgba(15,23,42,.92)' : 'rgba(255,255,255,.96)',
        borderWidth: 0,
        textStyle: { color: $q.dark.isActive ? '#e2e8f0' : '#1e293b' },
      },
      legend: { bottom: 0, icon: 'circle', textStyle: { color: textColor } },
      series: [
        {
          type: 'pie',
          radius: ['56%', '78%'],
          center: ['50%', '42%'],
          label: { formatter: '{b}\n{d}%', color: textColor },
          itemStyle: { borderColor: $q.dark.isActive ? '#121212' : '#fff', borderWidth: 6 },
          data: [
            { value: 57, name: '顶级套餐', itemStyle: { color: '#2563eb' } },
            { value: 36, name: '基础套餐', itemStyle: { color: '#14b8a6' } },
            { value: 7, name: '按次服务', itemStyle: { color: '#f59e0b' } },
          ],
        },
      ],
    });
  }
};

const handleResize = () => {
  trendChart?.resize();
  pieChart?.resize();
};

watch(
  () => $q.dark.isActive,
  () =>
    nextTick(() => {
      renderCharts();
      handleResize();
    }),
);

onMounted(() => {
  renderCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  pieChart?.dispose();
});
</script>

<style scoped lang="scss">
.order-page {
  min-height: 100%;
}
.eyebrow {
  color: var(--app-section-eyebrow);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.hero-card {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 36%),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88));
}
.hero-title {
  font-size: 2rem;
  line-height: 1.18;
  font-weight: 800;
  color: var(--app-text-primary);
}
.hero-title__accent {
  color: #0f6caa;
}
.hero-desc {
  color: var(--app-text-secondary);
  line-height: 1.8;
  max-width: 760px;
}
.hero-mini-card,
.focus-card,
.filter-card,
.kpi-card,
.hospital-card,
.detail-stat,
.focus-stat,
.hospital-meta,
.bill-item,
.suggestion-list,
.risk {
  border-radius: 18px;
}
.hero-mini-card,
.focus-card,
.filter-card,
.hospital-card,
.detail-stat,
.focus-stat,
.hospital-meta,
.bill-item,
.suggestion-list {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.hero-mini-card {
  padding: 18px;
  height: 100%;
}
.hero-mini-card__label,
.kpi-label {
  color: var(--app-text-secondary);
  font-size: 0.8rem;
}
.hero-mini-card__value,
.kpi-value {
  margin-top: 10px;
  color: var(--app-text-primary);
  font-weight: 800;
}
.hero-mini-card__desc {
  margin-top: 6px;
  color: var(--app-text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}
.focus-card {
  padding: 20px;
  box-shadow: 0 18px 44px -28px rgba(15, 23, 42, 0.34);
}
.focus-stat,
.hospital-meta,
.detail-stat {
  padding: 14px;
}
.focus-stat span,
.hospital-meta span,
.detail-stat span {
  display: block;
  font-size: 0.78rem;
  color: var(--app-text-secondary);
}
.focus-stat strong,
.hospital-meta strong,
.detail-stat strong {
  display: block;
  margin-top: 6px;
  color: var(--app-text-primary);
}
.kpi-card {
  background: linear-gradient(180deg, rgba(237, 247, 255, 0.96), rgba(255, 255, 255, 0.94));
  height: 100%;
}
.kpi-value {
  font-size: 1.6rem;
  letter-spacing: -0.02em;
}
.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}
.section-head {
  background: rgba(255, 255, 255, 0.45);
}
.hospital-card {
  width: 100%;
  text-align: left;
  padding: 18px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  cursor: pointer;
}
.hospital-card:hover,
.hospital-card--active {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 24px 48px -34px rgba(37, 99, 235, 0.36);
}
.hospital-avatar {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.92));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 16px 34px -24px rgba(37, 99, 235, 0.32);
}
.hospital-avatar--small {
  box-shadow: none;
}
.orders-table :deep(.q-table__top),
.orders-table :deep(.q-table__bottom) {
  display: none;
}
.orders-table :deep(th) {
  color: var(--app-table-header-color);
  font-weight: 700;
  font-size: 0.8rem;
  background: rgba(248, 250, 252, 0.96);
}
.order-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.order-row:hover {
  background: rgba(37, 99, 235, 0.04);
}
.order-row--active {
  background: rgba(37, 99, 235, 0.08);
}

/* 订单表格放大样式 */
.order-table-card {
  overflow: visible;
}

.orders-table--large :deep(th) {
  font-size: 0.95rem;
  padding: 18px 16px !important;
  background: rgba(248, 250, 252, 0.98);
}

.order-row--large {
  font-size: 1rem;
}

.order-row--large td {
  padding: 18px 16px !important;
  font-size: 1rem;
}

.order-td--large {
  font-size: 1rem !important;
}

.order-td--amount {
  font-size: 1.1rem !important;
  color: var(--app-text-primary);
}

/* 独立订单表格样式 - 用于截图 */
.order-table-standalone {
  width: 100%;
}

.order-table-card-only {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.orders-table--standalone :deep(th) {
  font-size: 1.4rem !important;
  padding: 28px 24px !important;
  background: rgba(248, 250, 252, 0.98) !important;
  font-weight: 700 !important;
  color: #1e293b !important;
}

.order-row--standalone {
  font-size: 1.4rem;
  transition: background-color 0.2s ease;
}

.order-row--standalone:hover {
  background: rgba(37, 99, 235, 0.06);
}

.order-row--standalone td {
  padding: 28px 24px !important;
  font-size: 1.4rem;
}

.order-td--standalone {
  font-size: 1.4rem !important;
  padding: 28px 24px !important;
}

.order-td--amount-standalone {
  font-size: 1.55rem !important;
  color: #0f172a !important;
  font-weight: 700 !important;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bill-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
}
.summary-card {
  height: 100%;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.summary-card__label {
  color: var(--app-text-secondary);
  font-size: 0.8rem;
}
.summary-card__value {
  margin-top: 10px;
  color: var(--app-text-primary);
  font-size: 1.5rem;
  font-weight: 800;
}
.summary-card__desc {
  margin-top: 8px;
  color: var(--app-text-secondary);
  font-size: 0.84rem;
  line-height: 1.7;
}
.chart-box {
  width: 100%;
  height: 320px;
}
.chart-box--small {
  height: 260px;
}
.risk {
  padding: 16px;
}
.risk + .risk {
  margin-top: 12px;
}
.risk__title {
  font-weight: 700;
}
.risk__content {
  margin-top: 8px;
  line-height: 1.7;
  color: var(--app-text-secondary);
}
.risk--warning {
  background: rgba(255, 247, 237, 0.92);
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.risk--info {
  background: rgba(239, 246, 255, 0.92);
  border: 1px solid rgba(59, 130, 246, 0.18);
}
.risk--soft {
  background: rgba(240, 253, 250, 0.92);
  border: 1px solid rgba(20, 184, 166, 0.18);
}
body.body--dark .hero-card,
body.body--dark .hero-mini-card,
body.body--dark .focus-card,
body.body--dark .filter-card,
body.body--dark .hospital-card,
body.body--dark .focus-stat,
body.body--dark .hospital-meta,
body.body--dark .detail-stat,
body.body--dark .summary-card,
body.body--dark .bill-item,
body.body--dark .suggestion-list {
  background: rgba(15, 23, 42, 0.58);
  border-color: rgba(71, 85, 105, 0.46);
}
body.body--dark .hero-card {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.22), transparent 36%),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.18), transparent 34%),
    rgba(15, 23, 42, 0.72);
}
body.body--dark .order-row:hover {
  background: rgba(59, 130, 246, 0.12);
}
body.body--dark .order-row--active {
  background: rgba(59, 130, 246, 0.16);
}
body.body--dark .risk--warning {
  background: rgba(120, 53, 15, 0.24);
}
body.body--dark .risk--info {
  background: rgba(30, 41, 59, 0.52);
}
body.body--dark .risk--soft {
  background: rgba(15, 118, 110, 0.18);
}
@media (max-width: 1023px) {
  .hero-title {
    font-size: 1.72rem;
  }
  .chart-box,
  .chart-box--small {
    height: 280px;
  }
}
@media (max-width: 599px) {
  .hero-title {
    font-size: 1.48rem;
  }
}
</style>
