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
              <div class="header-title">AI 辅助医疗助手</div>
              <div class="header-subtitle">
                <q-badge color="positive" rounded class="free-badge">
                  <q-icon name="local_offer" size="10px" class="q-mr-xs" />
                  限时免费
                </q-badge>
                <span class="mode-label">
                  {{ enableThinking ? '🧠 深度思考' : '⚡ 快速回复' }}
                </span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <q-btn
              flat
              round
              dense
              :icon="enableThinking ? 'psychology' : 'flash_on'"
              :color="enableThinking ? 'amber-4' : 'text-secondary'"
              size="sm"
              @click="enableThinking = !enableThinking"
            >
              <q-tooltip>切换为{{ enableThinking ? '快速回复' : '深度思考' }}模式</q-tooltip>
            </q-btn>
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
                <q-icon name="person" size="18px" />
              </div>
            </div>

            <!-- AI 气泡 -->
            <div v-else class="msg-row msg-ai">
              <div class="bubble-avatar ai-avatar">
                <img :src="aiAvatar" alt="AI" />
              </div>
              <div class="bubble-wrapper">
                <!-- 思考过程折叠 -->
                <div v-if="msg.reasoning" class="reasoning-block">
                  <q-expansion-item dense dense-toggle>
                    <template v-slot:header>
                      <div class="reasoning-toggle">
                        <q-icon name="psychology" size="14px" color="amber-8" />
                        <span>深度思考过程</span>
                        <q-badge color="grey-3" text-color="grey-7" rounded>
                          {{ msg.reasoning.length }} 字
                        </q-badge>
                      </div>
                    </template>
                    <div class="reasoning-content">{{ msg.reasoning }}</div>
                  </q-expansion-item>
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

          <!-- 思考状态 -->
          <div v-if="isLoading && currentPhase === 'reasoning'" class="msg-row msg-ai">
            <div class="bubble-avatar ai-avatar">
              <img :src="aiAvatar" alt="AI" />
            </div>
            <div class="thinking-indicator">
              <div class="thinking-dots"><span /><span /><span /></div>
              <span class="thinking-text">正在深度思考...</span>
            </div>
          </div>

          <!-- 流式输出占位 -->
          <div
            v-if="isLoading && currentPhase === 'content' && !currentContentText"
            class="msg-row msg-ai"
          >
            <div class="bubble-avatar ai-avatar">
              <img :src="aiAvatar" alt="AI" />
            </div>
            <div class="bubble bubble-ai">
              <q-spinner-dots size="1.6em" color="primary" />
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
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
              icon="send"
              :disable="!inputText.trim() || isLoading"
              @click="sendMessage"
              class="send-btn"
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

interface Props {
  modelValue: boolean;
  studyId: number | null;
}

const props = defineProps<Props>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const aiAvatar = '/logo.svg';

const quickQuestions = ['诊断结论解读', '风险评估分析', '后续建议'];

const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const isLoading = ref(false);
const enableThinking = ref(true);
const currentPhase = ref<'reasoning' | 'content'>('reasoning');
const currentContentText = ref('');
const messagesContainer = ref<HTMLElement>();
let currentController: AbortController | null = null;

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

/** 快捷提问 */
function askQuick(question: string) {
  inputText.value = question;
  sendMessage();
}

/** 发送消息 */
function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  isLoading.value = true;
  currentPhase.value = enableThinking.value ? 'reasoning' : 'content';
  currentContentText.value = '';
  scrollToBottom();

  const aiMsg: ChatMessage = { role: 'assistant', content: '', reasoning: '' };
  messages.value.push(aiMsg);

  const history = messages.value.slice(0, -2);

  currentController = sendChatMessage(
    props.studyId,
    text,
    history,
    enableThinking.value,
    (chunk: string, type: 'reasoning' | 'content' | 'error') => {
      if (type === 'reasoning') {
        aiMsg.reasoning = (aiMsg.reasoning || '') + chunk;
      } else if (type === 'content') {
        currentPhase.value = 'content';
        aiMsg.content += chunk;
        currentContentText.value = aiMsg.content;
      }
      scrollToBottom();
    },
    () => {
      isLoading.value = false;
      currentController = null;
      currentPhase.value = 'content';
      if (!aiMsg.content) aiMsg.content = '抱歉，暂时无法生成回复，请稍后重试。';
      if (!aiMsg.reasoning) delete aiMsg.reasoning;
      scrollToBottom();
    },
    (error: string) => {
      isLoading.value = false;
      currentController = null;
      currentPhase.value = 'content';
      aiMsg.content = `⚠️ ${error}`;
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
/* ============ 面板容器 ============ */
.ai-chat-panel {
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
  background: rgba(255, 255, 255, 0.92); /* 半透明呈现高斯模糊 */
  border-radius: 20px;
  box-shadow:
    0 24px 64px -12px rgba(0, 0, 0, 0.12),
    0 8px 24px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* ============ 清爽标题栏 ============ */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  // 一种非常现代明亮、清脆无杂色的医学蓝
  background: #1976D2;
  border-bottom: none;
  color: #ffffff;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.15); /* 蓝色背景上的白色半透衬底 */
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;

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
      background: #10b981;
      border: 2px solid #2563eb;
    }
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: #ffffff;
  }

  .header-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .free-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
  }

  .mode-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;

    .q-btn {
      color: rgba(255, 255, 255, 0.85) !important;
      background: transparent;

      &:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }
}

