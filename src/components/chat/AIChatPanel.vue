<template>
  <div class="ai-chat-panel" :class="{ 'is-open': modelValue }">
    <transition name="chat-slide">
      <div v-if="modelValue" class="chat-window">
        <!-- 标题栏 -->
        <div class="chat-header">
          <div class="header-left">
            <div class="header-avatar">
              <img :src="aiAvatar" alt="AI" class="avatar-img" />
              <span class="avatar-pulse" />
            </div>
            <div class="header-info">
              <div class="header-title-row">
                <div class="header-title">AI 辅助医疗助手</div>
                <q-badge color="positive" rounded class="free-badge">
                  <q-icon name="local_offer" size="10px" class="q-mr-xs" />
                  限时免费
                </q-badge>
              </div>
              <div class="header-subtitle">基于当前分析结果提供解读建议</div>
            </div>
          </div>
          <div class="header-center">
            <div class="mode-pill" :class="{ 'is-thinking': enableThinking }">
              <q-icon :name="enableThinking ? 'psychology' : 'flash_on'" size="14px" />
              <span>{{ enableThinking ? '深度思考模式' : '快速回复模式' }}</span>
            </div>
          </div>
          <div class="header-actions">
            <!-- 原深度思考按钮已移至底部 -->
            <q-btn
              flat
              round
              dense
              icon="close"
              size="sm"
              class="close-btn"
              @click="$emit('update:modelValue', false)"
            />
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="messagesContainer" class="chat-messages">
          <!-- 欢迎卡片 -->
          <div v-if="messages.length === 0" class="welcome-card">
            <div class="welcome-icon">
              <img :src="aiAvatar" alt="AI" class="welcome-avatar" />
            </div>
            <div class="welcome-title">您好，我是 AI 医疗助手</div>
            <div class="welcome-desc">
              基于当前分析结果，我可以帮您解读诊断结论、生物标志物、风险评估等。
            </div>
            <div class="welcome-chips">
              <q-chip
                v-for="q in quickQuestions"
                :key="q"
                clickable
                outline
                dense
                color="primary"
                text-color="primary"
                class="quick-chip"
                @click="askQuick(q)"
              >
                {{ q }}
              </q-chip>
            </div>
          </div>

          <!-- 对话消息 -->
          <template v-for="(msg, index) in messages" :key="index">
            <!-- 用户气泡 -->
            <div v-if="msg.role === 'user'" class="msg-row msg-user">
              <div class="bubble bubble-user">
                <div class="bubble-text">{{ msg.content }}</div>
              </div>
              <div class="bubble-avatar user-avatar">
                <img
                  v-if="authStore.user?.avatar_url"
                  :src="authStore.user.avatar_url"
                  alt="User"
                />
                <q-icon v-else name="person" size="18px" />
              </div>
            </div>

            <!-- AI 气泡 -->
            <div
              v-else-if="!(isLoading && currentPhase === 'reasoning' && index === messages.length - 1)"
              class="msg-row msg-ai"
            >
              <div class="bubble-avatar ai-avatar">
                <img :src="aiAvatar" alt="AI" />
              </div>
              <div class="bubble-wrapper">
                <!-- 深度思考流式展示 -->
                <div
                  v-if="msg.reasoning"
                  class="reasoning-block"
                  :class="{
                    'is-streaming':
                      isLoading && index === messages.length - 1 && currentPhase === 'reasoning',
                  }"
                >
                  <div class="reasoning-shimmer" />
                  <div class="reasoning-header" @click="toggleReasoning(index)">
                    <div class="reasoning-header-left">
                      <span class="reasoning-icon-wrapper">
                        <q-icon name="psychology" size="16px" />
                      </span>
                      <span class="reasoning-tag">深度思考过程</span>
                      <span class="reasoning-count">
                        <span class="reasoning-count-value">{{ msg.reasoning.length }}</span>
                        <span class="reasoning-count-unit">字</span>
                      </span>
                    </div>
                    <q-icon
                      :name="expandedReasoning.has(index) ? 'expand_less' : 'expand_more'"
                      size="18px"
                      class="reasoning-toggle-icon"
                    />
                  </div>
                  <transition name="reasoning-expand">
                    <div v-show="expandedReasoning.has(index)" class="reasoning-content">
                      {{ msg.reasoning }}
                      <span
                        v-if="
                          isLoading && index === messages.length - 1 && currentPhase === 'reasoning'
                        "
                        class="typing-cursor"
                      />
                    </div>
                  </transition>
                </div>

                <!-- 正式回复 -->
                <div class="bubble bubble-ai">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    v-if="msg.content"
                    class="markdown-body"
                    v-html="renderMarkdown(msg.content)"
                  />
                  <div v-else class="bubble-placeholder">
                    <q-spinner-dots size="1.6em" color="primary" />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 正在深思的流式卡片 -->
          <div v-if="isLoading && currentPhase === 'reasoning'" class="msg-row msg-ai">
            <div class="bubble-avatar ai-avatar">
              <img :src="aiAvatar" alt="AI" />
            </div>
            <div class="bubble-wrapper">
              <div class="reasoning-block is-streaming">
                <div class="reasoning-shimmer" />
                <div class="reasoning-progress-bar" />
                <div class="reasoning-header">
                  <div class="reasoning-header-left">
                    <span class="reasoning-icon-wrapper is-active">
                      <q-icon name="psychology" size="16px" />
                    </span>
                    <span class="reasoning-tag">正在深度思考</span>
                    <span class="reasoning-count">
                      <q-spinner-dots size="12px" class="q-mr-xs reasoning-spinner" />
                      <span class="reasoning-count-value">{{ currentReasoningText.length }}</span>
                      <span class="reasoning-count-unit">字</span>
                    </span>
                  </div>
                </div>
                <div ref="streamingReasoningContent" class="reasoning-content">
                  {{ currentReasoningText }}
                  <span class="typing-cursor" />
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="input-controls">
            <div class="thinking-toggle-row" @click="enableThinking = !enableThinking">
              <q-toggle
                v-model="enableThinking"
                class="thinking-toggle q-mr-xs"
                color="primary"
                keep-color
                dense
                size="sm"
              />
              <q-icon
                :name="enableThinking ? 'psychology' : 'flash_on'"
                :color="enableThinking ? 'amber-8' : 'grey-5'"
                size="16px"
                class="q-mr-xs"
              />
              <span class="toggle-label">
                {{ enableThinking ? '深度思考已开启' : '快速回复模式' }}
              </span>
            </div>
            <span class="input-hint" :class="{ 'is-thinking': enableThinking }">
              <q-icon :name="enableThinking ? 'auto_awesome' : 'flash_on'" size="12px" />
              <span>{{ enableThinking ? '优先完整推理' : '优先响应速度' }}</span>
            </span>
          </div>
          <div class="input-wrapper">
            <q-input
              v-model="inputText"
              dense
              borderless
              placeholder="输入您的问题..."
              class="input-field"
              @keydown.enter.prevent="sendMessage"
              :disable="isLoading"
              autogrow
              :input-style="{ maxHeight: '80px' }"
            />
            <q-btn
              round
              flat
              dense
              :icon="isLoading ? 'stop' : 'send'"
              :disable="!isLoading && !inputText.trim()"
              @click="isLoading ? stopResponse() : sendMessage()"
              :class="['send-btn', { 'is-stop': isLoading }]"
            />
          </div>
          <div class="chat-disclaimer">
            <q-icon name="info_outline" size="12px" class="q-mr-xs" />
            AI 辅助分析仅供参考，最终诊断请咨询专业医生
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { sendChatMessage, type ChatMessage } from 'src/services/chatService';
import { useAuthStore } from 'src/stores/authStore';

