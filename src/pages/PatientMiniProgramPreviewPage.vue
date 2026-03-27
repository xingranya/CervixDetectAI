<template>
  <q-page class="patient-mini-page app-gradient-page q-pa-md">
    <div class="mini-shell">
      <div class="mini-shell__status">
        <span>9:41</span>
        <div class="mini-shell__status-right">
          <span>5G</span>
          <q-icon name="battery_full" size="18px" />
        </div>
      </div>

      <div class="mini-shell__topbar">
        <button type="button" class="icon-btn" @click="goBack">
          <q-icon name="arrow_back_ios_new" size="18px" />
        </button>
        <div class="mini-shell__topbar-center">
          <div class="mini-shell__title">{{ currentMeta.title }}</div>
          <div class="mini-shell__subtitle">荆州市妇幼保健院 · 张女士</div>
        </div>
        <button type="button" class="icon-btn icon-btn--muted">
          <q-icon name="more_horiz" size="18px" />
        </button>
      </div>

      <div class="mini-shell__content">
        <template v-if="currentScreen === 'home'">
          <section class="hero-card">
            <div>
              <div class="hero-card__eyebrow">CervixDetectAI 患者端</div>
              <div class="hero-card__title">张女士，您好</div>
              <div class="hero-card__desc">最新检查报告已生成，可查看完整解读并继续咨询 AI 助手。</div>
            </div>
            <q-chip dense color="primary" text-color="white">报告已更新</q-chip>
          </section>

          <section class="report-summary-card">
            <div class="report-summary-card__header">
              <div>
                <div class="section-label">最新报告结果</div>
                <div class="section-title">液基细胞学 TCT</div>
              </div>
              <div class="text-caption text-grey-6">2026年3月18日</div>
            </div>
            <div class="report-summary-card__main q-mt-md">
              <div>
                <div class="metric-label">AI 诊断结论</div>
                <div class="metric-value metric-value--teal">LSIL 倾向</div>
              </div>
              <div class="summary-badges">
                <q-chip dense square color="amber-1" text-color="amber-9">中度关注</q-chip>
                <q-chip dense square color="blue-1" text-color="primary">置信度 92%</q-chip>
              </div>
            </div>
            <div class="summary-note q-mt-md">建议 6 个月内复查并结合 HPV 结果随访。</div>
            <q-btn unelevated no-caps color="primary" class="full-width q-mt-lg" label="查看完整报告" @click="goTo('report')" />
          </section>

          <section class="stats-grid">
            <div class="stat-card">
              <span>当前病例数</span>
              <strong>4</strong>
            </div>
            <div class="stat-card">
              <span>最近复查</span>
              <strong>2026-03-18</strong>
            </div>
            <div class="stat-card stat-card--wide">
              <span>当前建议</span>
              <strong>6 个月内复查</strong>
            </div>
          </section>

          <section class="quick-actions">
            <button type="button" class="action-card" @click="goTo('report')">
              <div class="action-card__icon"><q-icon name="article" size="22px" /></div>
              <div>
                <div class="action-card__title">查看完整报告</div>
                <div class="action-card__desc">查看 AI 诊断结论与临床建议</div>
              </div>
            </button>
            <button type="button" class="action-card" @click="goTo('records')">
              <div class="action-card__icon action-card__icon--teal"><q-icon name="folder_shared" size="22px" /></div>
              <div>
                <div class="action-card__title">查看病例档案</div>
                <div class="action-card__desc">查看当前病例与历史检查轨迹</div>
              </div>
            </button>
            <button type="button" class="action-card action-card--primary" @click="goTo('ai')">
              <div class="action-card__icon action-card__icon--light"><q-icon name="smart_toy" size="22px" /></div>
              <div>
                <div class="action-card__title">咨询 AI 助手</div>
                <div class="action-card__desc">围绕当前报告进行解读与追问</div>
              </div>
            </button>
          </section>
        </template>

        <template v-else-if="currentScreen === 'report'">
          <section class="report-detail-card">
            <div class="section-label">报告摘要</div>
            <div class="report-detail-card__headline q-mt-sm">LSIL 倾向</div>
            <div class="report-detail-card__sub q-mt-sm">液基细胞学 TCT 检测提示低度鳞状上皮内病变，建议定期随访。</div>
            <div class="summary-badges q-mt-md">
              <q-chip dense square color="amber-1" text-color="amber-9">中度关注</q-chip>
              <q-chip dense square color="blue-1" text-color="primary">置信度 92%</q-chip>
            </div>
          </section>

          <section class="biomarker-card">
            <div class="section-title section-title--small">生物标志物</div>
            <div class="info-list q-mt-md">
              <div class="info-row"><span>HPV</span><strong class="text-warning">阳性</strong></div>
              <div class="info-row"><span>p16</span><strong>弱阳性</strong></div>
              <div class="info-row"><span>Ki67</span><strong>低表达</strong></div>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">可疑区域说明</div>
            <div class="body-copy q-mt-sm">在局部区域检测到轻度异常鳞状上皮细胞表现，伴随核浆比增高与局部极性紊乱，整体更符合 LSIL 相关改变。</div>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">临床建议</div>
            <ul class="advice-list q-mt-sm">
              <li>建议结合 HPV 结果继续随访。</li>
              <li>建议 6 个月内复查 TCT 或阴道镜检查。</li>
              <li>保持规律作息与免疫管理，按医嘱完成后续检查。</li>
            </ul>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">详细报告</div>
            <div class="report-block q-mt-sm">
              <div class="report-block__label">病例摘要</div>
              <div class="body-copy">本次检查基于 2026 年 3 月 18 日液基细胞学样本完成，当前结果更倾向于低度鳞状上皮内病变表现。</div>
            </div>
            <div class="report-block q-mt-md">
              <div class="report-block__label">AI 解读</div>
              <div class="body-copy">当前结果不等同于严重病变，但提示需要持续观察。结合 HPV 阳性结果，更适合按复查路径继续管理。</div>
            </div>
            <div class="report-block q-mt-md">
              <div class="report-block__label">注意事项</div>
              <div class="body-copy">AI 解读仅供参考，最终结果请以执业医师意见和后续检查结果为准。</div>
            </div>
          </section>

          <div class="sticky-actions">
            <q-btn unelevated no-caps color="primary" class="col" label="咨询 AI 助手" @click="goTo('ai')" />
            <q-btn outline no-caps color="primary" class="sticky-actions__icon" icon="download" />
            <q-btn outline no-caps color="primary" class="sticky-actions__icon" icon="share" />
          </div>
        </template>

        <template v-else-if="currentScreen === 'records'">
          <section class="record-hero-card">
            <div>
              <div class="section-title">张女士</div>
              <div class="record-hero-card__meta q-mt-xs">36 岁 · 病例编号 CY20260318021</div>
            </div>
            <q-chip dense square color="amber-1" text-color="amber-9">需复查</q-chip>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">当前病例</div>
            <div class="info-list q-mt-md">
              <div class="info-row"><span>检查方式</span><strong>液基细胞学 TCT</strong></div>
              <div class="info-row"><span>检查日期</span><strong>2026-03-18</strong></div>
              <div class="info-row"><span>报告时间</span><strong>2026-03-18 10:45</strong></div>
              <div class="info-row"><span>当前结论</span><strong class="text-teal">LSIL 倾向</strong></div>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">历史轨迹</div>
            <div class="timeline q-mt-md">
              <div v-for="item in timeline" :key="item.date" class="timeline-item">
                <div class="timeline-item__dot"></div>
                <div class="timeline-item__content">
                  <div class="timeline-item__date">{{ item.date }}</div>
                  <div class="timeline-item__title">{{ item.title }}</div>
                  <div class="timeline-item__desc">{{ item.desc }}</div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="currentScreen === 'ai'">
          <section class="context-card">
            <div class="section-label">当前对话上下文</div>
            <div class="body-copy q-mt-sm">本次对话基于病例 CY20260318021 的最新报告，仅供患者理解报告内容使用。</div>
          </section>

          <section class="chat-stream">
            <div class="chat-bubble chat-bubble--user">
              <div class="chat-bubble__text">这份报告最需要关注什么？</div>
            </div>
            <div class="chat-bubble chat-bubble--assistant">
              <div class="chat-bubble__role">CervixDetectAI 助手</div>
              <div class="chat-bubble__text">
                <strong>当前重点：</strong>这份报告提示 LSIL 倾向，代表宫颈细胞存在轻度异常改变，常与 HPV 感染相关。它不代表严重病变，但需要继续随访。
              </div>
              <div class="chat-bubble__text q-mt-sm">
                <strong>建议：</strong>按医嘱在 6 个月内复查，并结合 HPV 与阴道镜检查结果综合判断。
              </div>
            </div>
          </section>

          <section class="quick-questions">
            <button v-for="question in aiQuestions" :key="question" type="button" class="question-chip">{{ question }}</button>
          </section>

          <section class="input-bar">
            <div class="input-bar__field">输入您的问题...</div>
            <button type="button" class="input-bar__send">
              <q-icon name="send" size="18px" color="white" />
            </button>
          </section>

          <div class="disclaimer">AI 解读仅供参考，请以执业医师意见为准。</div>
        </template>

        <template v-else>
          <section class="record-hero-card">
            <div>
              <div class="section-title">张女士</div>
              <div class="record-hero-card__meta q-mt-xs">荆州市妇幼保健院 · CervixDetectAI 患者端</div>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">账户概览</div>
            <div class="stats-grid stats-grid--mine q-mt-md">
              <div class="stat-card"><span>报告总数</span><strong>12</strong></div>
              <div class="stat-card"><span>咨询记录</span><strong>8</strong></div>
              <div class="stat-card stat-card--wide"><span>最近更新</span><strong>2026-03-18</strong></div>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title section-title--small">常用功能</div>
            <div class="menu-list q-mt-md">
              <button type="button" class="menu-item" @click="goTo('records')"><span>我的健康档案</span><q-icon name="chevron_right" size="18px" /></button>
              <button type="button" class="menu-item" @click="goTo('ai')"><span>咨询记录</span><q-icon name="chevron_right" size="18px" /></button>
              <button type="button" class="menu-item"><span>通知设置</span><q-icon name="chevron_right" size="18px" /></button>
              <button type="button" class="menu-item"><span>帮助中心</span><q-icon name="chevron_right" size="18px" /></button>
            </div>
          </section>
        </template>
      </div>

      <div class="mini-shell__tabbar">
        <button type="button" class="tab-item" :class="{ 'tab-item--active': currentScreen === 'home' || currentScreen === 'report' }" @click="goTo('home')">
          <q-icon name="article" size="20px" />
          <span>报告</span>
        </button>
        <button type="button" class="tab-item" :class="{ 'tab-item--active': currentScreen === 'records' }" @click="goTo('records')">
          <q-icon name="folder_shared" size="20px" />
          <span>病例</span>
        </button>
        <button type="button" class="tab-item" :class="{ 'tab-item--active': currentScreen === 'ai' }" @click="goTo('ai')">
          <q-icon name="smart_toy" size="20px" />
          <span>AI助手</span>
        </button>
        <button type="button" class="tab-item" :class="{ 'tab-item--active': currentScreen === 'mine' }" @click="goTo('mine')">
          <q-icon name="person" size="20px" />
          <span>我的</span>
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const screens = ['home', 'report', 'records', 'ai', 'mine'] as const;
type ScreenKey = (typeof screens)[number];

