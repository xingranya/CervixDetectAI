<template>
  <q-page class="patient-mini-page app-gradient-page">
    <div class="mini-stage">
      <div class="mini-shell">
        <div class="mini-shell__ambient mini-shell__ambient--top" aria-hidden="true"></div>
        <div class="mini-shell__ambient mini-shell__ambient--bottom" aria-hidden="true"></div>

        <div class="mini-shell__status" aria-hidden="true">
          <span>9:41</span>
          <div class="mini-shell__status-right">
            <q-icon name="signal_cellular_alt" size="14px" />
            <span>5G</span>
            <q-icon name="battery_full" size="16px" />
          </div>
        </div>

        <header class="mini-shell__topbar">
          <button type="button" class="icon-btn" aria-label="返回首页" @click="goBack">
            <q-icon name="arrow_back_ios_new" size="16px" aria-hidden="true" />
          </button>
          <div class="mini-shell__topbar-center">
            <div class="mini-shell__title">{{ currentMeta.title }}</div>
            <div class="mini-shell__subtitle">{{ currentMeta.subtitle }}</div>
          </div>
          <div class="mini-shell__topbar-spacer" aria-hidden="true"></div>
        </header>

        <main class="mini-shell__content">
          <template v-if="currentScreen === 'home'">
            <section class="hero-panel hero-panel--home">
              <p class="hero-panel__badge">{{ demoData.home.badge }}</p>
              <h1 class="hero-panel__title">{{ demoData.home.title }}</h1>
              <p class="hero-panel__desc">{{ demoData.home.summary }}</p>
              <div class="hero-panel__meta">
                <span class="status-pill status-pill--primary">{{ demoData.report.conclusion }}</span>
                <span class="status-pill status-pill--soft">{{ demoData.report.riskLabel }}</span>
              </div>
            </section>

            <section class="surface-card surface-card--timeline">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">下一步</p>
                  <h2 class="section-title">先看懂结果，再把复查时间安排好</h2>
                </div>
                <button type="button" class="ghost-link" @click="goTo('report')">查看说明</button>
              </div>

              <div class="step-list">
                <div v-for="step in demoData.home.nextSteps" :key="step.title" class="step-item">
                  <div class="step-item__index">{{ step.index }}</div>
                  <div class="step-item__body">
                    <h3 class="step-item__title">{{ step.title }}</h3>
                    <p class="step-item__desc">{{ step.desc }}</p>
                  </div>
                </div>
              </div>

              <q-btn
                unelevated
                no-caps
                color="primary"
                class="full-width q-mt-md page-cta"
                label="查看完整说明"
                @click="goTo('report')"
              />
            </section>

            <section class="quick-grid" aria-label="快捷入口">
              <button
                v-for="entry in demoData.home.quickEntries"
                :key="entry.label"
                type="button"
                class="quick-card"
                :class="`quick-card--${entry.tone}`"
                :aria-label="`${entry.label}，${entry.desc}`"
                @click="goTo(entry.screen)"
              >
                <div class="quick-card__icon">
                  <q-icon :name="entry.icon" size="18px" aria-hidden="true" />
                </div>
                <h2 class="quick-card__title">{{ entry.label }}</h2>
                <p class="quick-card__desc">{{ entry.desc }}</p>
              </button>
            </section>

            <section class="tip-card tip-card--calm">
              <p class="tip-card__title">温馨提示</p>
              <p class="tip-card__desc">{{ demoData.home.tip }}</p>
            </section>
          </template>

          <template v-else-if="currentScreen === 'report'">
            <section class="hero-panel hero-panel--report">
              <p class="hero-panel__badge">结果说明</p>
              <h1 class="hero-panel__title">{{ demoData.report.patientHeadline }}</h1>
              <p class="hero-panel__desc">{{ demoData.report.patientSummary }}</p>
              <div class="fact-strip">
                <div v-for="fact in demoData.report.factStrip" :key="fact.label" class="fact-strip__item">
                  <span>{{ fact.label }}</span>
                  <strong>{{ fact.value }}</strong>
                </div>
              </div>
            </section>

            <section class="surface-card surface-card--reading">
              <p class="section-kicker">这意味着什么</p>
              <div class="paragraph-stack">
                <p v-for="paragraph in demoData.report.meanings" :key="paragraph">{{ paragraph }}</p>
              </div>
            </section>

            <section class="surface-card surface-card--accented">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">接下来怎么做</p>
                  <h2 class="section-title">把注意力放在复查安排和线下沟通上</h2>
                </div>
              </div>

              <div class="recommend-list">
                <div v-for="item in demoData.report.suggestions" :key="item.title" class="recommend-item">
                  <div class="recommend-item__icon">
                    <q-icon name="done" size="16px" aria-hidden="true" />
                  </div>
                  <div class="recommend-item__body">
                    <h3 class="recommend-item__title">{{ item.title }}</h3>
                    <p class="recommend-item__desc">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="surface-card surface-card--dense">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">专业信息</p>
                  <h2 class="section-title">方便你和医生继续对照沟通</h2>
                </div>
              </div>

              <div class="data-list">
                <div v-for="marker in demoData.report.markers" :key="marker.label" class="data-row">
                  <span>{{ marker.label }}</span>
                  <div class="data-row__value">
                    <strong>{{ marker.value }}</strong>
                    <em>{{ marker.note }}</em>
                  </div>
                </div>
              </div>
            </section>

            <section class="tip-card tip-card--subtle">
              <p class="tip-card__title">说明</p>
              <p class="tip-card__desc">{{ demoData.report.disclaimer }}</p>
            </section>

            <div class="sticky-actions">
              <q-btn
                unelevated
                no-caps
                color="primary"
                class="col page-cta"
                label="继续咨询"
                @click="goTo('ai')"
              />
              <q-btn
                outline
                no-caps
                color="primary"
                class="col sticky-actions__secondary"
                label="查看复查建议"
                @click="goTo('records')"
              />
            </div>
          </template>

          <template v-else-if="currentScreen === 'records'">
            <section class="surface-card patient-card">
              <div class="patient-card__main">
                <div class="patient-card__avatar">{{ patientInitial }}</div>
                <div class="patient-card__body">
                  <h1 class="patient-card__name">{{ demoData.patient.name }}</h1>
                  <p class="patient-card__meta">
                    {{ demoData.patient.age }} 岁 · {{ demoData.patient.hospital }}
                  </p>
                </div>
              </div>
              <div class="status-pill status-pill--soft">{{ demoData.records.tag }}</div>
            </section>

            <section class="surface-card surface-card--timeline">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">检查记录</p>
                  <h2 class="section-title">最近几次结果变化</h2>
                </div>
              </div>

              <div class="timeline">
                <div v-for="item in demoData.records.timeline" :key="item.date" class="timeline-item">
                  <div class="timeline-item__dot" aria-hidden="true"></div>
                  <div class="timeline-item__content">
                    <div class="timeline-item__date">{{ item.date }}</div>
                    <h3 class="timeline-item__title">{{ item.title }}</h3>
                    <p class="timeline-item__desc">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="surface-card surface-card--dense">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">本次记录</p>
                  <h2 class="section-title">和这次筛查最有关的几项信息</h2>
                </div>
              </div>

              <div class="data-list">
                <div v-for="item in demoData.records.details" :key="item.label" class="data-row">
                  <span>{{ item.label }}</span>
                  <div class="data-row__value">
                    <strong>{{ item.value }}</strong>
                    <em>{{ item.note }}</em>
                  </div>
                </div>
              </div>
            </section>

            <section class="tip-card tip-card--mint">
              <p class="tip-card__title">记录建议</p>
              <p class="tip-card__desc">{{ demoData.records.tip }}</p>
            </section>
          </template>

          <template v-else-if="currentScreen === 'ai'">
            <section class="surface-card context-card">
              <p class="section-kicker">当前对话背景</p>
              <h1 class="section-title section-title--hero">{{ demoData.ai.contextTitle }}</h1>
              <p class="context-card__desc">{{ demoData.ai.contextDesc }}</p>
            </section>

            <section class="chat-stream" aria-live="polite">
              <div
                v-for="message in previewAiMessages"
                :key="message.id"
                class="chat-bubble"
                :class="message.role === 'assistant' ? 'chat-bubble--assistant' : 'chat-bubble--user'"
              >
                <div v-if="message.role === 'assistant'" class="chat-bubble__role">CervixDetectAI 助手</div>
                <p v-for="line in message.lines" :key="line" class="chat-bubble__text">
                  {{ line }}
                </p>
              </div>
            </section>

            <section class="surface-card surface-card--selection">
              <p class="section-kicker">你也可以这样问</p>
              <div class="question-list">
                <button
                  v-for="question in demoData.ai.questions"
                  :key="question"
                  type="button"
                  class="question-chip"
                  :class="{ 'question-chip--active': selectedAiQuestion === question }"
                  :aria-pressed="selectedAiQuestion === question ? 'true' : 'false'"
                  @click="selectAiQuestion(question)"
                >
                  {{ question }}
                </button>
              </div>
            </section>

            <section class="input-card">
              <div class="input-card__field" :class="{ 'input-card__field--active': !!selectedAiQuestion }">
                <span class="input-card__label">待发送问题</span>
                <strong>{{ currentAiDraft }}</strong>
              </div>
              <button
                type="button"
                class="input-card__send"
                :disabled="!selectedAiQuestion"
                :aria-label="selectedAiQuestion ? '发送选中的问题' : '请先选择一个推荐问题'"
                @click="sendPreviewQuestion"
              >
                <q-icon name="send" size="18px" color="white" aria-hidden="true" />
              </button>
            </section>

            <section class="tip-card tip-card--subtle">
              <p class="tip-card__title">使用说明</p>
              <p class="tip-card__desc">{{ demoData.ai.disclaimer }}</p>
            </section>
          </template>

          <template v-else>
            <section class="profile-hero">
              <div class="profile-hero__avatar">{{ patientInitial }}</div>
              <div class="profile-hero__main">
                <h1 class="profile-hero__name">{{ demoData.mine.greeting }}</h1>
                <p class="profile-hero__desc">{{ demoData.mine.summary }}</p>
              </div>
            </section>

            <section class="surface-card surface-card--reading">
              <div class="section-heading">
                <div class="section-heading__copy">
                  <p class="section-kicker">本月提醒</p>
                  <h2 class="section-title">你的复查与服务进度</h2>
                </div>
              </div>

              <div class="fact-strip fact-strip--soft">
                <div v-for="fact in demoData.mine.overview" :key="fact.label" class="fact-strip__item">
                  <span>{{ fact.label }}</span>
                  <strong>{{ fact.value }}</strong>
                </div>
              </div>
            </section>

            <section class="surface-card surface-card--accented">
              <p class="section-kicker">常用服务</p>
              <div class="menu-list">
                <button
                  v-for="item in demoData.mine.primaryMenus"
                  :key="item.label"
                  type="button"
                  class="menu-item"
                  :aria-label="`${item.label}，${item.desc}`"
                  @click="goTo(item.screen)"
                >
                  <div class="menu-item__icon">
                    <q-icon :name="item.icon" size="18px" aria-hidden="true" />
                  </div>
                  <div class="menu-item__body">
                    <h2 class="menu-item__title">{{ item.label }}</h2>
                    <p class="menu-item__desc">{{ item.desc }}</p>
                  </div>
                  <q-icon name="chevron_right" size="18px" class="menu-item__chevron" aria-hidden="true" />
                </button>
              </div>
            </section>

            <section class="surface-card surface-card--support">
              <p class="section-kicker">帮助与设置</p>
              <div class="support-list">
                <div v-for="item in demoData.mine.supportMenus" :key="item.label" class="support-item">
                  <div class="menu-item__icon menu-item__icon--light">
                    <q-icon :name="item.icon" size="18px" aria-hidden="true" />
                  </div>
                  <div class="menu-item__body">
                    <h2 class="menu-item__title">{{ item.label }}</h2>
                    <p class="menu-item__desc">{{ item.desc }}</p>
                  </div>
                  <span class="support-item__status">{{ item.status }}</span>
                </div>
              </div>
            </section>
          </template>
        </main>

        <nav class="mini-shell__tabbar" aria-label="小程序底部导航">
          <button
            v-for="item in tabItems"
            :key="item.screen"
            type="button"
            class="tab-item"
            :class="{ 'tab-item--active': item.matches.includes(currentScreen) }"
            :aria-current="item.matches.includes(currentScreen) ? 'page' : undefined"
            @click="goTo(item.screen)"
          >
            <q-icon :name="item.icon" size="18px" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const screens = ['home', 'report', 'records', 'ai', 'mine'] as const;
