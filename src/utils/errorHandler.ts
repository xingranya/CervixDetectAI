import { Notify } from 'quasar';
import type { AxiosError } from 'axios';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ApiErrorResponse {
  status?: string;
  message?: string;
  code?: number;
  data?: unknown;
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param customMessage 自定义提示消息（可选）
 * @param silent 是否静默处理（不显示通知，可选）
 */
export const handleError = (error: any, customMessage?: string, silent: boolean = false) => {
  // 如果是取消请求，不做处理
  if (error?.code === 'ERR_CANCELED') {
    return;
  }

  // 如果指定了静默处理，只打印日志
  if (silent) {
    console.error('Silent Error:', error);
    return;
  }

  let message = customMessage || '发生未知错误，请稍后重试';
  let type: 'negative' | 'warning' | 'info' = 'negative';

  if (error?.isAxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    // 优先使用后端返回的错误信息
    if (responseData && typeof responseData === 'object' && responseData.message) {
      message = responseData.message;
    } else if (!customMessage) {
      // 根据状态码设置默认错误信息
      switch (status) {
        case 400:
          message = '请求参数错误';
          break;
        case 401:
          message = '登录已过期，请重新登录';
          type = 'warning';
          break;
        case 403:
          message = '拒绝访问，权限不足';
          type = 'warning';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 405:
          message = '请求方法不允许';
          break;
        case 408:
          message = '请求超时，请检查网络';
          break;
        case 422:
          message = '数据验证失败，请检查输入';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        case 500:
          message = '服务器内部错误，请联系管理员';
          break;
        case 502:
          message = '网关错误';
          break;
        case 503:
          message = '服务不可用，请稍后重试';
          break;
        case 504:
          message = '网关超时';
          break;
        default:
          if (!axiosError.response) {
            message = '网络连接失败，请检查网络设置';
          } else {
            message = `请求失败 (${status})`;
          }
      }
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // 显示通知
  Notify.create({
    type: type,
    message: message,
    position: 'top',
    timeout: 3000,
    actions: [{ icon: 'close', color: 'white' }]
  });

  return message;
};