interface Props {
  modelValue: boolean;
  studyId: number | null;
}

const props = defineProps<Props>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const authStore = useAuthStore();
const aiAvatar = '/logo.svg';

const quickQuestions = ['诊断结论解读', '风险评估分析', '后续建议'];

const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const isLoading = ref(false);
const enableThinking = ref(false); // 默认关闭深度思考以追求更快的常规响应
const currentPhase = ref<'reasoning' | 'content'>('reasoning');
const currentReasoningText = ref('');
const expandedReasoning = ref<Set<number>>(new Set());
const messagesContainer = ref<HTMLElement>();
const streamingReasoningContent = ref<HTMLElement>();
const activeAssistantIndex = ref<number | null>(null);
let currentController: AbortController | null = null;

/** 切换深度思考过程的展开/折叠 */
function toggleReasoning(index: number) {
  const s = new Set(expandedReasoning.value);
  if (s.has(index)) s.delete(index);
  else s.add(index);
  expandedReasoning.value = s;
}

marked.setOptions({ breaks: true, gfm: true });

/** 渲染 Markdown 为安全的 HTML */
function renderMarkdown(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(marked.parse(text) as string);
}

/** 滚动到底部 */
function scrollToBottom() {
  void nextTick(() => {
    const container = messagesContainer.value;
    if (container) container.scrollTop = container.scrollHeight;
  });
}

/** 深度思考流式卡片滚动到底部 */
function scrollStreamingReasoningToBottom() {
  void nextTick(() => {
    const container = streamingReasoningContent.value;
    if (container) container.scrollTop = container.scrollHeight;
  });
}

/** 快捷提问 */
function askQuick(question: string) {
  inputText.value = question;
  sendMessage();
}

/** 中断当前 AI 回复 */
function stopResponse() {
  if (!isLoading.value) return;

  currentController?.abort();
  currentController = null;

  const idx = activeAssistantIndex.value;
  const aiMsg = idx !== null ? messages.value[idx] : null;

  isLoading.value = false;
  currentPhase.value = 'content';
  currentReasoningText.value = '';
  activeAssistantIndex.value = null;

  if (aiMsg && idx !== null) {
    if (!aiMsg.content) aiMsg.content = '⏹️ 已停止生成';
    if (!aiMsg.reasoning) delete aiMsg.reasoning;
    if (aiMsg.reasoning) {
      const s = new Set(expandedReasoning.value);
      s.add(idx);
      expandedReasoning.value = s;
    }
  }

  scrollToBottom();
}