type ScreenKey = (typeof screens)[number];
type AiMessageRole = 'user' | 'assistant';
type AiPreviewMessage = {
  id: string;
  role: AiMessageRole;
  lines: string[];
};

const metaMap: Record<ScreenKey, { title: string; subtitle: string }> = {
  home: { title: '关怀随访', subtitle: '结果与下一步建议' },
  report: { title: '报告说明', subtitle: '先看懂结果，再安排复查' },
  records: { title: '检查记录', subtitle: '近期变化与历史轨迹' },
  ai: { title: '解读帮助', subtitle: '先整理问题，再和医生沟通' },
  mine: { title: '我的', subtitle: '服务入口与个人提醒' },
};

const demoData = {
  patient: {
    name: '张女士',
    age: 36,
    hospital: '荆州市妇幼保健院',
    caseNo: 'CY20260318021',
  },
  home: {
    badge: '最新检查结果已更新',
    title: '您可先查看本次报告与复查提醒',
    summary:
      '本页用于展示报告摘要、历史记录与复查提示。具体诊疗意见请以接诊医生说明为准。',
    nextSteps: [
      { index: '01', title: '查看本次报告', desc: '先确认检查时间、检查项目和结果摘要。' },
      { index: '02', title: '关注复查安排', desc: '如需复查或复诊，请按医院或医生安排及时处理。' },
      { index: '03', title: '记录待咨询问题', desc: '对结果有疑问时，可先整理问题后再和医生沟通。' },
    ],
    quickEntries: [
      { label: '看完整说明', desc: '把这次结果讲清楚', icon: 'description', screen: 'report' as ScreenKey, tone: 'primary' },
      { label: '查检查记录', desc: '看看最近几次变化', icon: 'schedule', screen: 'records' as ScreenKey, tone: 'teal' },
      { label: '解读帮助', desc: '先整理想问医生的问题', icon: 'chat_bubble_outline', screen: 'ai' as ScreenKey, tone: 'sun' },
    ],
    tip:
      '如出现明显不适，或已收到医院复诊通知，请及时前往医院就诊。',
  },
  report: {
    conclusion: 'LSIL 倾向',
    riskLabel: '建议重点关注',
    patientHeadline: '请结合医生意见查看本次报告',
    patientSummary:
      '本页用于展示本次检查的结果摘要和随访提示，不替代医生面诊、诊断或治疗意见。',
    factStrip: [
      { label: '筛查方式', value: 'TCT' },
      { label: '报告日期', value: '2026-03-18' },
      { label: '置信度', value: '92%' },
    ],
    meanings: [
      '报告内容仅供查看与留存，具体含义请结合接诊医生的说明理解。',
      '若需进一步检查、复查或复诊，请以医院安排和医生建议为准。',
      '如对报告存在疑问，可携带本次结果到院咨询，便于医生结合完整信息判断。',
    ],
    suggestions: [
      { title: '先核对报告信息', desc: '确认本次检查时间、项目名称和报告编号是否正确。' },
      { title: '保留报告以备就诊', desc: '下次就诊或复诊时带上结果，医生更方便对照查看。' },
      { title: '按院内安排处理后续事项', desc: '如需复查、复诊或补充检查，请以医院通知和医生建议为准。' },
    ],
    markers: [
      { label: 'HPV', value: '阳性', note: '建议与本次结果一起评估' },
      { label: 'p16', value: '弱阳性', note: '作为辅助参考信息' },
      { label: 'Ki67', value: '低表达', note: '当前不提示高强度异常' },
      { label: '病例编号', value: 'CY20260318021', note: '就诊沟通时可直接出示' },
    ],
    disclaimer: '本页面仅用于信息展示与健康管理提醒，不构成诊断、治疗或紧急医疗建议。',
  },
  records: {
    tag: '建议按时复查',
    timeline: [
      {
        date: '2026年3月18日',
        title: '液基细胞学 TCT',
        desc: '结果提示 LSIL 倾向，建议在 6 个月内完成复查。',
      },
      {
        date: '2026年1月15日',
        title: 'HPV 复查',
        desc: '结果为阳性，医生建议继续观察，并结合细胞学结果一起看。',
      },
      {
        date: '2025年9月10日',
        title: '常规筛查',
        desc: '当时未见明显异常，为后续变化提供了对比基础。',
      },
    ],
    details: [
      { label: '当前结论', value: 'LSIL 倾向', note: '轻度异常改变，建议继续跟踪' },
      { label: '检查方式', value: '液基细胞学 TCT', note: '本次主要筛查项目' },
      { label: '报告时间', value: '2026-03-18 10:45', note: '当前已进入患者端可查看状态' },
      { label: '复查建议', value: '6 个月内', note: '请按医嘱尽早安排时间' },
    ],
    tip: '后续如有新的检查结果，建议就诊时一并出示，方便医生结合历史记录综合查看。',
  },
  ai: {
    contextTitle: '先整理需要和医生确认的问题',
    contextDesc:
      '这里用于帮助你梳理报告字段、复查提醒和就诊前需要确认的问题，具体诊疗仍请以医生意见为准。',
    messages: [
      {
        id: 'user-1',
        role: 'user',
        lines: ['这份报告里，我需要先看哪些信息？'],
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        lines: [
          '建议你先看检查时间、检查项目、结果摘要和复查提示。',
          '如果需要进一步理解这份结果，请以医生解释为准，我可以先帮你整理待咨询的问题。',
        ],
      },
      {
        id: 'user-2',
        role: 'user',
        lines: ['我去医院时需要准备什么？'],
      },
      {
        id: 'assistant-2',
        role: 'assistant',
        lines: [
          '建议带上本次报告、既往检查记录，以及你想确认的问题清单。',
          '如果医院已有复诊通知或医生已有明确要求，请按院内安排及时到院处理。',
        ],
      },
    ],
    questions: [
      '这份报告里哪些信息需要我重点留意？',
      '复查安排一般看哪里？',
      '就诊时我需要带什么资料？',
      '我可以先记录哪些问题？',
    ],
    disclaimer: '该功能仅用于帮助整理问题与查看信息，不替代医生问诊、诊断或治疗建议。',
  },
  mine: {
    greeting: '张女士，您好',
    summary: '可在此查看报告、历史记录与复查提醒。',
    overview: [
      { label: '待关注结果', value: '1 条' },
      { label: '下次复查', value: '2026年9月前' },
      { label: '咨询记录', value: '8 次' },
    ],
    primaryMenus: [
      { label: '我的报告', desc: '回看完整结果和解释', icon: 'article', screen: 'report' as ScreenKey },
      { label: '检查记录', desc: '按时间查看历史筛查结果', icon: 'inventory_2', screen: 'records' as ScreenKey },
      { label: '解读帮助', desc: '先整理想咨询医生的问题', icon: 'smart_toy', screen: 'ai' as ScreenKey },
    ],
    supportMenus: [
      { label: '通知提醒', desc: '用于查看报告更新和复查提醒。', icon: 'notifications_none', status: '演示中' },
      { label: '帮助中心', desc: '后续将补充常见问题与就诊说明。', icon: 'help_outline', status: '即将接入' },
      { label: '隐私与设置', desc: '后续可管理展示偏好与隐私选项。', icon: 'settings', status: '规划中' },
    ],
  },
} as const;

