/**
 * LocalStorage 和 SessionStorage 的封装工具函数
 * 提供类型安全的存储访问和错误处理
 */

/**
 * 存储类型
 */
type StorageType = 'local' | 'session';

/**
 * 获取存储对象
 */
const getStorage = (type: StorageType = 'local'): Storage => {
  return type === 'local' ? localStorage : sessionStorage;
};

/**
 * 设置存储项
 * @param key 键名
 * @param value 值 (会自动进行 JSON 序列化)
 * @param type 存储类型 (默认 localStorage)
 */
export const setItem = (key: string, value: unknown, type: StorageType = 'local'): void => {
  try {
    const storage = getStorage(type);
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting storage item [${key}]:`, error);
  }
};

/**
 * 获取存储项
 * @param key 键名
 * @param defaultValue 默认值 (如果未找到或解析失败)
 * @param type 存储类型 (默认 localStorage)
 */
export const getItem = <T>(key: string, defaultValue: T | null = null, type: StorageType = 'local'): T | null => {
  try {
    const storage = getStorage(type);
    const item = storage.getItem(key);

    if (item === null) {
      return defaultValue;
    }

    // 尝试解析 JSON，如果失败则返回原始字符串
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting storage item [${key}]:`, error);
    return defaultValue;
  }
};

/**
 * 移除存储项
 * @param key 键名
 * @param type 存储类型 (默认 localStorage)
 */
export const removeItem = (key: string, type: StorageType = 'local'): void => {
  try {
    const storage = getStorage(type);
    storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item [${key}]:`, error);
  }
};

/**
 * 清空所有存储
 * @param type 存储类型 (默认 localStorage)
 */
export const clear = (type: StorageType = 'local'): void => {
  try {
    const storage = getStorage(type);
    storage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// 预定义常用 Key
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'user',
  THEME: 'theme',
  LOCALE: 'locale',
  AI_CONFIG: 'ai_engine_config',
  USER_PREFERENCES: 'user_preferences',
  SUBSCRIPTION_STATUS: 'subscription_status'
} as const;