/** 发送消息 */
function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  isLoading.value = true;
  currentPhase.value = enableThinking.value ? 'reasoning' : 'content';
  currentReasoningText.value = '';
  scrollToBottom();

  const aiMsgIndex =
    messages.value.push({ role: 'assistant', content: '', reasoning: '' }) - 1;
  activeAssistantIndex.value = aiMsgIndex;
  scrollToBottom();
  scrollStreamingReasoningToBottom();

  const history = messages.value.slice(0, -2);

  currentController = sendChatMessage(
    props.studyId,
    text,
    history,
    enableThinking.value,
    (chunk: string, type: 'reasoning' | 'content' | 'error') => {
      const aiMsg = messages.value[aiMsgIndex];
      if (!aiMsg) return;

      if (type === 'reasoning') {
        aiMsg.reasoning = (aiMsg.reasoning || '') + chunk;
        currentReasoningText.value = aiMsg.reasoning || '';
        scrollStreamingReasoningToBottom();
      } else if (type === 'content') {
        currentPhase.value = 'content';
        aiMsg.content += chunk;
      }
      scrollToBottom();
    },
    () => {
      const aiMsg = messages.value[aiMsgIndex];

      isLoading.value = false;
      currentController = null;
      currentPhase.value = 'content';
      currentReasoningText.value = '';
      activeAssistantIndex.value = null;
      if (aiMsg) {
        if (!aiMsg.content) aiMsg.content = '抱歉，暂时无法生成回复，请稍后重试。';
        if (!aiMsg.reasoning) delete aiMsg.reasoning;
        // 流结束后自动展开最后一条消息的思考过程
        if (aiMsg.reasoning) {
          const s = new Set(expandedReasoning.value);
          s.add(aiMsgIndex);
          expandedReasoning.value = s;
        }
      }
      scrollToBottom();
    },
    (error: string) => {
      const aiMsg = messages.value[aiMsgIndex];

      isLoading.value = false;
      currentController = null;
      currentPhase.value = 'content';
      activeAssistantIndex.value = null;
      if (aiMsg) aiMsg.content = `⚠️ ${error}`;
      scrollToBottom();
    },
  );
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) scrollToBottom();
  },
);

onUnmounted(() => {
  currentController?.abort();
});
</script>