const aiReplyMap: Record<string, string[]> = {
  '这份报告里哪些信息需要我重点留意？': [
    '建议先看检查时间、检查项目、结果摘要和复查提示。',
    '如果需要进一步理解专业术语，请在就诊时结合医生说明确认。',
  ],
  '复查安排一般看哪里？': [
    '通常可以先看报告页中的复查提示和院内通知。',
    '具体时间和是否需要补充检查，请以医院或医生安排为准。',
  ],
  '就诊时我需要带什么资料？': [
    '建议带上本次报告、既往检查记录，以及你想咨询的问题清单。',
    '如果有院内通知或预约信息，也建议一并准备。',
  ],
  '我可以先记录哪些问题？': [
    '可以先记下复查时间、是否需要补充检查，以及就诊前需要准备哪些资料。',
    '这样和医生沟通时会更聚焦，也更不容易遗漏重点。',
  ],
};

const defaultAiDraft = '先从上面的推荐问题里选一个，我会帮你继续整理思路。';

const tabItems = [
  { screen: 'home' as ScreenKey, icon: 'description', label: '报告', matches: ['home', 'report'] as ScreenKey[] },
  { screen: 'records' as ScreenKey, icon: 'schedule', label: '记录', matches: ['records'] as ScreenKey[] },
  { screen: 'ai' as ScreenKey, icon: 'forum', label: '咨询', matches: ['ai'] as ScreenKey[] },
  { screen: 'mine' as ScreenKey, icon: 'person_outline', label: '我的', matches: ['mine'] as ScreenKey[] },
] as const;