const metaMap: Record<ScreenKey, { title: string; subtitle: string }> = {
  home: { title: '我的报告', subtitle: '最新结果与快捷入口' },
  report: { title: '查看完整报告', subtitle: 'AI 解读与临床建议' },
  records: { title: '查看病例档案', subtitle: '历史检查与当前病例' },
  ai: { title: '咨询 AI 助手', subtitle: '围绕当前病例进行解读' },
  mine: { title: '个人中心', subtitle: '账户信息与常用功能' },
};

const timeline = [
  { date: '2026年3月18日', title: '液基细胞学 TCT', desc: '当前结果为 LSIL 倾向，建议 6 个月内复查。' },
  { date: '2026年1月15日', title: 'HPV 16/18 复查', desc: '结果提示 HPV 阳性，建议继续随访。' },
  { date: '2025年9月10日', title: '常规筛查', desc: '未见明显异常，建立后续对比基线。' },
];

const aiQuestions = [
  '我的风险等级代表什么？',
  '接下来建议做什么检查？',
  '这次结果和上次相比有什么变化？',
  '需要马上去医院吗？',
];

const currentScreen = computed<ScreenKey>(() => {
  const raw = typeof route.params.screen === 'string' ? route.params.screen : 'home';
  return screens.includes(raw as ScreenKey) ? (raw as ScreenKey) : 'home';
});