/* ============ 消息区域 ============ */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  scroll-behavior: smooth;
  background: transparent; /* 去除原本实色背景，露出玻璃窗口底层 */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  }
}

/* ============ 欢迎卡片 ============ */
.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  animation: fadeInUp 0.4s ease-out;

  .welcome-icon {
    margin-bottom: 20px;
    width: 72px;
    height: 72px;
    background: #fff;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);

    .welcome-avatar {
      width: 48px;
      height: 48px;
    }
  }

  .welcome-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--app-text-primary);
    margin-bottom: 12px;
  }

  .welcome-desc {
    font-size: 14px;
    color: var(--app-text-secondary);
    line-height: 1.6;
    max-width: 380px;
    margin-bottom: 24px;
  }

  .welcome-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;

    .quick-chip {
      font-size: 13px;
      padding: 12px 16px;
      background: #fff !important;
      border: 1px solid var(--app-border-default) !important;
      color: var(--app-text-primary) !important;
      border-radius: 24px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

      &:hover {
        transform: translateY(-2px);
        border-color: #3b82f6 !important;
        color: #2563eb !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
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
  margin-bottom: 24px;
  animation: msgSlide 0.3s cubic-bezier(0.2, 0, 0, 1);

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
    transform: translateY(8px);
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &.ai-avatar {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.02);
    padding: 6px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &.user-avatar {
    background: #f1f5f9;
    color: #64748b;
  }
}

/* ============ 气泡体 ============ */
.bubble-wrapper {
  max-width: calc(100% - 60px);
  min-width: 80px;
}

.bubble {
  padding: 14px 18px;
  border-radius: 20px;
  max-width: 100%;
  word-break: break-word;
  position: relative;
  line-height: 1.6;

  &.bubble-user {
    background: #e0f2fe;
    color: #0c4a6e;
    border-bottom-right-radius: 6px;
    max-width: calc(100% - 60px);
    font-size: 15px;
  }

  &.bubble-ai {
    background: #ffffff;
    color: #334155;
    border-bottom-left-radius: 6px;
    box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.03);
    font-size: 15px;
  }
}

/* ============ 思考折叠 ============ */
.reasoning-block {
  margin-bottom: 8px;
  border-radius: 14px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  :deep(.q-expansion-item__container) {
    .q-item {
      padding: 8px 14px;
      min-height: 36px;
    }
  }

  .reasoning-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }

  .reasoning-content {
    padding: 12px 16px 16px;
    font-size: 13px;
    line-height: 1.7;
    color: #475569;
    white-space: pre-wrap;
    max-height: 280px;
    overflow-y: auto;
    border-top: 1px dashed #e2e8f0;
    background: #fdfdfd;
  }
}

/* ============ 思考动画 ============ */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-radius: 20px;
  border-bottom-left-radius: 6px;
  box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.04);

  .thinking-dots {
    display: flex;
    gap: 5px;

    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      animation: dotBounce 1.4s infinite ease-in-out both;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.16s;
      }
      &:nth-child(3) {
        animation-delay: 0.32s;
      }
    }
  }

  .thinking-text {
    font-size: 14px;
    color: #64748b;
  }
}