const selectedAiQuestion = ref('');
const hasSentAiPreview = ref(false);

const currentScreen = computed<ScreenKey>(() => {
  const raw = typeof route.params.screen === 'string' ? route.params.screen : 'home';
  return screens.includes(raw as ScreenKey) ? (raw as ScreenKey) : 'home';
});

const currentMeta = computed(() => metaMap[currentScreen.value]);

const patientInitial = computed(() => demoData.patient.name.charAt(0));

const currentAiDraft = computed(() =>
  selectedAiQuestion.value || defaultAiDraft,
);

const previewAiMessages = computed<AiPreviewMessage[]>(() => {
  const baseMessages = demoData.ai.messages.map((message) => ({
    id: message.id,
    role: message.role,
    lines: [...message.lines],
  }));

  if (!selectedAiQuestion.value || !hasSentAiPreview.value) {
    return baseMessages;
  }

  return [
    ...baseMessages,
    {
      id: 'preview-user',
      role: 'user',
      lines: [selectedAiQuestion.value],
    },
    {
      id: 'preview-assistant',
      role: 'assistant',
      lines:
        aiReplyMap[selectedAiQuestion.value] || [
          '我可以先帮你把这次结果讲清楚，再一起整理下一步最该问医生的重点。',
        ],
    },
  ];
});