const currentMeta = computed(() => metaMap[currentScreen.value]);

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
</script>

<style scoped lang="scss">
.mini-shell {
  width: 100%;
  max-width: 430px;
  min-height: calc(100vh - 32px);
  margin: 0 auto;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(255, 255, 255, 0.98)),
    #fff;
  border: 1px solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 32px 64px -42px rgba(15, 23, 42, 0.24);
  overflow: hidden;
}

.mini-shell__status,
.mini-shell__topbar,
.mini-shell__tabbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-shell__status {
  padding: 10px 18px 0;
  color: #64748b;
  font-size: 0.8rem;
}

.mini-shell__status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-shell__topbar {
  padding: 10px 18px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
}

.mini-shell__topbar-center {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.mini-shell__title {
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 800;
}

.mini-shell__subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.68rem;
}

.mini-shell__content {
  padding: 20px 18px 116px;
}

.mini-shell__tabbar {
  position: sticky;
  bottom: 0;
  gap: 4px;
  padding: 10px 16px 22px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid rgba(226, 232, 240, 0.92);
}

.icon-btn,
.tab-item,
.action-card,
.menu-item,
.question-chip {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #1d4ed8;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.92);
}

.icon-btn--muted {
  color: #64748b;
}

.hero-card,
.report-summary-card,
.report-detail-card,
.biomarker-card,
.content-card,
.record-hero-card,
.context-card,
.chat-bubble,
.stat-card,
.menu-item,
.input-bar,
.sticky-actions {
  border: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 28px -24px rgba(15, 23, 42, 0.1);
}

