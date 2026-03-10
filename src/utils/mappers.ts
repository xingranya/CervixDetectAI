/**
 * 数据映射和转换工具函数
 */
import { normalizeApiBaseUrl, getServerBaseUrl, DEFAULT_API_BASE_URL } from './apiBaseUrl';

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);
const SERVER_BASE_URL = getServerBaseUrl(API_BASE_URL);

/**
 * 处理图片 URL
 * 将相对路径转换为完整 URL
 * @param filePath 文件路径
 * @returns 完整 URL
 */
export const getImageUrl = (filePath: string | undefined): string | undefined => {
  if (!filePath) return undefined;
  // 如果已经是完整URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // 否则拼接服务器地址
  // 移除开头可能存在的 / 防止双斜杠，但 SERVER_BASE_URL 可能不带斜杠
  // 假设 filePath 类似 "/uploads/..."
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

/**
 * 通用映射函数类型
 */
export type Mapper<T, U> = (item: T) => U;

/**
 * 批量映射数组
 * @param items 源数组
 * @param mapper 映射函数
 */
export const mapList = <T, U>(items: T[], mapper: Mapper<T, U>): U[] => {
  if (!Array.isArray(items)) return [];
  return items.map(mapper);
};

/**
 * 安全解析 JSON
 * @param jsonString JSON 字符串
 * @param fallback 默认值
 */
export const safeParseJson = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

/**
 * 深度克隆对象
 * @param obj 源对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 将对象转换为查询字符串
 * @param params 参数对象
 */
export const toQueryString = (
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const parts: string[] = [];
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.length > 0 ? `?${parts.join('&')}` : '';
};