<style scoped lang="scss">
/* ============ 面板容器与主题变量（浅色默认） ============ */
.ai-chat-panel {
  --chat-panel-bg: var(--app-glass-bg-light);
  --chat-panel-border: var(--app-glass-border-light);
  --chat-panel-shadow:
    0 24px 56px -18px rgba(15, 23, 42, 0.28),
    0 10px 26px -12px rgba(30, 58, 138, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  --chat-radius-panel: var(--app-radius-xl);
  --chat-radius-card: var(--app-radius-lg);
  --chat-radius-control: var(--app-radius-md);
  --chat-radius-soft: var(--app-radius-sm);
  --chat-panel-overlay: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 58%, #f8fafc 100%);

  --chat-header-bg: #1976d2;
  --chat-header-border: rgba(255, 255, 255, 0.24);
  --chat-header-title: #ffffff;
  --chat-header-subtitle: rgba(255, 255, 255, 0.84);
  --chat-header-action: rgba(255, 255, 255, 0.84);
  --chat-header-action-hover: #ffffff;
  --chat-header-action-hover-bg: rgba(255, 255, 255, 0.14);
  --chat-avatar-bg: rgba(255, 255, 255, 0.18);
  --chat-avatar-pulse-border: #1976d2;
  --chat-badge-bg: #22c55e;
  --chat-badge-color: #f0fdf4;
  --chat-mode-pill-bg: rgba(255, 255, 255, 0.12);
  --chat-mode-pill-border: rgba(255, 255, 255, 0.3);
  --chat-mode-pill-color: #eef6ff;
  --chat-mode-pill-active-bg: rgba(255, 255, 255, 0.24);
  --chat-mode-pill-active-border: rgba(255, 255, 255, 0.44);
  --chat-mode-pill-active-color: #ffffff;

  --chat-scrollbar: rgba(100, 116, 139, 0.26);
  --chat-scrollbar-hover: rgba(71, 85, 105, 0.42);
  --chat-welcome-icon-bg: #ffffff;
  --chat-welcome-icon-shadow: 0 10px 24px rgba(148, 163, 184, 0.18);
  --chat-avatar-shadow: var(--app-shadow-sm);
  --chat-chip-shadow: var(--app-shadow-sm);
  --chat-avatar-ai-shadow: var(--app-shadow-sm);
  --chat-welcome-title: #15324f;
  --chat-welcome-desc: #607289;
  --chat-chip-bg: #ffffff;
  --chat-chip-border: #cedded;
  --chat-chip-text: #205188;
  --chat-chip-hover-text: #1d4ed8;
  --chat-chip-hover-border: #3b82f6;
  --chat-chip-hover-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);

  --chat-avatar-ai-bg: #ffffff;
  --chat-avatar-ai-border: #dce7f4;
  --chat-avatar-user-bg: #eaf2fb;
  --chat-avatar-user-color: #5f7288;
  --chat-ai-bubble-bg: #ffffff;
  --chat-ai-bubble-border: #dfe8f3;
  --chat-ai-bubble-text: #253c54;
  --chat-user-bubble-bg: #cae6ff;
  --chat-user-bubble-text: #0a436b;
  --chat-user-bubble-border: #9ecbf5;
  --chat-bubble-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);

  --chat-reasoning-bg: linear-gradient(135deg, #fef7e7 0%, #fffdf4 100%);
  --chat-reasoning-border: #f1d59e;
  --chat-reasoning-stream-border: #f0b55f;
  --chat-reasoning-stream-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.12),
    0 10px 20px -8px rgba(245, 158, 11, 0.2);
  --chat-reasoning-header-hover: rgba(245, 158, 11, 0.08);
  --chat-reasoning-icon-bg: rgba(245, 158, 11, 0.14);
  --chat-reasoning-icon-color: #b45309;
  --chat-reasoning-tag: #92400e;
  --chat-reasoning-count-bg: rgba(245, 158, 11, 0.12);
  --chat-reasoning-count: #b45309;
  --chat-reasoning-content: #7b3f13;
  --chat-reasoning-divider: rgba(245, 158, 11, 0.24);
  --chat-reasoning-scroll: rgba(245, 158, 11, 0.28);
  --chat-reasoning-shimmer: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.34) 45%,
    rgba(255, 255, 255, 0) 90%
  );
  --chat-reasoning-progress: linear-gradient(90deg, #fbbf24 0%, #f59e0b 45%, #fbbf24 100%);
  --chat-typing-cursor: #f59e0b;

  --chat-input-bg: rgba(245, 249, 255, 0.94);
  --chat-input-border: #dbe7f6;
  --chat-input-wrapper-bg: #ffffff;
  --chat-input-wrapper-border: #ceddf0;
  --chat-input-wrapper-shadow: 0 3px 10px rgba(148, 163, 184, 0.12);
  --chat-input-focus-border: #6ba6ec;
  --chat-input-focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.16);
  --chat-input-text: #1e2f45;
  --chat-input-placeholder: #8da3bc;
  --chat-toggle-label: #3f6288;
  --chat-toggle-hint: #7f93ab;
  --chat-hint-bg: #f0f6ff;
  --chat-hint-border: #d3e3f5;
  --chat-hint-text: #547192;
  --chat-hint-icon: #6484aa;
  --chat-hint-active-bg: #e4f1ff;
  --chat-hint-active-border: #b7d6f5;
  --chat-hint-active-text: #145f9f;
  --chat-hint-active-icon: #1976d2;
  --chat-send-bg: #2f83e8;
  --chat-send-hover: #1f6fce;
  --chat-send-shadow: 0 6px 16px rgba(47, 131, 232, 0.26);
  --chat-stop-bg: #ef4444;
  --chat-stop-hover: #d63232;
  --chat-stop-shadow: 0 6px 16px rgba(239, 68, 68, 0.26);
  --chat-send-disabled-bg: #d8e2ef;
  --chat-send-disabled-text: #9aadc3;
  --chat-disclaimer: #7f92a8;

  --chat-md-heading: #0f2f4d;
  --chat-md-code-bg: #eef3fb;
  --chat-md-code-text: #1e63b6;
  --chat-md-pre-bg: #f7faff;
  --chat-md-pre-border: #dce6f3;
  --chat-md-pre-text: #2d455f;
  --chat-md-quote-border: #3b82f6;
  --chat-md-quote-bg: #f0f7ff;
  --chat-md-quote-text: #5e7490;
  --chat-md-hr: #dfe8f2;
  --chat-md-table-border: #d9e4f1;
  --chat-md-table-head-bg: #edf4ff;
  --chat-md-table-head-text: #245995;
  --chat-md-table-even-bg: rgba(80, 132, 204, 0.04);

  position: fixed;
  bottom: 90px;
  right: 24px;
  z-index: 6000;
}

/* ============ 窗口 ============ */
.chat-window {
  width: 520px;
  max-width: calc(100vw - 32px);
  height: 680px;
  max-height: calc(100vh - 120px);
  border-radius: var(--chat-radius-panel);
  border: 1px solid var(--chat-panel-border);
  box-shadow: var(--chat-panel-shadow);
  background: var(--chat-panel-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-lg));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-lg));

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--chat-panel-overlay);
    z-index: 0;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* ============ 清爽标题栏 ============ */
