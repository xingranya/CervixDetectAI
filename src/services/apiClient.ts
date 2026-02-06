import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { getItem, removeItem, setItem, STORAGE_KEYS } from 'src/utils/storage';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token 刷新 singleflight：并发 401 只触发一次刷新请求
let refreshPromise: Promise<string> | null = null;

/**
 * 统一跳转到登录页（hash 模式）
 */
function redirectToLogin() {
  const routerMode = process.env.VUE_ROUTER_MODE;
  const routerBase = process.env.VUE_ROUTER_BASE || '';
  const normalizedBase =
    routerBase && routerBase !== '/' ? routerBase.replace(/\/+$/, '') : routerBase;
  const joinPath = (base: string, path: string) => {
    if (!base || base === '/') {
      return `/${path.replace(/^\/+/, '')}`;
    }
    return `${base}/${path.replace(/^\/+/, '')}`;
  };

  const isHashMode = routerMode ? routerMode !== 'history' : window.location.hash.startsWith('#/');
  const loginPath = isHashMode
    ? joinPath(normalizedBase, '#/login')
    : joinPath(normalizedBase, 'login');
  window.location.href = loginPath;
}

/**
 * 获取或创建刷新 Token 的共享 Promise
 */
function getRefreshPromise(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      // 使用独立请求，避免拦截器循环
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken: string | undefined = data?.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('刷新 Token 响应缺少 accessToken');
      }

      setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      return newAccessToken;
    })();

    void refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in dev mode
    if (import.meta.env.DEV) {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in dev mode
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error
    if (import.meta.env.DEV) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ API Error: ${error.config?.url}`, error.message);
      } else {
        console.error('❌ API Error:', error);
      }
    }

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const newAccessToken = await getRefreshPromise(refreshToken);
          // 为重试请求更新 Authorization
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          redirectToLogin();
          return Promise.reject(
            refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
          );
        }
      } else {
        // No refresh token, redirect
        redirectToLogin();
        return Promise.reject(new Error('缺少刷新令牌'));
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);

export default apiClient;