const goTo = (screen: ScreenKey) => {
  void router.push({ name: 'patient-mini-program', params: { screen } });
};

const goBack = () => {
  if (currentScreen.value === 'home') {
    void router.push('/');
    return;
  }

  void router.push({ name: 'patient-mini-program', params: { screen: 'home' } });
};

const selectAiQuestion = (question: string) => {
  selectedAiQuestion.value = question;
  hasSentAiPreview.value = false;
};

const sendPreviewQuestion = () => {
  if (!selectedAiQuestion.value) {
    return;
  }

  hasSentAiPreview.value = true;
};
</script>

<style scoped lang="scss">
.patient-mini-page {
  --mini-page-padding: 28px;
  --mini-shell-bg: var(--app-mini-shell-bg);
  --mini-shell-border: var(--app-mini-shell-border);
  --mini-shell-shadow: var(--app-mini-shell-shadow);
  --mini-card-bg: var(--app-mini-card-bg);
  --mini-card-border: var(--app-mini-card-border);
  --mini-card-shadow: var(--app-mini-card-shadow);
  --mini-card-shadow-strong: var(--app-mini-card-shadow-strong);
  --mini-text-main: var(--app-text-primary);
  --mini-text-muted: var(--app-mini-text-muted);
  --mini-text-soft: var(--app-mini-text-soft);
  --mini-accent: var(--app-mini-accent);
  --mini-accent-soft: var(--app-mini-accent-soft);
  --mini-primary: var(--app-mini-primary);
  --mini-primary-strong: var(--app-mini-primary-strong);
  --mini-primary-soft: var(--app-mini-primary-soft);
  --mini-warm: var(--app-mini-warm);
  --mini-warm-soft: var(--app-mini-warm-soft);
  --mini-divider: var(--app-mini-divider);
  --mini-tabbar-bg: var(--app-mini-tabbar-bg);
  --mini-tabbar-border: var(--app-mini-tabbar-border);
  --mini-tabbar-blur: var(--app-mini-tabbar-blur);
  --mini-input-bg: var(--app-mini-input-bg);
  --mini-surface-primary: var(--app-mini-surface-primary);
  --mini-surface-report: var(--app-mini-surface-report);
  --mini-surface-calm: var(--app-mini-surface-calm);
  --mini-surface-mint: var(--app-mini-surface-mint);
  --mini-surface-subtle: var(--app-mini-surface-subtle);
  --mini-user-bubble-bg: var(--app-mini-user-bubble-bg);
  --mini-focus-ring: var(--app-mini-focus-ring);
  min-height: 100vh;
  padding: var(--mini-page-padding);
}