@keyframes dotBounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
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
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
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
    background: #f1f5f9;
    color: #3b82f6;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
  }

  :deep(pre) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    padding: 12px 16px;
    border-radius: 12px;
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
    border-left: 3px solid #3b82f6;
    padding: 6px 16px;
    margin: 12px 0;
    color: #64748b;
    background: #f0f9ff;
    border-radius: 0 8px 8px 0;
  }

  :deep(strong) {
    font-weight: 600;
    color: #0f172a;
  }

  :deep(hr) {
    border: none;
    height: 1px;
    background: #e2e8f0;
    margin: 16px 0;
  }
}

/* ============ 输入区域 ============ */
.chat-input-area {
  padding: 16px 20px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--app-border-light);

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: #fff;
    border-radius: 24px;
    padding: 8px 12px 8px 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;

    &:focus-within {
      border-color: #93c5fd;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
      color: #1e293b;

      &::placeholder {
        color: #94a3b8;
      }
    }

    :deep(.q-field__control::before),
    :deep(.q-field__control::after) {
      display: none;
    }
  }

  .send-btn {
    background: #3b82f6;
    color: white !important;
    width: 36px;
    height: 36px;
    border-radius: 18px;
    transition: all 0.2s;
    margin-bottom: 2px;

    &[disabled] {
      background: #e2e8f0;
      color: #94a3b8 !important;
    }

    &:not([disabled]):hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
  }
}

.chat-disclaimer {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============ 面板动画 ============ */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(32px) scale(0.96);
}
</style>

<style lang="scss">
/* ============ 暗色模式 ============ */
body.body--dark {
  .chat-window {
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.5);
  }

  .chat-header {
    background: rgba(15, 23, 42, 0.85);
    border-bottom-color: rgba(255, 255, 255, 0.06);

    .header-avatar {
      background: #0f172a;
      box-shadow: none;
      .avatar-pulse {
        border-color: #1e293b;
      }
    }

    .header-title {
      color: #f8fafc;
    }
    .mode-label {
      color: #94a3b8;
    }
    .free-badge {
      background: rgba(16, 185, 129, 0.15) !important;
      color: #34d399 !important;
    }
  }

  .chat-messages {
    background: transparent;
  }

  .welcome-card {
    .welcome-icon {
      background: #0f172a;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    .welcome-title {
      color: #f1f5f9;
    }
    .welcome-desc {
      color: #94a3b8;
    }
    .welcome-chips .quick-chip {
      background: #1e293b !important;
      border-color: #334155 !important;
      color: #cbd5e1 !important;
      &:hover {
        border-color: #3b82f6 !important;
        color: #60a5fa !important;
      }
    }
  }

  .bubble {
    &.bubble-user {
      background: #1e3a8a;
      color: #eff6ff;
    }

    &.bubble-ai {
      background: #1e293b;
      color: #e2e8f0;
      border-color: rgba(255, 255, 255, 0.04);
    }
  }

  .bubble-avatar {
    &.ai-avatar {
      background: #0f172a;
      border-color: rgba(255, 255, 255, 0.04);
    }
    &.user-avatar {
      background: #334155;
      color: #f8fafc;
    }
  }

  .reasoning-block {
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.06);

    .reasoning-toggle {
      color: #94a3b8;
    }
    .reasoning-content {
      color: #cbd5e1;
      background: transparent;
      border-top-color: rgba(255, 255, 255, 0.04);
    }
  }

  .thinking-indicator {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.04);
    .thinking-text {
      color: #94a3b8;
    }
  }

  .chat-input-area {
    background: rgba(15, 23, 42, 0.85);
    border-top-color: rgba(255, 255, 255, 0.06);

    .input-wrapper {
      background: #1e293b;
      border-color: #334155;

      &:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }
    }

    .input-field :deep(.q-field__native) {
      color: #f8fafc;
    }

    .send-btn {
      &[disabled] {
        background: #334155;
        color: #64748b !important;
      }
    }
  }

  .chat-disclaimer {
    color: #64748b;
  }

  .markdown-body {
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: #f8fafc;
    }
    :deep(strong) {
      color: #f8fafc;
    }

    :deep(code) {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    :deep(pre) {
      background: #0f172a;
      border-color: #334155;
      color: #e2e8f0;
    }

    :deep(blockquote) {
      border-left-color: #42a5f5;
      color: #90a4ae;
      background: rgba(59, 130, 246, 0.05);
    }

    :deep(table) {
      th,
      td {
        border-color: #334155;
      }
      th {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
      }
      tr:nth-child(even) td {
        background: rgba(255, 255, 255, 0.02);
      }
    }
  }
}
</style>
