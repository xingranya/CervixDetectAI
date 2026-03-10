import apiClient from 'src/services/apiClient';
import { normalizeApiBaseUrl, DEFAULT_API_BASE_URL } from 'src/utils/apiBaseUrl';

// API 基础地址（用于公开接口）
const API_BASE_URL = String(
  apiClient.defaults.baseURL ||
    normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL),
);

// ============================================================
// 通用响应类型
// ============================================================

/** 后端统一响应格式 */
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

// ============================================================
// Auth API
// ============================================================

/** 认证成功后返回的数据 */
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: {
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
    // 订阅相关字段
    subscription_type?: string;
    subscription_expires_at?: string;
    remaining_credits?: number;
  };
}

export const authAPI = {
  async login(email: string, password: string): Promise<ApiResponse<AuthData>> {
    const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async employeeLogin(
    hospitalId: string,
    employeeId: string,
    password: string,
  ): Promise<ApiResponse<AuthData>> {
    const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/login', {
      hospital_id: hospitalId,
      employee_id: employeeId,
      password,
    });
    return data;
  },

  async register(userData: {
    password: string;
    hospital_id?: string;
    employee_id?: string;
    email?: string;
    emailCode?: string;
    real_name?: string;
    phone?: string;
  }): Promise<ApiResponse<AuthData>> {
    const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/register', userData);
    return data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  async getCurrentUser(): Promise<ApiResponse<{ user: AuthData['user'] }>> {
    const { data } = await apiClient.get<ApiResponse<{ user: AuthData['user'] }>>('/auth/me');
    return data;
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const { data } = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh', { refreshToken });
    return data;
  },

  // 短信验证相关接口
  async sendSmsCode(
    phone: string,
    type: 'login' | 'register' | 'reset_password' = 'login',
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/sms/send-code', {
      phone,
      type,
    });
    return data;
  },

  async smsLogin(phone: string, code: string): Promise<ApiResponse<AuthData>> {
    const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/sms/login', {
      phone,
      code,
    });
    return data;
  },

  async smsRegister(
    phone: string,
    code: string,
    userData?: { username?: string; real_name?: string; email?: string },
  ): Promise<ApiResponse<AuthData>> {
    const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/sms/register', {
      phone,
      code,
      ...userData,
    });
    return data;
  },

  async resetPassword(
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/sms/reset-password', {
      phone,
      code,
      newPassword,
    });
    return data;
  },

  async resetPasswordByEmail(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/email/reset-password', {
      email,
      code,
      newPassword,
    });
    return data;
  },

  // 邮箱验证相关接口
  async sendEmailCode(
    email: string,
    type: 'register' | 'reset_password' = 'register',
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/email/send-code', {
      email,
      type,
    });
    return data;
  },

  async verifyEmailCode(
    email: string,
    code: string,
    type: 'register' | 'reset_password' = 'register',
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/email/verify', {
      email,
      code,
      type,
    });
    return data;
  },
};

// ============================================================
// User API
// ============================================================