.mini-stage {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - var(--mini-page-padding) * 2);
}

.mini-shell {
  position: relative;
  width: 100%;
  max-width: 412px;
  min-height: calc(100vh - var(--mini-page-padding) * 2);
  border-radius: 34px;
  background: var(--mini-shell-bg);
  border: 1px solid var(--mini-shell-border);
  box-shadow: var(--mini-shell-shadow);
  overflow: hidden;
}

.mini-shell__ambient {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.mini-shell__ambient--top {
  top: -58px;
  right: -36px;
  width: 156px;
  height: 156px;
  background: radial-gradient(circle, var(--mini-primary-soft) 0%, rgba(37, 99, 235, 0) 72%);
}

.mini-shell__ambient--bottom {
  left: -40px;
  bottom: 120px;
  width: 142px;
  height: 142px;
  background: radial-gradient(circle, var(--mini-accent-soft) 0%, rgba(31, 122, 102, 0) 72%);
}

.mini-shell__status,
.mini-shell__topbar,
.mini-shell__tabbar {
  position: relative;
  z-index: 1;
}

.mini-shell__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px 6px;
  color: var(--mini-text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.mini-shell__status-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-shell__topbar {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 18px 16px;
}

.mini-shell__topbar-center {
  min-width: 0;
  text-align: center;
}

.mini-shell__title {
  color: var(--mini-text-main);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.mini-shell__subtitle {
  margin-top: 4px;
  color: var(--mini-text-soft);
  font-size: 0.78rem;
  line-height: 1.45;
}

.mini-shell__topbar-spacer {
  width: 44px;
  height: 44px;
}

.mini-shell__content {
  position: relative;
  z-index: 1;
  padding: 4px 16px 128px;
}

.mini-shell__tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 12px 14px calc(18px + env(safe-area-inset-bottom, 0px));
  background: var(--mini-tabbar-bg);
  border-top: 1px solid var(--mini-tabbar-border);
  backdrop-filter: blur(var(--mini-tabbar-blur));
  -webkit-backdrop-filter: blur(var(--mini-tabbar-blur));
}

.icon-btn,
.ghost-link,
.quick-card,
.question-chip,
.menu-item,
.tab-item,
.input-card__send {
  border: 0;
  cursor: pointer;
  transition:
    transform var(--app-motion-duration-fast) var(--app-motion-ease-default),
    background-color var(--app-motion-duration-fast) var(--app-motion-ease-default),
    color var(--app-motion-duration-fast) var(--app-motion-ease-default),
    box-shadow var(--app-motion-duration-fast) var(--app-motion-ease-default);
}

.icon-btn:focus-visible,
.ghost-link:focus-visible,
.quick-card:focus-visible,
.question-chip:focus-visible,
.menu-item:focus-visible,
.tab-item:focus-visible,
.input-card__send:focus-visible {
  outline: none;
  box-shadow: var(--mini-focus-ring);
}

.icon-btn,
.input-card__send,
.question-chip,
.ghost-link {
  -webkit-tap-highlight-color: transparent;
}

.icon-btn {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: var(--mini-primary);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
}

.icon-btn:hover,
.ghost-link:hover,
.question-chip:hover,
.menu-item:hover {
  transform: translateY(-1px);
}

.hero-panel,
.surface-card,
.tip-card,
.input-card,
.profile-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  border-radius: 24px;
  border: 1px solid var(--mini-card-border);
  background: var(--mini-card-bg);
  box-shadow: var(--mini-card-shadow);
}

.hero-panel,
.surface-card,
.tip-card,
.input-card {
  padding: 18px;
}

.hero-panel--home {
  background: var(--mini-surface-primary);
}

.hero-panel--report {
  background: var(--mini-surface-report);
}

.surface-card--reading {
  background: var(--mini-surface-subtle);
}

.surface-card--timeline::before,
.surface-card--accented::before,
.surface-card--selection::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 24px 0 0 24px;
}

.surface-card--timeline::before {
  background: linear-gradient(180deg, var(--mini-accent) 0%, rgba(31, 122, 102, 0.18) 100%);
}

.surface-card--accented::before {
  background: linear-gradient(180deg, var(--mini-primary) 0%, rgba(37, 99, 235, 0.18) 100%);
}

.surface-card--selection::before {
  background: linear-gradient(180deg, var(--mini-warm) 0%, rgba(245, 158, 11, 0.16) 100%);
}

.surface-card--support {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 249, 252, 0.94) 100%);
}