.chat-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--chat-header-bg);
  border-bottom: 1px solid var(--chat-header-border);

  .header-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: var(--chat-radius-control);
    background: var(--chat-avatar-bg);
    box-shadow: var(--chat-avatar-shadow);
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .avatar-pulse {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid var(--chat-avatar-pulse-border);
    }
  }

  .header-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.1px;
    color: var(--chat-header-title);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-subtitle {
    font-size: 12px;
    color: var(--chat-header-subtitle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .free-badge {
    flex-shrink: 0;
    font-size: 10px;
    padding: 2px 6px;
    background: var(--chat-badge-bg) !important;
    color: var(--chat-badge-color) !important;
  }

  .header-center {
    justify-self: center;
  }

  .mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--chat-mode-pill-border);
    background: var(--chat-mode-pill-bg);
    color: var(--chat-mode-pill-color);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;

    &.is-thinking {
      background: var(--chat-mode-pill-active-bg);
      border-color: var(--chat-mode-pill-active-border);
      color: var(--chat-mode-pill-active-color);
    }
  }

  .header-actions {
    justify-self: end;
    display: flex;
    align-items: center;

    .q-btn {
      color: var(--chat-header-action) !important;
      background: transparent;
      transition: all 0.2s ease;

      &:hover {
        color: var(--chat-header-action-hover) !important;
        background: var(--chat-header-action-hover-bg);
      }
    }
  }
}

/* ============ 消息区域 ============ */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 18px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--chat-scrollbar);
    border-radius: 3px;

    &:hover {
      background: var(--chat-scrollbar-hover);
    }
  }
}

/* ============ 欢迎卡片 ============ */
.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 36px 20px;
  animation: fadeInUp 0.35s ease-out;

  .welcome-icon {
    margin-bottom: 16px;
    width: 72px;
    height: 72px;
    background: var(--chat-welcome-icon-bg);
    border-radius: var(--chat-radius-panel);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--chat-welcome-icon-shadow);

    .welcome-avatar {
      width: 48px;
      height: 48px;
    }
  }

  .welcome-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--chat-welcome-title);
    margin-bottom: 10px;
  }

  .welcome-desc {
    font-size: 14px;
    color: var(--chat-welcome-desc);
    line-height: 1.65;
    max-width: 390px;
    margin-bottom: 22px;
  }

  .welcome-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;

    .quick-chip {
      font-size: 13px;
      padding: 12px 16px;
      background: var(--chat-chip-bg) !important;
      border: 1px solid var(--chat-chip-border) !important;
      color: var(--chat-chip-text) !important;
      border-radius: var(--chat-radius-panel);
      transition: all 0.22s ease;
      box-shadow: var(--chat-chip-shadow);

      &:hover {
        transform: translateY(-1px);
        border-color: var(--chat-chip-hover-border) !important;
        color: var(--chat-chip-hover-text) !important;
        box-shadow: var(--chat-chip-hover-shadow);
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ============ 消息行 ============ */
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  animation: msgSlide 0.24s cubic-bezier(0.2, 0, 0, 1);

  &.msg-user {
    justify-content: flex-end;
  }

  &.msg-ai {
    justify-content: flex-start;
  }
}

@keyframes msgSlide {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ============ 气泡头像 ============ */
.bubble-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--chat-radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &.ai-avatar {
    background: var(--chat-avatar-ai-bg);
    box-shadow: var(--chat-avatar-ai-shadow);
    border: 1px solid var(--chat-avatar-ai-border);
    padding: 6px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &.user-avatar {
    background: var(--chat-avatar-user-bg);
    color: var(--chat-avatar-user-color);
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

/* ============ 气泡体 ============ */
.bubble-wrapper {
  max-width: calc(100% - 56px);
  min-width: 80px;
}

.bubble {
  padding: 13px 16px;
  border-radius: var(--chat-radius-card);
  max-width: 100%;
  word-break: break-word;
  line-height: 1.66;
  font-size: 14px;
  border: 1px solid transparent;

  &.bubble-user {
    background: var(--chat-user-bubble-bg);
    color: var(--chat-user-bubble-text);
    border-color: var(--chat-user-bubble-border);
    border-bottom-right-radius: var(--chat-radius-soft);
    max-width: calc(100% - 52px);
  }

  &.bubble-ai {
    background: var(--chat-ai-bubble-bg);
    color: var(--chat-ai-bubble-text);
    border-bottom-left-radius: var(--chat-radius-soft);
    box-shadow: var(--chat-bubble-shadow);
    border: 1px solid var(--chat-ai-bubble-border);
  }
}

/* ============ 深度思考流式卡片 ============ */
.reasoning-block {
  margin-bottom: 10px;
  border-radius: var(--chat-radius-control);
  overflow: hidden;
  background: var(--chat-reasoning-bg);
  border: 1px solid var(--chat-reasoning-border);
  transition: all 0.28s ease;
  position: relative;

  .reasoning-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background: var(--chat-reasoning-shimmer);
    background-size: 220% 100%;
  }

  .reasoning-progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    opacity: 0;
    background: var(--chat-reasoning-progress);
    background-size: 180% 100%;
  }

  &.is-streaming {
    border-color: var(--chat-reasoning-stream-border);
    box-shadow: var(--chat-reasoning-stream-shadow);
    animation: reasoningGlow 2s ease-in-out infinite;

    .reasoning-shimmer {
      opacity: 1;
      animation: shimmerMove 2.2s linear infinite;
    }

    .reasoning-progress-bar {
      opacity: 1;
      animation: progressRun 1.8s linear infinite;
    }
  }

  .reasoning-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease;

    &:hover {
      background: var(--chat-reasoning-header-hover);
    }
  }

  .reasoning-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reasoning-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    color: var(--chat-reasoning-icon-color);
    background: var(--chat-reasoning-icon-bg);
    flex-shrink: 0;

    &.is-active {
      animation: iconPulse 1.4s ease-in-out infinite;
    }
  }

  .reasoning-tag {
    font-size: 13px;
    font-weight: 700;
    color: var(--chat-reasoning-tag);
  }

  .reasoning-count {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    color: var(--chat-reasoning-count);
    background: var(--chat-reasoning-count-bg);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .reasoning-count-unit {
    margin-left: 2px;
  }

  .reasoning-count-value {
    display: inline-block;
    min-width: 4ch;
    text-align: right;
  }

  .reasoning-spinner {
    color: var(--chat-reasoning-icon-color);
  }

  .reasoning-toggle-icon {
    color: var(--chat-reasoning-icon-color);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .reasoning-content {
    padding: 12px 14px 14px;
    font-size: 13px;
    line-height: 1.72;
    color: var(--chat-reasoning-content);
    white-space: pre-wrap;
    max-height: 240px;
    overflow-y: auto;
    border-top: 1px dashed var(--chat-reasoning-divider);

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--chat-reasoning-scroll);
      border-radius: 3px;
    }
  }

  .reasoning-icon-spin {
    animation: iconPulse 1.5s ease-in-out infinite;
  }
}

