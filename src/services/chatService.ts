import apiClient from 'src/services/apiClient';

/** 单条消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** 深度思考过程（仅 AI 回复） */
  reasoning?: string;
}

/** SSE chunk 类型 */
type ChunkType = 'reasoning' | 'content' | 'error';

/**
 * 发送聊天消息（SSE 流式响应）
 * @param studyId - 病例 ID
 * @param message - 用户消息
 * @param history - 历史对话
 * @param enableThinking - 是否启用深度思考
 * @param onChunk - 每收到一段文本时的回调（区分 reasoning 和 content）
 * @param onDone - 流结束回调
 * @param onError - 错误回调
 * @returns AbortController
 */
export function sendChatMessage(
  studyId: number | null,
  message: string,
  history: ChatMessage[],
  enableThinking: boolean,
  onChunk: (text: string, type: ChunkType) => void,
  onDone: () => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();
  const baseURL = apiClient.defaults.baseURL || '';
  const token = localStorage.getItem('access_token');

  fetch(`${baseURL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      studyId,
      message,
      enableThinking,
      history: history.map(({ role, content }) => ({ role, content })),
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message || `请求失败 (${response.status})`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('浏览器不支持流式响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              type?: ChunkType;
              content?: string;
              error?: string;
            };

            if (parsed.type === 'error' || parsed.error) {
              onError(parsed.content || parsed.error || '未知错误');
              return;
            }

            if (parsed.content) {
              onChunk(parsed.content, parsed.type || 'content');
            }
          } catch {
            // 忽略格式错误的数据块
          }
        }
      }

      onDone();
    })
    .catch((error: Error) => {
      if (error.name === 'AbortError') return;
      onError(error.message || '网络请求失败');
    });

  return controller;
}
