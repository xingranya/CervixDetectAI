const DEFAULT_API_BASE_URL = '/api';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const PROTOCOL_RELATIVE_URL_PATTERN = /^\/\//;
const ROOT_RELATIVE_URL_PATTERN = /^\//;
const LOCAL_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(?::\d+)?(?:\/.*)?$/i;
const HOST_LIKE_PATTERN =
  /^(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|(?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?(?:\/.*)?$/i;

/**
 * 规范化 API 基础地址，避免裸域名被浏览器当作相对路径处理。
 */
export const normalizeApiBaseUrl = (value: string | undefined | null): string => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return DEFAULT_API_BASE_URL;
  }

  if (
    ABSOLUTE_URL_PATTERN.test(trimmed) ||
    PROTOCOL_RELATIVE_URL_PATTERN.test(trimmed) ||
    ROOT_RELATIVE_URL_PATTERN.test(trimmed)
  ) {
    return trimmed.replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
  }

  if (HOST_LIKE_PATTERN.test(trimmed)) {
    const protocol = LOCAL_HOST_PATTERN.test(trimmed) ? 'http://' : 'https://';
    return `${protocol}${trimmed.replace(/\/+$/, '')}`;
  }

  return trimmed.replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
};

/**
 * 从 API 基础地址推导服务端基础地址。
 */
export const getServerBaseUrl = (apiBaseUrl: string): string => {
  if (!apiBaseUrl) {
    return '';
  }

  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const apiIndex = normalizedApiBaseUrl.indexOf('/api');

  if (apiIndex === -1) {
    return normalizedApiBaseUrl.replace(/\/$/, '');
  }

  return normalizedApiBaseUrl.slice(0, apiIndex);
};

export { DEFAULT_API_BASE_URL };