.reasoning-expand-enter-active,
.reasoning-expand-leave-active {
  transition:
    max-height 0.22s ease,
    opacity 0.18s ease,
    padding-top 0.22s ease;
  overflow: hidden;
}

.reasoning-expand-enter-from,
.reasoning-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
}

.reasoning-expand-enter-to,
.reasoning-expand-leave-from {
  max-height: 240px;
  opacity: 1;
}

/* 打字机光标 */
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--chat-typing-cursor);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursorBlink 1s step-end infinite;
}

@keyframes cursorBlink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@keyframes reasoningGlow {
  0%,
  100% {
    box-shadow: var(--chat-reasoning-stream-shadow);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(245, 158, 11, 0.18),
      0 12px 22px -8px rgba(245, 158, 11, 0.26);
  }
}

@keyframes shimmerMove {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -20% 0;
  }
}

@keyframes progressRun {
  from {
    background-position: 0% 0;
  }
  to {
    background-position: 180% 0;
  }
}

@keyframes iconPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.58;
  }
}

/* ============ Markdown 渲染 ============ */
.markdown-body {
  :deep(p) {
    margin: 8px 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
    margin: 8px 0;
  }
  :deep(li) {
    margin: 4px 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 16px 0 8px;
    font-weight: 700;
    color: var(--chat-md-heading);
    line-height: 1.35;
  }
  :deep(h1) {
    font-size: 18px;
  }
  :deep(h2) {
    font-size: 16px;
  }
  :deep(h3) {
    font-size: 15px;
  }
  :deep(h4) {
    font-size: 15px;
  }

  :deep(code) {
    background: var(--chat-md-code-bg);
    color: var(--chat-md-code-text);
    padding: 2px 6px;
    border-radius: var(--chat-radius-soft);
    font-size: 13px;
    font-family: inherit;
  }

  :deep(pre) {
    background: var(--chat-md-pre-bg);
    border: 1px solid var(--chat-md-pre-border);
    color: var(--chat-md-pre-text);
    padding: 12px 16px;
    border-radius: var(--chat-radius-md);
    overflow-x: auto;
    margin: 12px 0;
    font-size: 13px;

    code {
      background: none;
      color: inherit;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid var(--chat-md-quote-border);
    padding: 6px 16px;
    margin: 12px 0;
    color: var(--chat-md-quote-text);
    background: var(--chat-md-quote-bg);
    border-radius: 0 var(--chat-radius-soft) var(--chat-radius-soft) 0;
  }

  :deep(strong) {
    font-weight: 700;
    color: var(--chat-md-heading);
  }

  :deep(hr) {
    border: none;
    height: 1px;
    background: var(--chat-md-hr);
    margin: 16px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;

    th,
    td {
      border: 1px solid var(--chat-md-table-border);
      padding: 8px 10px;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: var(--chat-md-table-head-bg);
      color: var(--chat-md-table-head-text);
      font-weight: 700;
    }

    tr:nth-child(even) td {
      background: var(--chat-md-table-even-bg);
    }
  }
}

/* ============ 输入区域 ============ */
.chat-input-area {
  padding: 14px 18px 18px;
  background: var(--chat-input-bg);
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  border-top: 1px solid var(--chat-input-border);

  .input-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 12px;
  }

  .thinking-toggle-row {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    min-height: 28px;
  }

  .toggle-label {
    font-size: 12px;
    color: var(--chat-toggle-label);
    font-weight: 600;
  }

  .input-hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--chat-hint-border);
    background: var(--chat-hint-bg);
    color: var(--chat-hint-text);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    transition: all 0.2s ease;

    :deep(.q-icon) {
      color: var(--chat-hint-icon);
    }

    &.is-thinking {
      background: var(--chat-hint-active-bg);
      border-color: var(--chat-hint-active-border);
      color: var(--chat-hint-active-text);

      :deep(.q-icon) {
        color: var(--chat-hint-active-icon);
      }
    }
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: var(--chat-input-wrapper-bg);
    border-radius: var(--chat-radius-panel);
    padding: 8px 10px 8px 14px;
    border: 1px solid var(--chat-input-wrapper-border);
    box-shadow: var(--chat-input-wrapper-shadow);
    transition: all 0.2s ease;

    &:focus-within {
      border-color: var(--chat-input-focus-border);
      box-shadow: var(--chat-input-focus-ring);
    }
  }

  .input-field {
    flex: 1;

    :deep(.q-field__control) {
      background: transparent !important;
    }

    :deep(.q-field__native) {
      font-size: 15px;
      padding: 6px 0;
      color: var(--chat-input-text);

      &::placeholder {
        color: var(--chat-input-placeholder);
      }
    }

    :deep(.q-field__control::before),
    :deep(.q-field__control::after) {
      display: none;
    }
  }

  .send-btn {
    background: var(--chat-send-bg);
    color: white !important;
    width: 36px;
    height: 36px;
    border-radius: var(--chat-radius-panel);
    transition: all 0.2s ease;
    margin-bottom: 2px;

    &[disabled] {
      background: var(--chat-send-disabled-bg);
      color: var(--chat-send-disabled-text) !important;
      box-shadow: none;
    }

    &:not([disabled]):hover {
      background: var(--chat-send-hover);
      transform: translateY(-1px);
      box-shadow: var(--chat-send-shadow);
    }

    &.is-stop {
      background: var(--chat-stop-bg);
    }

    &.is-stop:not([disabled]):hover {
      background: var(--chat-stop-hover);
      box-shadow: var(--chat-stop-shadow);
    }
  }
}