export const userAPI = {
  async getProfile(): Promise<ApiResponse<{ user: AuthData['user'] }>> {
    const { data } = await apiClient.get<ApiResponse<{ user: AuthData['user'] }>>('/users/me');
    return data;
  },

  async updateProfile(userData: {
    real_name?: string;
    phone?: string;
    email?: string;
  }): Promise<ApiResponse<{ user: AuthData['user'] }>> {
    const { data } = await apiClient.put<ApiResponse<{ user: AuthData['user'] }>>(
      '/users/me',
      userData,
    );
    return data;
  },

  async updatePassword(passwords: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<null>> {
    const { data } = await apiClient.put<ApiResponse<null>>('/users/me/password', passwords);
    return data;
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<{ avatar_url: string }>>(
      '/users/me/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  },

  async sendChangeEmailCode(newEmail: string): Promise<ApiResponse<{ expiresIn: number }>> {
    const { data } = await apiClient.post<ApiResponse<{ expiresIn: number }>>(
      '/users/me/email/send-code',
      {
        new_email: newEmail,
      },
    );
    return data;
  },

  async confirmChangeEmail(
    newEmail: string,
    code: string,
  ): Promise<ApiResponse<{ user: AuthData['user'] }>> {
    const { data } = await apiClient.post<ApiResponse<{ user: AuthData['user'] }>>(
      '/users/me/email/confirm',
      {
        new_email: newEmail,
        code,
      },
    );
    return data;
  },
};

// ============================================================
// Study API
// ============================================================

/** 创建/更新病例请求参数 */
interface StudyMutationData {
  patient_id?: number;
  study_date?: string;
  study_type?: string;
  description?: string | undefined;
  status?: string;
}

/** 后端返回的病例图片 */
interface StudyImage {
  id: number;
  file_path: string;
  original_filename: string;
}

/** 后端返回的分析结果（嵌套在 study 中） */
interface StudyAnalysisResultRaw {
  diagnosis?: string;
  confidence?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: string[];
  suspicious_areas?: Array<{
    box_2d?: number[];
    description?: string;
    location?: string;
    features?: string[];
  }>;
  biomarkers?: Record<string, string>;
  detailed_report?: string;
}

/** 后端返回的分析任务（嵌套在 study 中） */
interface StudyAnalysisTaskRaw {
  task_id: string;
  status: string;
  created_at: string;
}

/** 后端返回的患者摘要（嵌套在 study 中） */
interface StudyPatientRaw {
  name: string;
  patient_id: string;
}

/** 后端返回的单个病例数据 */
export interface StudyRaw {
  id: number;
  study_id: string;
  patient_id: number;
  study_date: string;
  study_type: string;
  status: 'pending' | 'completed' | 'processing' | 'failed' | 'uploaded';
  description?: string | undefined;
  created_at: string;
  images?: StudyImage[];
  patient?: StudyPatientRaw;
  analysis_results?: StudyAnalysisResultRaw[];
  analysis_tasks?: StudyAnalysisTaskRaw[];
  downloaded?: boolean;
  downloaded_at?: string | undefined;
}

/** 病例列表响应 */
interface StudyListData {
  studies: StudyRaw[];
  pagination?: { total: number; page: number; limit: number };
}

export const studyAPI = {
  async createStudy(
    studyData: Omit<StudyMutationData, 'status'> & { patient_id: number },
  ): Promise<ApiResponse<{ study: StudyRaw }>> {
    const { data } = await apiClient.post<ApiResponse<{ study: StudyRaw }>>('/studies', studyData);
    return data;
  },

  async getStudies(params?: {
    page?: number;
    limit?: number;
    patient_id?: number;
    status?: string;
    study_type?: string;
    search?: string;
  }): Promise<ApiResponse<StudyListData>> {
    const { data } = await apiClient.get<ApiResponse<StudyListData>>('/studies', { params });
    return data;
  },

  async getStudy(id: number): Promise<ApiResponse<{ study: StudyRaw }>> {
    const { data } = await apiClient.get<ApiResponse<{ study: StudyRaw }>>(`/studies/${id}`);
    return data;
  },

  async updateStudy(
    id: number,
    studyData: StudyMutationData,
  ): Promise<ApiResponse<{ study: StudyRaw }>> {
    const { data } = await apiClient.put<ApiResponse<{ study: StudyRaw }>>(
      `/studies/${id}`,
      studyData,
    );
    return data;
  },

  async deleteStudy(id: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/studies/${id}`);
    return data;
  },

  async uploadImages(
    studyId: number,
    images: File[],
  ): Promise<ApiResponse<{ images: StudyImage[] }>> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    const { data } = await apiClient.post<ApiResponse<{ images: StudyImage[] }>>(
      `/studies/${studyId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  },

  async deleteImage(studyId: number, imageId: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/studies/${studyId}/images/${imageId}`,
    );
    return data;
  },
};

// ============================================================
// Analysis Task API
// ============================================================

/** 分析结果数据 */
interface AnalysisResultData {
  diagnosis: string;
  confidence: number;
  risk_level?: string;
  recommendations?: string[];
  suspicious_areas?: unknown[];
  biomarkers?: Record<string, string>;
  detailed_report?: string;
}

export interface CreateBatchAnalysisTaskRequest {
  images: File[];
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  description?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  model_version?: string;
}

export interface BatchAnalysisTaskItem {
  index: number;
  originalFilename: string;
  studyDbId?: number;
  studyId?: string;
  imageId?: number;
  taskId?: string;
  status: 'PENDING' | 'FAILED';
  error?: string;
}

export interface BatchAnalysisTaskResponse {
  batchId: string;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  items: BatchAnalysisTaskItem[];
}

export const analysisTaskAPI = {
  async createTask(taskData: {
    study_id: number;
    model_name?: string;
    model_version?: string;
    priority?: string;
  }): Promise<ApiResponse<{ task: { task_id: string; status: string } }>> {
    const { data } = await apiClient.post<
      ApiResponse<{ task: { task_id: string; status: string } }>
    >('/analysis-tasks', taskData);
    return data;
  },

  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    study_id?: number;
    priority?: string;
  }): Promise<ApiResponse<{ tasks: unknown[] }>> {
    const { data } = await apiClient.get<ApiResponse<{ tasks: unknown[] }>>('/analysis-tasks', {
      params,
    });
    return data;
  },

  async getTask(
    id: number,
  ): Promise<ApiResponse<{ task: { task_id: string; status: string; progress: number } }>> {
    const { data } = await apiClient.get<
      ApiResponse<{ task: { task_id: string; status: string; progress: number } }>
    >(`/analysis-tasks/${id}`);
    return data;
  },

  async updateTaskStatus(
    id: number,
    statusData: { status?: string; progress?: number; error_message?: string },
  ): Promise<ApiResponse<null>> {
    const { data } = await apiClient.put<ApiResponse<null>>(
      `/analysis-tasks/${id}/status`,
      statusData,
    );
    return data;
  },

  async saveResult(id: number, resultData: AnalysisResultData): Promise<ApiResponse<null>> {
    const { data } = await apiClient.post<ApiResponse<null>>(
      `/analysis-tasks/${id}/result`,
      resultData,
    );
    return data;
  },

  async deleteTask(id: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/analysis-tasks/${id}`);
    return data;
  },

  async createBatchTasks(
    payload: CreateBatchAnalysisTaskRequest,
  ): Promise<ApiResponse<BatchAnalysisTaskResponse>> {
    const formData = new FormData();
    payload.images.forEach((image) => {
      formData.append('images', image);
    });
    formData.append('patientName', payload.patientName);
    formData.append('patientId', payload.patientId);
    formData.append('studyDate', payload.studyDate);
    formData.append('modality', payload.modality);
    if (payload.description) {
      formData.append('description', payload.description);
    }
    if (payload.priority) {
      formData.append('priority', payload.priority);
    }
    if (payload.model_version) {
      formData.append('model_version', payload.model_version);
    }

    const { data } = await apiClient.post<ApiResponse<BatchAnalysisTaskResponse>>(
      '/analysis-tasks/batch',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
  },
};

// ============================================================
// Report API
// ============================================================

/** 创建/更新报告请求参数 */
interface ReportMutationData {
  study_id?: number;
  analysis_result_id?: number;
  report_type?: string;
  content?: string;
  status?: string;
}

export const reportAPI = {
  async createReport(reportData: ReportMutationData): Promise<ApiResponse<unknown>> {
    const { data } = await apiClient.post<ApiResponse<unknown>>('/reports', reportData);
    return data;
  },

  async generateReport(studyId: number): Promise<ApiResponse<unknown>> {
    const { data } = await apiClient.post<ApiResponse<unknown>>(`/reports/generate/${studyId}`);
    return data;
  },

  async getReports(params?: {
    page?: number;
    limit?: number;
    study_id?: number;
    report_type?: string;
    status?: string;
  }): Promise<ApiResponse<unknown>> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/reports', { params });
    return data;
  },

  async getReport(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await apiClient.get<ApiResponse<unknown>>(`/reports/${id}`);
    return data;
  },

  async updateReport(id: number, reportData: ReportMutationData): Promise<ApiResponse<unknown>> {
    const { data } = await apiClient.put<ApiResponse<unknown>>(`/reports/${id}`, reportData);
    return data;
  },

  async downloadReport(id: number): Promise<Blob> {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async deleteReport(id: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/reports/${id}`);
    return data;
  },
};

// ============================================================
// Dashboard API
// ============================================================

/** 仪表盘统计数据 */
interface DashboardStats {
  todayTotal: number;
  todayGrowth: number;
  highRiskCount: number;
  highRiskPercent: number;
  avgProcessTime: number;
  timeImprovement: number;
  completedToday: number;
  diagnosisStats: Record<string, number>;
}

/** 待处理任务项 */
interface DashboardTask {
  id: number;
  taskId: string;
  studyId: number;
  studyUniqueId: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium';
  estimatedTime: string;
  status: string;
  patientName: string;
  patientId: string;
  createdAt: string;
}

/** 系统公告 */
interface DashboardNotice {
  id: string;
  title: string;
  content: string;
  publisher: string;
  date: string;
}

export const dashboardAPI = {
  async getStats(period?: 'today' | 'week' | 'month'): Promise<ApiResponse<DashboardStats>> {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
      params: { period },
    });
    return data;
  },

  async getPendingTasks(): Promise<ApiResponse<{ tasks: DashboardTask[] }>> {
    const { data } = await apiClient.get<ApiResponse<{ tasks: DashboardTask[] }>>(
      '/dashboard/pending-tasks',
    );
    return data;
  },

  async getNotices(): Promise<ApiResponse<{ notices: DashboardNotice[] }>> {
    const { data } =
      await apiClient.get<ApiResponse<{ notices: DashboardNotice[] }>>('/dashboard/notices');
    return data;
  },
};

// ============================================================
// FollowUp API
// ============================================================

export type FollowUpStatus = 'pending' | 'overdue' | 'completed' | 'cancelled';
export type FollowUpRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FollowUpDoctorSummary {
  id: number;
  username?: string;
  real_name?: string;
}

export interface FollowUpPatientSummary {
  id: number;
  patient_id: string;
  name: string;
}

export interface FollowUpStudySummary {
  id: number;
  study_id: string;
  study_type?: string;
  study_date?: string;
}

export interface FollowUpItem {
  id: number;
  follow_up_id: string;
  patient_id: number;
  study_id?: number;
  created_by: number;
  assigned_doctor_id?: number;
  planned_date: string;
  recommended_interval_months?: number;
  risk_level_snapshot?: FollowUpRiskLevel;
  ai_flagged_high_attention: boolean;
  doctor_marked_high_attention: boolean;
  is_high_attention: boolean;
  status: FollowUpStatus;
  reason?: string;
  notes?: string;
  completed_at?: string;
  cancelled_at?: string;
  last_reminded_at?: string;
  created_at: string;
  updated_at: string;
  patient?: FollowUpPatientSummary;
  study?: FollowUpStudySummary;
  creator?: FollowUpDoctorSummary;
  assigned_doctor?: FollowUpDoctorSummary;
}

export interface FollowUpListData {
  followups: FollowUpItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateFollowUpPayload {
  patient_id: number;
  study_id?: number | null;
  planned_date?: string;
  assigned_doctor_id?: number | null;
  reason?: string;
  notes?: string;
  doctor_marked_high_attention?: boolean;
}

export interface UpdateFollowUpPayload {
  study_id?: number | null;
  planned_date?: string;
  assigned_doctor_id?: number | null;
  reason?: string;
  notes?: string;
  doctor_marked_high_attention?: boolean;
}

export const followUpAPI = {
  async createFollowUp(payload: CreateFollowUpPayload): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.post<ApiResponse<{ followup: FollowUpItem }>>(
      '/followups',
      payload,
    );
    return data;
  },

  async getFollowUps(params?: {
    page?: number;
    limit?: number;
    status?: FollowUpStatus;
    patient_id?: number;
    assigned_doctor_id?: number;
    high_attention?: boolean;
    date_from?: string;
    date_to?: string;
    keyword?: string;
  }): Promise<ApiResponse<FollowUpListData>> {
    const normalizedParams = {
      ...params,
      high_attention:
        typeof params?.high_attention === 'boolean'
          ? String(params.high_attention)
          : undefined,
    };
    const { data } = await apiClient.get<ApiResponse<FollowUpListData>>('/followups', {
      params: normalizedParams,
    });
    return data;
  },

  async getFollowUp(id: number): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.get<ApiResponse<{ followup: FollowUpItem }>>(`/followups/${id}`);
    return data;
  },

  async updateFollowUp(
    id: number,
    payload: UpdateFollowUpPayload,
  ): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.put<ApiResponse<{ followup: FollowUpItem }>>(
      `/followups/${id}`,
      payload,
    );
    return data;
  },

  async completeFollowUp(id: number): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.patch<ApiResponse<{ followup: FollowUpItem }>>(
      `/followups/${id}/complete`,
    );
    return data;
  },

  async cancelFollowUp(id: number): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.patch<ApiResponse<{ followup: FollowUpItem }>>(
      `/followups/${id}/cancel`,
    );
    return data;
  },

  async setHighAttention(id: number, marked: boolean): Promise<ApiResponse<{ followup: FollowUpItem }>> {
    const { data } = await apiClient.patch<ApiResponse<{ followup: FollowUpItem }>>(
      `/followups/${id}/high-attention`,
      { marked },
    );
    return data;
  },

  async remindNow(id: number): Promise<ApiResponse<{ notification: NotificationItem }>> {
    const { data } = await apiClient.post<ApiResponse<{ notification: NotificationItem }>>(
      `/followups/${id}/remind`,
    );
    return data;
  },
};

// ============================================================
// Patient Insights API
// ============================================================

export type PatientInsightRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PatientInsightTrend = 'up' | 'down' | 'stable' | 'insufficient';

export interface PatientInsightBasicPatient {
  id: number;
  patient_id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date?: string;
  phone?: string;
}

export interface PatientInsightOverviewData {
  patient: PatientInsightBasicPatient;
  summary: {
    total_studies: number;
    total_analyses: number;
    high_risk_analyses: number;
    pending_followups: number;
    overdue_followups: number;
    latest_study: null | {
      study_id: number;
      study_unique_id: string;
      study_date?: string;
      study_type?: string;
      status?: string;
      created_at?: string;
    };
    latest_analysis: null | {
      analysis_result_id: number;
      study_id: number;
      study_unique_id?: string;
      diagnosis?: string;
      confidence: number;
      risk_level: PatientInsightRiskLevel;
      analysis_at?: string;
    };
  };
  risk_profile: {
    score: number;
    level: PatientInsightRiskLevel;
    trend: PatientInsightTrend;
  };
}

export interface PatientInsightHistoryItem {
  analysis_result_id: number;
  study_id?: number;
  study_unique_id?: string;
  study_date?: string;
  study_type?: string;
  diagnosis?: string;
  risk_level: PatientInsightRiskLevel;
  confidence: number;
  recommendations: string[];
  analysis_at?: string;
}

export interface PatientInsightHistoryData {
  series: PatientInsightHistoryItem[];
  stats: {
    total_detections: number;
    first_detection_at?: string;
    latest_detection_at?: string;
    risk_distribution: Record<PatientInsightRiskLevel, number>;
    average_confidence: number;
    trend: PatientInsightTrend;
  };
}

export interface PatientInsightTaskSnapshot {
  task_id: string;
  status: string;
  progress?: number;
  created_at?: string;
  completed_at?: string;
}

export interface PatientInsightFollowupSnapshot {
  follow_up_id: string;
  status: string;
  planned_date?: string;
  is_high_attention: boolean;
}

export interface PatientInsightStudySnapshot {
  study_id: number;
  study_unique_id: string;
  study_date?: string;
  study_type?: string;
  study_status?: string;
  diagnosis?: string;
  risk_level: PatientInsightRiskLevel;
  confidence: number;
  recommendations: string[];
  analysis_at?: string;
  latest_task: PatientInsightTaskSnapshot | null;
  followup: PatientInsightFollowupSnapshot | null;
}

export interface PatientInsightCompareData {
  left: PatientInsightStudySnapshot;
  right: PatientInsightStudySnapshot;
  diff: {
    risk_delta: number;
    confidence_delta: number;
    diagnosis_changed: boolean;
    recommendation_added: string[];
    recommendation_removed: string[];
    summary: string[];
  };
}

export interface PatientInsightTimelineEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  title: string;
  description: string;
  risk_level?: PatientInsightRiskLevel;
  status?: string;
  meta?: Record<string, unknown>;
}

export interface PatientInsightTimelineData {
  items: PatientInsightTimelineEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PatientInsightRiskFactor {
  key: string;
  label: string;
  weight: number;
  score: number;
  value: string | number;
  description: string;
}

export interface PatientInsightRiskProfileData {
  score: number;
  level: PatientInsightRiskLevel;
  trend: PatientInsightTrend;
  factors: PatientInsightRiskFactor[];
  suggestions: string[];
  metrics: {
    total_analyses: number;
    high_risk_count: number;
    high_risk_ratio: number;
    overdue_followups: number;
    high_attention_followups: number;
    latest_analysis_at?: string;
  };
}

export const patientInsightsAPI = {
  async getOverview(patientId: number): Promise<ApiResponse<PatientInsightOverviewData>> {
    const { data } = await apiClient.get<ApiResponse<PatientInsightOverviewData>>(
      `/patient-insights/${patientId}/overview`,
    );
    return data;
  },

  async getHistory(
    patientId: number,
    params?: {
      limit?: number;
      date_from?: string;
      date_to?: string;
    },
  ): Promise<ApiResponse<PatientInsightHistoryData>> {
    const { data } = await apiClient.get<ApiResponse<PatientInsightHistoryData>>(
      `/patient-insights/${patientId}/history`,
      { params },
    );
    return data;
  },

  async getCompare(
    patientId: number,
    leftStudyId: number,
    rightStudyId: number,
  ): Promise<ApiResponse<PatientInsightCompareData>> {
    const { data } = await apiClient.get<ApiResponse<PatientInsightCompareData>>(
      `/patient-insights/${patientId}/compare`,
      {
        params: {
          left_study_id: leftStudyId,
          right_study_id: rightStudyId,
        },
      },
    );
    return data;
  },

  async getTimeline(
    patientId: number,
    params?: {
      page?: number;
      limit?: number;
      date_from?: string;
      date_to?: string;
    },
  ): Promise<ApiResponse<PatientInsightTimelineData>> {
    const { data } = await apiClient.get<ApiResponse<PatientInsightTimelineData>>(
      `/patient-insights/${patientId}/timeline`,
      { params },
    );
    return data;
  },

  async getRiskProfile(patientId: number): Promise<ApiResponse<PatientInsightRiskProfileData>> {
    const { data } = await apiClient.get<ApiResponse<PatientInsightRiskProfileData>>(
      `/patient-insights/${patientId}/risk-profile`,
    );
    return data;
  },
};

// ============================================================
// Notification API
// ============================================================

export type NotificationType =
  | 'followup_due'
  | 'followup_overdue'
  | 'followup_high_attention'
  | 'system';

export interface NotificationItem {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  related_type?: 'followup' | 'patient' | 'study';
  related_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationListData {
  notifications: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const notificationAPI = {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<NotificationListData>> {
    const { data } = await apiClient.get<ApiResponse<NotificationListData>>('/notifications', {
      params,
    });
    return data;
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const { data } = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count',
    );
    return data;
  },

  async markAsRead(id: number): Promise<ApiResponse<{ notification: NotificationItem }>> {
    const { data } = await apiClient.patch<ApiResponse<{ notification: NotificationItem }>>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async markAllAsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
    const { data } = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
      '/notifications/read-all',
    );
    return data;
  },
};

// ============================================================
// Payment API
// ============================================================

export const paymentAPI = {
  createOrder: (planType: string, paymentMethod: string) =>
    apiClient.post('/payment/create', { planType, paymentMethod }),

  getOrderStatus: (outTradeNo: string) => apiClient.get(`/payment/status/${outTradeNo}`),

  // 公开接口，不需要认证（使用独立请求避免携带 token）
  checkOrderStatus: (outTradeNo: string) =>
    apiClient.get(`${API_BASE_URL}/payment/check/${outTradeNo}`),

  getOrders: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/payment/orders', { params }),
};

export default apiClient;
