<template>
  <div class="ali-captcha-container">
    <!-- 验证按钮 - 始终渲染，用于验证码绑定 -->
    <q-btn
      :id="captchaElementId"
      unelevated
      :color="loading ? 'grey-4' : 'primary'"
      class="captcha-btn"
      no-caps
      :loading="loading"
      :disable="loading || !!error"
    >
      <template v-slot:loading>
        <q-spinner-dots color="primary" size="20px" />
        <span class="q-ml-sm">加载中...</span>
      </template>
      <q-icon name="verified_user" class="q-mr-sm" />
      点击进行安全验证
    </q-btn>

    <!-- 错误状态 -->
    <div v-if="error" class="captcha-error q-mt-sm">
      <q-icon name="error_outline" color="negative" size="18px" />
      <span class="q-ml-xs text-negative text-caption">{{ error }}</span>
      <q-btn
        flat
        dense
        size="sm"
        color="primary"
        label="重试"
        @click="initCaptcha"
        class="q-ml-sm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

/**
 * 阿里云 ESA AI 验证码组件
 *
 * 配置信息:
 * - 身份标识: esa-mvfh8rnn8x
 * - 场景ID: u1g43fza
 * - Region: cn
 * - 验证模式: 一点即过
 */

// Props
const props = withDefaults(
  defineProps<{
    /** 是否显示验证码 */
    visible?: boolean;
    /** 唯一标识符，用于区分多个实例 */
    instanceId?: string;
    /** 验证场景ID，不同场景使用不同的验证类型 */
    sceneId?: string;
  }>(),
  {
    visible: true,
    instanceId: 'default',
    sceneId: '', // 默认使用 CAPTCHA_CONFIG.scene
  },
);

// Emits
const emit = defineEmits<{
  /** 验证成功 */
  (e: 'success', token: string): void;
  /** 验证失败 */
  (e: 'fail', error: string): void;
  /** 验证码准备就绪 */
  (e: 'ready'): void;
}>();

// 阿里云验证码配置
const CAPTCHA_CONFIG = {
  appKey: 'esa-mvfh8rnn8x',
  scene: 'u1g43fza',
  region: 'cn',
  language: 'cn',
  // ESA 验证码 JS 地址
  scriptUrl: 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js',
};

// 状态
const loading = ref(true);
const error = ref('');
const captchaInstance = ref<unknown>(null);
const captchaElementId = `captcha-element-${props.instanceId}`;
const lastVerifyParam = ref('');
const hasSucceeded = ref(false);
const captchaSessionId = ref(0);

// 全局配置声明
declare global {
  interface Window {
    initAliyunCaptcha?: (config: unknown) => Promise<unknown>;
  }
}

/**
 * 动态加载验证码 JS
 */
const loadCaptchaScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.initAliyunCaptcha) {
      resolve();
      return;
    }

    // 检查是否正在加载
    const existingScript = document.querySelector(`script[src="${CAPTCHA_CONFIG.scriptUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('验证码脚本加载失败')));
      return;
    }

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = CAPTCHA_CONFIG.scriptUrl;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('验证码脚本加载失败'));

    document.head.appendChild(script);
  });
};

/**
 * 统一规范化验证码 token
 */
const normalizeToken = (token: unknown): string => {
  return typeof token === 'string' ? token.trim() : '';
};

/**
 * 判断回调是否仍属于当前会话
 */
const isActiveSession = (sessionId: number): boolean => {
  return sessionId === captchaSessionId.value;
};

/**
 * 初始化验证码
 */
const initCaptcha = async (options?: { keepSession?: boolean } | Event) => {
  const keepSession =
    !!options &&
    typeof options === 'object' &&
    'keepSession' in options &&
    (options as { keepSession?: boolean }).keepSession === true;
  loading.value = true;
  error.value = '';
  lastVerifyParam.value = '';
  hasSucceeded.value = false;

  try {
    // 1. 加载脚本
    await loadCaptchaScript();

    // 2. 等待 DOM 准备好
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. 初始化验证码
    if (!window.initAliyunCaptcha) {
      throw new Error('验证码脚本加载失败');
    }

    // 使用传入的 sceneId 或默认值
    const sceneIdToUse = props.sceneId || CAPTCHA_CONFIG.scene;

    const sessionId = keepSession ? captchaSessionId.value : (captchaSessionId.value += 1);

    const onCaptchaVerify = (captchaVerifyParam: string) => {
      if (!isActiveSession(sessionId)) {
        return {
          captchaResult: false,
          bizResult: false,
          captchaVerifyParam: '',
        };
      }

      const safeParam = normalizeToken(captchaVerifyParam);
      lastVerifyParam.value = safeParam;
      if (!safeParam) {
        emitFailIfNotSucceeded('验证失败，请重试', sessionId);
        return {
          captchaResult: false,
          bizResult: false,
          captchaVerifyParam: '',
        };
      }

      // 兜底：部分场景 onBizResultCallback 可能不触发，这里先上报一次成功
      emitSuccessOnce(safeParam, sessionId);
      // 返回验证参数，由父组件处理后端验证
      return {
        captchaResult: true,
        bizResult: true,
        captchaVerifyParam: safeParam,
      };
    };

    const onBizResult = (bizResult: boolean, captchaVerifyParam: string) => {
      if (!isActiveSession(sessionId)) return;

      if (bizResult) {
        const token = normalizeToken(captchaVerifyParam) || lastVerifyParam.value;
        emitSuccessOnce(token, sessionId);
      } else {
        emitFailIfNotSucceeded('验证失败，请重试', sessionId);
      }
    };

    const instance = await window.initAliyunCaptcha({
      SceneId: sceneIdToUse,
      prefix: CAPTCHA_CONFIG.appKey,
      mode: 'popup', // 弹出式验证
      element: `#${captchaElementId}`,
      button: `#${captchaElementId}`, // 点击触发
      captchaVerifyCallback: onCaptchaVerify,
      onBizResultCallback: onBizResult,
      getInstance: (inst: unknown) => {
        captchaInstance.value = inst;
      },
      slideStyle: {
        width: 280,
        height: 40,
      },
      language: CAPTCHA_CONFIG.language,
      region: CAPTCHA_CONFIG.region,
    });

    captchaInstance.value = instance;
    loading.value = false;
    emit('ready');
  } catch (err) {
    console.error('验证码初始化失败:', err);
    error.value = err instanceof Error ? err.message : '验证码初始化失败';
    loading.value = false;
  }
};

/**
 * 仅在首次成功时向父组件上报，避免第三方脚本重复回调导致状态来回切换
 */
const emitSuccessOnce = (token: string, sessionId: number) => {
  if (!isActiveSession(sessionId) || hasSucceeded.value) return;
  const safeToken = normalizeToken(token);
  if (!safeToken) return;
  hasSucceeded.value = true;
  emit('success', safeToken);
};

/**
 * 若已成功通过，则忽略后续失败回调，避免按钮状态“概率性置灰”
 */
const emitFailIfNotSucceeded = (message: string, sessionId: number) => {
  if (!isActiveSession(sessionId) || hasSucceeded.value) return;
  emit('fail', message);
};

/**
 * 重置验证码
 */
const reset = () => {
  hasSucceeded.value = false;
  lastVerifyParam.value = '';
  // 标记新的会话，忽略旧回调
  captchaSessionId.value += 1;
  if (
    captchaInstance.value &&
    typeof (captchaInstance.value as { reset?: () => void }).reset === 'function'
  ) {
    (captchaInstance.value as { reset: () => void }).reset();
  }

  if (props.visible) {
    void initCaptcha({ keepSession: true });
  }
};

/**
 * 手动触发验证
 */
const verify = () => {
  if (
    captchaInstance.value &&
    typeof (captchaInstance.value as { verify?: () => void }).verify === 'function'
  ) {
    (captchaInstance.value as { verify: () => void }).verify();
  }
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && !captchaInstance.value) {
      void initCaptcha();
    }
  },
);

// 生命周期
onMounted(() => {
  if (props.visible) {
    void initCaptcha();
  }
});

onUnmounted(() => {
  // 清理验证码实例
  captchaInstance.value = null;
});

// 暴露方法给父组件
defineExpose({
  reset,
  verify,
  initCaptcha,
});
</script>

<style scoped>
.ali-captcha-container {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-btn {
  width: 100%;
  height: 44px;
  font-size: 14px;
  border-radius: 8px;
}

.captcha-loading,
.captcha-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  width: 100%;
}

.captcha-error {
  font-size: 13px;
}
</style>
