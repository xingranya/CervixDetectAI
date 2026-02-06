import { defineStore } from 'pinia';
import { authAPI, userAPI } from 'src/services/api';
import { getItem, removeItem, setItem, STORAGE_KEYS } from 'src/utils/storage';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface User {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  phone?: string;
  hospital_id?: string;
  employee_id?: string;
  role: 'admin' | 'doctor' | 'user';
  status: 'active' | 'disabled';
  avatar_url?: string;
  last_login_at?: string;
  // 别名字段，兼容不同 API 响应
  name?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    refreshToken: null as string | null,
    isAuthenticated: false,
    isAuthenticating: false,
    // 标记是否已从本地存储初始化过（用于路由守卫避免刷新误判）
    hasInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
  },

  actions: {
    /**
     * 内部辅助：保存认证数据到 store 和 localStorage
     */
    _saveAuthData(data: { accessToken: string; refreshToken: string; user: User }) {
      this.token = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;
      this.isAuthenticated = true;
      this.hasInitialized = true;
      setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      setItem(STORAGE_KEYS.USER_INFO, data.user);
    },

    /**
     * 内部辅助：统一处理认证请求（登录/注册）
     * 封装了 loading 状态、错误处理和成功后的数据保存
     */
    async _handleAuthRequest(
      apiCall: () => Promise<any>,
      defaultErrorMsg: string,
    ): Promise<{ success: boolean; error?: string }> {
      this.isAuthenticating = true;
      try {
        const response = await apiCall();

        if (response.success) {
          this._saveAuthData(response.data);
          return { success: true };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || defaultErrorMsg;
        return { success: false, error: errorMessage };
      } finally {
        this.isAuthenticating = false;
      }
    },

    async login(email: string, password: string) {
      return this._handleAuthRequest(() => authAPI.login(email, password), '登录失败');
    },

    async employeeLogin(hospitalId: string, employeeId: string, password: string) {
      return this._handleAuthRequest(
        () => authAPI.employeeLogin(hospitalId, employeeId, password),
        '工号登录失败',
      );
    },

    async register(userData: {
      password: string;
      hospital_id?: string;
      employee_id?: string;
      email?: string;
      emailCode?: string;
      real_name?: string;
      phone?: string;
    }) {
      return this._handleAuthRequest(() => authAPI.register(userData), '注册失败');
    },

    // 短信验证码登录
    async smsLogin(phone: string, code: string) {
      return this._handleAuthRequest(() => authAPI.smsLogin(phone, code), '短信登录失败');
    },

    // 短信验证码注册
    async smsRegister(
      phone: string,
      code: string,
      userData?: { username?: string; real_name?: string; email?: string },
    ) {
      return this._handleAuthRequest(
        () => authAPI.smsRegister(phone, code, userData),
        '短信注册失败',
      );
    },

    async logout() {
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignore logout errors
        console.error('Logout error:', error);
      } finally {
        this.clearAuthData();
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await userAPI.getProfile();
        if (response.success) {
          this.user = response.data.user;
          setItem(STORAGE_KEYS.USER_INFO, response.data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    },

    /**
     * 从本地存储初始化认证状态
     */
    initializeAuth(): void {
      const token = getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
      const user = getItem<User>(STORAGE_KEYS.USER_INFO);

      if (token && user && typeof user === 'object') {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
        this.isAuthenticated = true;
      } else {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        this.isAuthenticated = false;
      }

      this.hasInitialized = true;
    },

    // Method to set user data from existing token (e.g., on app initialization)
    setAuthData(token: string, refreshToken: string, user: User) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.user = user;
      this.isAuthenticated = true;
      this.hasInitialized = true;

      setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      setItem(STORAGE_KEYS.USER_INFO, user);
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isAuthenticated = false;

      removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      removeItem(STORAGE_KEYS.USER_INFO);
    },
  },
});