.hero-card,
.report-summary-card,
.report-detail-card,
.biomarker-card,
.content-card,
.record-hero-card,
.context-card,
.chat-bubble,
.input-bar,
.sticky-actions {
  border-radius: 20px;
  padding: 18px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.9));
}

.hero-card__eyebrow,
.section-label,
.report-block__label {
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
  color: #1d4ed8;
}

.hero-card__title,
.section-title {
  font-size: 1.26rem;
  line-height: 1.2;
  font-weight: 800;
  color: #0f172a;
}

.section-title--small {
  font-size: 1rem;
}

.hero-card__desc,
.body-copy,
.record-hero-card__meta,
.summary-note,
.action-card__desc,
.disclaimer {
  color: #64748b;
  line-height: 1.7;
}

.report-summary-card__header,
.report-summary-card__main,
.summary-badges,
.sticky-actions,
.info-row,
.record-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  font-size: 0.8rem;
  color: #64748b;
}

.metric-value,
.report-detail-card__headline {
  font-size: 1.7rem;
  line-height: 1.08;
  font-weight: 800;
  color: #0f172a;
}

.metric-value--teal {
  color: #0f766e;
}

.report-detail-card__sub {
  color: #475569;
  line-height: 1.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stats-grid--mine {
  margin-top: 0;
}

.stat-card {
  padding: 16px;
  border-radius: 18px;
}

.stat-card--wide {
  grid-column: 1 / -1;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 0.76rem;
}

.stat-card strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 1.05rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.action-card,
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  text-align: left;
  border-radius: 18px;
}

.action-card__icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.08);
}

.action-card__icon--teal {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.08);
}

.action-card__icon--light {
  color: #fff;
  background: rgba(255,255,255,0.12);
}

.action-card__title {
  font-weight: 700;
  color: #0f172a;
}

.action-card--primary {
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 14px 24px -20px rgba(37, 99, 235, 0.34);
}

.action-card--primary .action-card__title,
.action-card--primary .action-card__desc {
  color: #fff;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row span {
  color: #64748b;
}

.info-row strong {
  color: #0f172a;
}

.advice-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.8;
}

.report-block {
  padding: 14px 0;
  border-top: 1px solid rgba(226, 232, 240, 0.84);
}

.report-block:first-of-type {
  border-top: 0;
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: rgba(203, 213, 225, 0.9);
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 14px;
}

.timeline-item__dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 999px;
  background: #1d4ed8;
  box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.1);
  z-index: 1;
}

.timeline-item__content {
  flex: 1;
  padding: 0 0 14px;
}

.timeline-item__date {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 700;
}

.timeline-item__title {
  margin-top: 4px;
  color: #0f172a;
  font-weight: 700;
}

.timeline-item__desc {
  margin-top: 6px;
  color: #64748b;
  line-height: 1.7;
}

.chat-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.chat-bubble {
  max-width: 90%;
}

.chat-bubble--user {
  align-self: flex-end;
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
}

.chat-bubble--assistant {
  align-self: flex-start;
}

.chat-bubble__role {
  margin-bottom: 8px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
}

.chat-bubble__text {
  line-height: 1.8;
  color: inherit;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.question-chip {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(226,232,240,0.88);
  color: #475569;
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.input-bar__field {
  flex: 1;
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 16px;
  background: rgba(248,250,252,0.96);
  color: #94a3b8;
}

.input-bar__send {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 0;
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
}

.disclaimer {
  margin-top: 14px;
  font-size: 0.72rem;
  text-align: center;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  justify-content: space-between;
  margin-bottom: 10px;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 50px;
  color: #94a3b8;
  border-radius: 14px;
}

.tab-item span {
  font-size: 10px;
  font-weight: 600;
}

.tab-item--active {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.06);
}

@media (max-width: 480px) {
  .patient-mini-page {
    padding: 12px !important;
  }

  .mini-shell {
    min-height: calc(100vh - 24px);
    border-radius: 22px;
  }

  .mini-shell__content {
    padding: 18px 14px 112px;
  }
}
</style>