.hero-panel__badge,
.section-kicker,
.tip-card__title {
  margin: 0;
  color: var(--mini-accent);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-panel__title,
.section-title,
.profile-hero__name,
.patient-card__name,
.quick-card__title,
.menu-item__title,
.timeline-item__title,
.step-item__title,
.recommend-item__title {
  margin: 0;
  color: var(--mini-text-main);
  line-height: 1.35;
  overflow-wrap: break-word;
}

.hero-panel__title {
  margin-top: 10px;
  font-size: 1.28rem;
  font-weight: 700;
}

.section-title,
.profile-hero__name,
.patient-card__name {
  font-size: 0.98rem;
  font-weight: 700;
}

.section-title--hero {
  margin-top: 6px;
  font-size: 1.02rem;
}

.step-item__title,
.recommend-item__title,
.timeline-item__title {
  font-size: 0.94rem;
  font-weight: 700;
}

.quick-card__title,
.menu-item__title {
  font-size: 0.98rem;
  font-weight: 700;
}

.hero-panel__desc,
.tip-card__desc,
.context-card__desc,
.profile-hero__desc,
.patient-card__meta,
.step-item__desc,
.recommend-item__desc,
.quick-card__desc,
.menu-item__desc,
.timeline-item__desc,
.paragraph-stack p,
.data-row em {
  margin: 0;
  color: var(--mini-text-muted);
  font-size: 0.9rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.hero-panel__desc,
.tip-card__desc,
.context-card__desc,
.profile-hero__desc,
.patient-card__meta {
  margin-top: 10px;
}

.section-heading,
.hero-panel__meta,
.fact-strip,
.data-row,
.patient-card,
.patient-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading {
  align-items: flex-start;
}

.section-heading__copy,
.patient-card__body,
.menu-item__body {
  min-width: 0;
}

.hero-panel__meta {
  margin-top: 16px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill--primary {
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
}

.status-pill--soft {
  color: var(--mini-warm);
  background: var(--mini-warm-soft);
}

.ghost-link {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
}

.step-list,
.paragraph-stack,
.recommend-list,
.menu-list,
.support-list {
  display: flex;
  flex-direction: column;
}

.step-list,
.recommend-list,
.menu-list,
.support-list {
  margin-top: 16px;
}

.step-list,
.recommend-list {
  gap: 14px;
}

.step-item,
.recommend-item,
.support-item {
  display: flex;
  gap: 12px;
}

.step-item__index,
.recommend-item__icon,
.quick-card__icon,
.menu-item__icon,
.support-item__status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.step-item__index {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: var(--mini-primary-strong);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.step-item__body,
.recommend-item__body,
.timeline-item__content {
  min-width: 0;
}

.step-item__desc,
.recommend-item__desc,
.quick-card__desc,
.menu-item__desc,
.timeline-item__desc,
.paragraph-stack p,
.data-row em {
  margin-top: 6px;
}

.page-cta :deep(.q-btn__content),
.sticky-actions__secondary :deep(.q-btn__content) {
  font-weight: 700;
  letter-spacing: 0.01em;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.quick-card {
  min-height: 144px;
  padding: 18px 16px;
  text-align: left;
  border-radius: 22px;
  border: 1px solid var(--mini-card-border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--mini-card-shadow-strong);
}

.quick-card__icon {
  width: 44px;
  height: 44px;
  margin-bottom: 16px;
  border-radius: 14px;
  color: inherit;
}

.quick-card--primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 247, 255, 0.96) 100%);
}

.quick-card--primary .quick-card__icon {
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
}

.quick-card--teal {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 250, 247, 0.96) 100%);
}

.quick-card--teal .quick-card__icon {
  color: var(--mini-accent);
  background: var(--mini-accent-soft);
}

.quick-card--sun {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 239, 0.96) 100%);
}

.quick-card--sun .quick-card__icon {
  color: var(--mini-warm);
  background: var(--mini-warm-soft);
}

.quick-card__title {
  font-size: 1rem;
  font-weight: 700;
}

.quick-card__desc {
  font-size: 0.82rem;
}

.tip-card {
  background: var(--mini-surface-subtle);
}

.tip-card--calm {
  background: var(--mini-surface-calm);
}

.tip-card--mint {
  background: var(--mini-surface-mint);
}

.fact-strip {
  margin-top: 18px;
  flex-wrap: wrap;
}

.fact-strip--soft {
  margin-top: 14px;
}

.fact-strip__item {
  flex: 1;
  min-width: 104px;
  padding: 15px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
}

.fact-strip__item span,
.timeline-item__date,
.data-row span,
.input-card__label {
  display: block;
  color: var(--mini-text-soft);
  font-size: 0.74rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.fact-strip__item strong {
  display: block;
  margin-top: 8px;
  color: var(--mini-text-main);
  font-size: 0.92rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.paragraph-stack {
  gap: 12px;
  margin-top: 12px;
}

.data-list {
  margin-top: 14px;
}

.data-row {
  padding: 14px 0;
  align-items: flex-start;
  border-bottom: 1px solid var(--mini-divider);
}

.data-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.data-row__value {
  min-width: 0;
  max-width: 58%;
  text-align: right;
}

.data-row strong {
  display: block;
  color: var(--mini-text-main);
  font-size: 0.9rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.data-row em {
  display: block;
  font-size: 0.76rem;
  font-style: normal;
}

.sticky-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 8px;
}

.patient-card__avatar,
.profile-hero__avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--mini-primary-strong);
  background: linear-gradient(135deg, rgba(230, 241, 255, 0.96), rgba(243, 248, 255, 0.92));
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: var(--mini-surface-primary);
}

