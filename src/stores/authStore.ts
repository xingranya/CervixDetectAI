import { defineStore } from 'pinia';
import { authAPI, userAPI } from 'src/services/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface User {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  phone?: string;
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
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
  },

  actions: {
    async login(email: string, password: string) {
      this.isAuthenticating = true;
      try {
        const response = await authAPI.login(email, password);

        if (response.success) {
          // Store tokens
          this.token = response.data.accessToken;
          this.refreshToken = response.data.refreshToken;
          this.user = response.data.user;
          this.isAuthenticated = true;

          // Persist to localStorage
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          return { success: true };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '登录失败';
        return { success: false, error: errorMessage };
      } finally {
        this.isAuthenticating = false;
      }
    },

    async register(userData: {
      email: string;
      password: string;
      real_name?: string;
      phone?: string;
    }) {
      this.isAuthenticating = true;
      try {
        const response = await authAPI.register(userData);

        if (response.success) {
          // Auto login after registration
          this.token = response.data.accessToken;
          this.refreshToken = response.data.refreshToken;
          this.user = response.data.user;
          this.isAuthenticated = true;

          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          return { success: true };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '注册失败';
        return { success: false, error: errorMessage };
      } finally {
        this.isAuthenticating = false;
      }
    },

    // 短信验证码登录
    async smsLogin(phone: string, code: string) {
      this.isAuthenticating = true;
      try {
        const response = await authAPI.smsLogin(phone, code);

        if (response.success) {
          this.token = response.data.accessToken;
          this.refreshToken = response.data.refreshToken;
          this.user = response.data.user;
          this.isAuthenticated = true;

          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          return { success: true };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '短信登录失败';
        return { success: false, error: errorMessage };
      } finally {
        this.isAuthenticating = false;
      }
    },

    // 短信验证码注册
    async smsRegister(
      phone: string,
      code: string,
      userData?: { username?: string; real_name?: string; email?: string },
    ) {
      this.isAuthenticating = true;
      try {
        const response = await authAPI.smsRegister(phone, code, userData);

        if (response.success) {
          this.token = response.data.accessToken;
          this.refreshToken = response.data.refreshToken;
          this.user = response.data.user;
          this.isAuthenticated = true;

          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          return { success: true };
        } else {
          return { success: false, error: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '短信注册失败';
        return { success: false, error: errorMessage };
      } finally {
        this.isAuthenticating = false;
      }
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
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    },

    // Initialize auth from localStorage
    initializeAuth() {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = JSON.parse(userStr);
        this.isAuthenticated = true;
      }
    },

    // Method to set user data from existing token (e.g., on app initialization)
    setAuthData(token: string, refreshToken: string, user: User) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.user = user;
      this.isAuthenticated = true;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isAuthenticated = false;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});