.chat-disclaimer {
  font-size: 12px;
  color: var(--chat-disclaimer);
  text-align: center;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============ 面板动画 ============ */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s var(--app-motion-ease-emphasized);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(22px) scale(0.97);
}

@media (max-width: 768px) {
  .ai-chat-panel {
    right: 12px;
    left: 12px;
    bottom: 76px;
  }

  .chat-window {
    width: auto;
    max-width: 100%;
    height: min(75vh, 680px);
  }

  .chat-header {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'left actions'
      'center center';
    row-gap: 10px;

    .header-left {
      grid-area: left;
    }

    .header-center {
      grid-area: center;
      justify-self: start;
    }

    .header-actions {
      grid-area: actions;
    }
  }

  .chat-messages {
    padding: 16px 14px;
  }

  .chat-input-area {
    padding: 12px 14px 14px;

    .input-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .input-hint {
      margin-left: 0;
    }
  }
}
</style>

<style lang="scss">
/* ============ 暗色模式 ============ */
body.body--dark .ai-chat-panel {
  --chat-panel-bg: var(--app-glass-bg-dark);
  --chat-panel-border: var(--app-glass-border-dark);
  --chat-panel-shadow:
    0 26px 58px -18px rgba(2, 6, 23, 0.66),
    0 10px 24px -12px rgba(2, 6, 23, 0.5),
    0 0 0 1px rgba(148, 163, 184, 0.08) inset;
  --chat-panel-overlay: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.66) 0%,
    rgba(17, 24, 39, 0.78) 100%
  );

  --chat-header-bg: linear-gradient(100deg, rgba(16, 30, 52, 0.95) 0%, rgba(15, 23, 42, 0.92) 100%);
  --chat-header-border: rgba(148, 163, 184, 0.18);
  --chat-header-title: #f8fafc;
  --chat-header-subtitle: #9fb4cb;
  --chat-header-action: #9fb4cb;
  --chat-header-action-hover: #f8fafc;
  --chat-header-action-hover-bg: rgba(148, 163, 184, 0.16);
  --chat-avatar-bg: rgba(36, 69, 112, 0.34);
  --chat-avatar-pulse-border: #1e293b;
  --chat-badge-bg: #16a34a;
  --chat-badge-color: #dcfce7;
  --chat-mode-pill-bg: rgba(51, 65, 85, 0.82);
  --chat-mode-pill-border: rgba(148, 163, 184, 0.32);
  --chat-mode-pill-color: #c8d9eb;
  --chat-mode-pill-active-bg: rgba(12, 74, 110, 0.56);
  --chat-mode-pill-active-border: rgba(56, 189, 248, 0.4);
  --chat-mode-pill-active-color: #9ce6ff;

  --chat-scrollbar: rgba(148, 163, 184, 0.3);
  --chat-scrollbar-hover: rgba(203, 213, 225, 0.45);
  --chat-welcome-icon-bg: #0f172a;
  --chat-welcome-icon-shadow: 0 10px 24px rgba(2, 6, 23, 0.45);
  --chat-avatar-shadow: var(--app-shadow-sm);
  --chat-chip-shadow: var(--app-shadow-sm);
  --chat-avatar-ai-shadow: var(--app-shadow-sm);
  --chat-welcome-title: #e2e8f0;
  --chat-welcome-desc: #9eb0c4;
  --chat-chip-bg: rgba(30, 41, 59, 0.92);
  --chat-chip-border: #334155;
  --chat-chip-text: #cbd5e1;
  --chat-chip-hover-text: #93c5fd;
  --chat-chip-hover-border: #3b82f6;
  --chat-chip-hover-shadow: 0 6px 16px rgba(30, 64, 115, 0.26);

  --chat-avatar-ai-bg: #0f172a;
  --chat-avatar-ai-border: rgba(148, 163, 184, 0.22);
  --chat-avatar-user-bg: #334155;
  --chat-avatar-user-color: #e2e8f0;
  --chat-ai-bubble-bg: #1e293b;
  --chat-ai-bubble-border: rgba(148, 163, 184, 0.2);
  --chat-ai-bubble-text: #e2e8f0;
  --chat-user-bubble-bg: #1d4f8f;
  --chat-user-bubble-text: #eff6ff;
  --chat-user-bubble-border: #2563eb;
  --chat-bubble-shadow: 0 10px 24px rgba(2, 6, 23, 0.3);

  --chat-reasoning-bg: rgba(120, 53, 15, 0.16);
  --chat-reasoning-border: rgba(245, 158, 11, 0.26);
  --chat-reasoning-stream-border: rgba(245, 158, 11, 0.46);
  --chat-reasoning-stream-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.24),
    0 12px 22px -8px rgba(245, 158, 11, 0.2);
  --chat-reasoning-header-hover: rgba(245, 158, 11, 0.08);
  --chat-reasoning-icon-bg: rgba(245, 158, 11, 0.2);
  --chat-reasoning-icon-color: #fbbf24;
  --chat-reasoning-tag: #fcd34d;
  --chat-reasoning-count-bg: rgba(245, 158, 11, 0.18);
  --chat-reasoning-count: #fde68a;
  --chat-reasoning-content: #fde68a;
  --chat-reasoning-divider: rgba(245, 158, 11, 0.2);
  --chat-reasoning-scroll: rgba(245, 158, 11, 0.24);
  --chat-reasoning-shimmer: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(251, 191, 36, 0.18) 45%,
    rgba(255, 255, 255, 0) 90%
  );
  --chat-reasoning-progress: linear-gradient(90deg, #fcd34d 0%, #f59e0b 50%, #fcd34d 100%);
  --chat-typing-cursor: #fbbf24;

  --chat-input-bg: rgba(15, 23, 42, 0.88);
  --chat-input-border: rgba(148, 163, 184, 0.18);
  --chat-input-wrapper-bg: #1e293b;
  --chat-input-wrapper-border: #334155;
  --chat-input-wrapper-shadow: 0 4px 12px rgba(2, 6, 23, 0.24);
  --chat-input-focus-border: #3b82f6;
  --chat-input-focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.24);
  --chat-input-text: #f8fafc;
  --chat-input-placeholder: #8ba0b8;
  --chat-toggle-label: #c7d5e6;
  --chat-toggle-hint: #89a0b8;
  --chat-hint-bg: rgba(51, 65, 85, 0.62);
  --chat-hint-border: rgba(148, 163, 184, 0.3);
  --chat-hint-text: #b8c9dc;
  --chat-hint-icon: #94a9c2;
  --chat-hint-active-bg: rgba(30, 64, 110, 0.5);
  --chat-hint-active-border: rgba(96, 165, 250, 0.42);
  --chat-hint-active-text: #dbeafe;
  --chat-hint-active-icon: #93c5fd;
  --chat-send-bg: #2f83e8;
  --chat-send-hover: #3b93f8;
  --chat-send-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  --chat-stop-bg: #ef4444;
  --chat-stop-hover: #f16464;
  --chat-stop-shadow: 0 6px 16px rgba(239, 68, 68, 0.34);
  --chat-send-disabled-bg: #334155;
  --chat-send-disabled-text: #64748b;
  --chat-disclaimer: #6f849c;

  --chat-md-heading: #f8fafc;
  --chat-md-code-bg: rgba(59, 130, 246, 0.15);
  --chat-md-code-text: #93c5fd;
  --chat-md-pre-bg: #0f172a;
  --chat-md-pre-border: #334155;
  --chat-md-pre-text: #e2e8f0;
  --chat-md-quote-border: #42a5f5;
  --chat-md-quote-bg: rgba(59, 130, 246, 0.07);
  --chat-md-quote-text: #9fb4cb;
  --chat-md-hr: #334155;
  --chat-md-table-border: #334155;
  --chat-md-table-head-bg: rgba(59, 130, 246, 0.12);
  --chat-md-table-head-text: #93c5fd;
  --chat-md-table-even-bg: rgba(255, 255, 255, 0.03);
}
</style>
