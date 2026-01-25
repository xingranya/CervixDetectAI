import axios from 'axios';
import { handleError } from 'src/utils/errorHandler';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          localStorage.setItem('accessToken', data.data.accessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;

          // Update the authorization header for the retried request
          originalRequest.headers['Authorization'] = `Bearer ${data.data.accessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');

          handleError(refreshError, '登录已过期，请重新登录');

          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    // Use unified error handler
    handleError(error);

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async register(userData: {
    email: string;
    password: string;
    real_name?: string;
    phone?: string;
  }) {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  async logout() {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  async getCurrentUser() {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  async refreshToken(refreshToken: string) {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  // 短信验证相关接口
  async sendSmsCode(phone: string, type: 'login' | 'register' | 'reset_password' = 'login') {
    const { data } = await apiClient.post('/auth/sms/send-code', { phone, type });
    return data;
  },

  async smsLogin(phone: string, code: string) {
    const { data } = await apiClient.post('/auth/sms/login', { phone, code });
    return data;
  },

  async smsRegister(
    phone: string,
    code: string,
    userData?: { username?: string; real_name?: string; email?: string },
  ) {
    const { data } = await apiClient.post('/auth/sms/register', { phone, code, ...userData });
    return data;
  },

  async resetPassword(phone: string, code: string, newPassword: string) {
    const { data } = await apiClient.post('/auth/sms/reset-password', { phone, code, newPassword });
    return data;
  },
};

// User API
export const userAPI = {
  async getProfile() {
    const { data } = await apiClient.get('/users/me');
    return data;
  },

  async updateProfile(userData: { real_name?: string; phone?: string }) {
    const { data } = await apiClient.put('/users/me', userData);
    return data;
  },

  async updatePassword(passwords: { current_password: string; new_password: string }) {
    const { data } = await apiClient.put('/users/me/password', passwords);
    return data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// Patient API
export const patientAPI = {
  async createPatient(patientData: any) {
    const { data } = await apiClient.post('/patients', patientData);
    return data;
  },

  async getPatients(params?: { page?: number; limit?: number; search?: string; gender?: string }) {
    const { data } = await apiClient.get('/patients', { params });
    return data;
  },

  async getPatient(id: number) {
    const { data } = await apiClient.get(`/patients/${id}`);
    return data;
  },

  async updatePatient(id: number, patientData: any) {
    const { data } = await apiClient.put(`/patients/${id}`, patientData);
    return data;
  },

  async deletePatient(id: number) {
    const { data } = await apiClient.delete(`/patients/${id}`);
    return data;
  },

  async getPatientStudies(id: number) {
    const { data } = await apiClient.get(`/patients/${id}/studies`);
    return data;
  },
};

// Study API
export const studyAPI = {
  async createStudy(studyData: any) {
    console.log('📡 [studyAPI.createStudy] 发起请求:', studyData);
    const { data } = await apiClient.post('/studies', studyData);
    console.log('✅ [studyAPI.createStudy] 响应:', data);
    return data;
  },

  async getStudies(params?: {
    page?: number;
    limit?: number;
    patient_id?: number;
    status?: string;
    study_type?: string;
    search?: string;
  }) {
    console.log('📡 [studyAPI.getStudies] 发起请求，参数:', params);
    console.log('🔗 [studyAPI.getStudies] API URL:', `${API_BASE_URL}/studies`);
    const { data } = await apiClient.get('/studies', { params });
    console.log('✅ [studyAPI.getStudies] 响应:', data);
    console.log('📊 [studyAPI.getStudies] 返回病例数量:', data.data?.studies?.length || 0);
    return data;
  },

  async getStudy(id: number) {
    const { data } = await apiClient.get(`/studies/${id}`);
    return data;
  },

  async updateStudy(id: number, studyData: any) {
    const { data } = await apiClient.put(`/studies/${id}`, studyData);
    return data;
  },

  async deleteStudy(id: number) {
    const { data } = await apiClient.delete(`/studies/${id}`);
    return data;
  },

  async uploadImages(studyId: number, images: File[]) {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    const { data } = await apiClient.post(`/studies/${studyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteImage(studyId: number, imageId: number) {
    const { data } = await apiClient.delete(`/studies/${studyId}/images/${imageId}`);
    return data;
  },
};

// Analysis Task API
export const analysisTaskAPI = {
  async createTask(taskData: {
    study_id: number;
    model_name?: string;
    model_version?: string;
    priority?: string;
  }) {
    const { data } = await apiClient.post('/analysis-tasks', taskData);
    return data;
  },

  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    study_id?: number;
    priority?: string;
  }) {
    const { data } = await apiClient.get('/analysis-tasks', { params });
    return data;
  },

  async getTask(id: number) {
    const { data } = await apiClient.get(`/analysis-tasks/${id}`);
    return data;
  },

  async updateTaskStatus(
    id: number,
    statusData: { status?: string; progress?: number; error_message?: string },
  ) {
    const { data } = await apiClient.put(`/analysis-tasks/${id}/status`, statusData);
    return data;
  },

  async saveResult(id: number, resultData: any) {
    const { data } = await apiClient.post(`/analysis-tasks/${id}/result`, resultData);
    return data;
  },

  async deleteTask(id: number) {
    const { data } = await apiClient.delete(`/analysis-tasks/${id}`);
    return data;
  },
};

// Report API
export const reportAPI = {
  async createReport(reportData: any) {
    const { data } = await apiClient.post('/reports', reportData);
    return data;
  },

  async generateReport(studyId: number) {
    const { data } = await apiClient.post(`/reports/generate/${studyId}`);
    return data;
  },

  async getReports(params?: {
    page?: number;
    limit?: number;
    study_id?: number;
    report_type?: string;
    status?: string;
  }) {
    const { data } = await apiClient.get('/reports', { params });
    return data;
  },

  async getReport(id: number) {
    const { data } = await apiClient.get(`/reports/${id}`);
    return data;
  },

  async updateReport(id: number, reportData: any) {
    const { data } = await apiClient.put(`/reports/${id}`, reportData);
    return data;
  },

  async downloadReport(id: number) {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteReport(id: number) {
    const { data } = await apiClient.delete(`/reports/${id}`);
    return data;
  },
};

// Dashboard API
export const dashboardAPI = {
  async getStats(period?: 'today' | 'week' | 'month') {
    const { data } = await apiClient.get('/dashboard/stats', { params: { period } });
    return data;
  },

  async getPendingTasks() {
    const { data } = await apiClient.get('/dashboard/pending-tasks');
    return data;
  },

  async getNotices() {
    const { data } = await apiClient.get('/dashboard/notices');
    return data;
  },
};

export default apiClient;