.timeline {
  position: relative;
  margin-top: 16px;
  padding-left: 8px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 10px;
  bottom: 12px;
  width: 1px;
  background: var(--mini-divider);
}

.timeline-item + .timeline-item {
  margin-top: 16px;
}

.timeline-item__dot {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--mini-accent);
  box-shadow: 0 0 0 6px var(--mini-accent-soft);
}

.chat-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.chat-bubble {
  max-width: 88%;
  padding: 14px 16px;
  border-radius: 20px;
  box-shadow: var(--mini-card-shadow);
}

.chat-bubble--assistant {
  align-self: flex-start;
  border: 1px solid var(--mini-card-border);
  background: var(--mini-card-bg);
}

.chat-bubble--user {
  align-self: flex-end;
  color: white;
  background: var(--mini-user-bubble-bg);
}

.chat-bubble__role {
  margin-bottom: 8px;
  color: var(--mini-accent);
  font-size: 0.74rem;
  font-weight: 700;
}

.chat-bubble__text {
  margin: 0;
  line-height: 1.72;
  overflow-wrap: anywhere;
}

.chat-bubble__text + .chat-bubble__text {
  margin-top: 8px;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.question-chip {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  color: var(--mini-text-muted);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
  font-size: 0.82rem;
  font-weight: 600;
}

.question-chip--active {
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
  box-shadow: inset 0 0 0 1px transparent;
}

.input-card {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.input-card__field {
  flex: 1;
  min-width: 0;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 18px;
  background: var(--mini-input-bg);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
}

.input-card__field strong {
  color: var(--mini-text-main);
  font-size: 0.86rem;
  line-height: 1.55;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.input-card__field--active {
  background: rgba(255, 255, 255, 0.92);
}

.input-card__send {
  width: 52px;
  min-width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: var(--mini-user-bubble-bg);
}

.input-card__send:disabled {
  cursor: not-allowed;
  transform: none;
  opacity: 0.52;
  box-shadow: none;
}

.menu-list,
.support-list {
  gap: 10px;
}

.menu-item,
.support-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
}

.menu-item {
  text-align: left;
}

.menu-item__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
}

.menu-item__icon--light {
  color: var(--mini-accent);
  background: var(--mini-accent-soft);
}

.menu-item__chevron {
  color: var(--mini-text-soft);
}

.support-item__status {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--mini-text-soft);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.tab-item {
  flex: 1;
  min-width: 0;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
  color: var(--mini-text-muted);
  background: transparent;
  border-radius: 16px;
}

.tab-item span {
  font-size: 0.78rem;
  line-height: 1.15;
  font-weight: 700;
  text-align: center;
}

.tab-item--active {
  color: var(--mini-primary-strong);
  background: var(--mini-primary-soft);
}

body.body--dark .patient-mini-page {
  --mini-text-main: var(--app-text-primary);
}

body.body--dark .icon-btn,
body.body--dark .question-chip,
body.body--dark .input-card__field,
body.body--dark .menu-item,
body.body--dark .support-item,
body.body--dark .support-item__status,
body.body--dark .fact-strip__item,
body.body--dark .step-item__index {
  background: rgba(18, 28, 39, 0.92);
  box-shadow: inset 0 0 0 1px var(--mini-divider);
}

body.body--dark .mini-shell__badge,
body.body--dark .question-chip--active {
  box-shadow: none;
}

body.body--dark .chat-bubble--assistant {
  background: rgba(19, 28, 37, 0.94);
}

body.body--dark .patient-card__avatar,
body.body--dark .profile-hero__avatar {
  background: linear-gradient(135deg, rgba(35, 51, 72, 0.96), rgba(27, 43, 58, 0.92));
}

@media (max-width: 480px) {
  .patient-mini-page {
    --mini-page-padding: 12px;
  }

  .mini-shell {
    min-height: calc(100vh - 24px);
    border-radius: 26px;
  }

  .mini-shell__topbar {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .mini-shell__topbar-spacer {
    display: none;
  }

  .mini-shell__content {
    padding-left: 14px;
    padding-right: 14px;
  }

  .quick-grid,
  .sticky-actions {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .quick-card {
    min-height: auto;
  }
}

@media (max-width: 380px) {
  .mini-shell__status {
    padding-inline: 14px;
  }

  .mini-shell__topbar,
  .patient-card,
  .section-heading,
  .data-row,
  .profile-hero,
  .support-item {
    gap: 10px;
  }

  .section-heading,
  .patient-card,
  .data-row,
  .support-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .ghost-link,
  .status-pill,
  .support-item__status {
    width: 100%;
    justify-content: center;
  }

  .data-row__value {
    max-width: none;
    width: 100%;
    text-align: left;
  }

  .question-chip {
    width: 100%;
    justify-content: center;
  }

  .tab-item span {
    font-size: 0.74rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-btn,
  .ghost-link,
  .quick-card,
  .question-chip,
  .menu-item,
  .tab-item,
  .input-card__send {
    transition: none;
  }

  .icon-btn:hover,
  .ghost-link:hover,
  .question-chip:hover,
  .menu-item:hover {
    transform: none;
  }
}
</style>
