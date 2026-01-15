# 代码质量优化 - 中优先级（第二阶段）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 提升代码可维护性和可读性，建立清晰的类型系统，减少代码嵌套，提取共享工具函数。

**架构方案:**
1. 创建统一的类型定义目录结构，集中管理所有 TypeScript 类型
2. 提取共享工具函数（localStorage、数据映射等）
3. 重构深度嵌套的代码，使用提前返回和辅助函数

**技术栈:** Vue 3, Pinia, TypeScript, Quasar

**前置条件:** 完成高优先级优化（`2025-01-15-code-optimization-priority-high.md`）

---

## 任务 1: 建立统一的类型定义系统

**背景问题:**
- 类型定义散落在各服务文件中（`api.ts`, `apiService.ts`, 各 Store 文件）
- 相同类型在不同文件中重复定义
- 缺少统一的 API 响应类型

**解决策略:**
创建 `src/types/` 目录，按功能模块组织类型定义。

### 任务 1.1: 创建通用 API 类型

**Files:**
- Create: `src/types/api.ts`

**Step 1: 创建基础 API 响应类型**

```typescript
// src/types/api.ts

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 分页响应数据
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Step 2: 验证 TypeScript 类型**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误


---

### 任务 1.2: 创建认证相关类型

**Files:**
- Create: `src/types/auth.ts`

**Step 1: 创建认证类型定义**

```typescript
// src/types/auth.ts
import type { ApiResponse } from './api';

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'doctor' | 'user';

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'disabled';

/**
 * 用户信息
 */
export interface User {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  last_login_at?: string;
  // 别名字段，兼容不同 API 响应
  name?: string;
}

/**
 * 认证令牌数据
 */
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 登录响应
 */
export type LoginResponse = ApiResponse<AuthData>;

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  password: string;
  real_name?: string;
  phone?: string;
}

/**
 * 注册响应
 */
export type RegisterResponse = ApiResponse<AuthData>;

/**
 * 短信验证码登录请求
 */
export interface SmsLoginRequest {
  phone: string;
  code: string;
}

/**
 * 短信验证码注册请求
 */
export interface SmsRegisterRequest {
  phone: string;
  code: string;
  username?: string;
  real_name?: string;
  email?: string;
}

/**
 * 发送短信验证码请求
 */
export interface SendSmsCodeRequest {
  phone: string;
  type?: 'login' | 'register' | 'reset_password';
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  phone: string;
  code: string;
  newPassword: string;
}
```


---

### 任务 1.3: 创建患者相关类型

**Files:**
- Create: `src/types/patient.ts`

**Step 1: 创建患者类型定义**

```typescript
// src/types/patient.ts
import type { ApiResponse, PaginatedData } from './api';

/**
 * 患者性别
 */
export type PatientGender = 'male' | 'female' | 'other';

/**
 * 患者信息
 */
export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  gender?: PatientGender;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建患者请求
 */
export interface CreatePatientRequest {
  patient_id: string;
  name: string;
  gender?: PatientGender;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

/**
 * 更新患者请求
 */
export type UpdatePatientRequest = Partial<CreatePatientRequest>;

/**
 * 患者查询参数
 */
export interface PatientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: PatientGender;
}

/**
 * 患者列表响应
 */
export type PatientListResponse = ApiResponse<PaginatedData<Patient>>;

/**
 * 单个患者响应
 */
export type PatientResponse = ApiResponse<Patient>;
```



---

### 任务 1.4: 创建病例相关类型

**Files:**
- Create: `src/types/study.ts`

**Step 1: 创建病例类型定义**

```typescript
// src/types/study.ts
import type { ApiResponse, PaginatedData } from './api';
import type { AnalysisResult } from './analysis';

/**
 * 病例状态
 */
export type StudyStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 病例类型
 */
export type StudyType = 'cervical_cancer_screening' | 'hpv_test' | 'biopsy';

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 医学图像
 */
export interface StudyImage {
  id: number;
  file_path: string;
  original_filename: string;
  uploaded_at: string;
}

/**
 * 患者基本信息（病例中的引用）
 */
export interface StudyPatientInfo {
  id: number;
  name: string;
  patient_id: string;
}

/**
 * 病例信息
 */
export interface Study {
  id: number;
  study_id: string;
  patient_id: number;
  patient: StudyPatientInfo;
  patientName: string;
  patientId: string;
  study_date: string;
  status: StudyStatus;
  study_type: StudyType;
  modality: string;
  body_part: string;
  description?: string;
  images?: StudyImage[];
  imageUrl?: string;
  analysis_results?: AnalysisResult[];
  uploadedAt: string;
  created_at: string;
  taskId?: string;
  // 新增字段：报告中心所需
  downloaded?: boolean;
  downloaded_at?: string;
  diagnosis?: string;
  riskLevel?: RiskLevel;
}

/**
 * 创建病例请求
 */
export interface CreateStudyRequest {
  patient_id: number;
  study_date: string;
  study_type: StudyType;
  modality: string;
  body_part: string;
  description?: string;
}

/**
 * 更新病例请求
 */
export type UpdateStudyRequest = Partial<CreateStudyRequest>;

/**
 * 病例查询参数
 */
export interface StudyQueryParams {
  page?: number;
  limit?: number;
  patient_id?: number;
  status?: StudyStatus;
  study_type?: StudyType;
  search?: string;
}

/**
 * 病例列表响应
 */
export type StudyListResponse = ApiResponse<{ studies: Study[] }>;

/**
 * 单个病例响应
 */
export type StudyResponse = ApiResponse<Study>;
```


---

### 任务 1.5: 创建分析结果类型

**Files:**
- Create: `src/types/analysis.ts`

**Step 1: 创建分析结果类型定义**

```typescript
// src/types/analysis.ts
import type { ApiResponse, PaginatedData } from './api';

/**
 * 分析任务状态
 */
export type AnalysisTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 生物标志物结果
 */
export interface Biomarkers {
  HPV: string;
  p16: string;
  Ki67: string;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  id: number;
  task_id: string;
  study_id: number;
  status: AnalysisTaskStatus;
  progress?: number;
  diagnosis?: string;
  confidence?: number;
  suspiciousAreas?: string[];
  biomarkers?: Biomarkers;
  recommendations?: string[];
  detailedReport?: string;
  error_message?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * 创建分析任务请求
 */
export interface CreateAnalysisTaskRequest {
  study_id: number;
  model_name?: string;
  model_version?: string;
  priority?: string;
}

/**
 * 分析任务查询参数
 */
export interface AnalysisTaskQueryParams {
  page?: number;
  limit?: number;
  status?: AnalysisTaskStatus;
  study_id?: number;
  priority?: string;
}

/**
 * 分析任务列表响应
 */
export type AnalysisTaskListResponse = ApiResponse<PaginatedData<AnalysisResult>>;

/**
 * 单个分析任务响应
 */
export type AnalysisTaskResponse = ApiResponse<AnalysisResult>;
```



---

### 任务 1.6: 创建类型导出索引

**Files:**
- Create: `src/types/index.ts`

**Step 1: 创建类型导出文件**

```typescript
// src/types/index.ts

// 通用 API 类型
export * from './api';

// 认证类型
export * from './auth';

// 患者类型
export * from './patient';

// 病例类型
export * from './study';

// 分析结果类型
export * from './analysis';
```

**Step 2: 验证类型导出**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误



---

### 任务 1.7: 更新 authStore 使用统一类型

**Files:**
- Modify: `src/stores/authStore.ts`

**Step 1: 移除本地类型定义**

删除 `src/stores/authStore.ts` 中的 `User` 接口定义（第 6-18 行）。

**Step 2: 导入统一类型**

在文件顶部添加：

```typescript
import type {
  User,
  AuthData,
  LoginRequest,
  RegisterRequest,
  SmsLoginRequest,
  SmsRegisterRequest,
} from 'src/types';
```

**Step 3: 更新方法签名**

确保所有方法的参数类型使用导入的类型：

```typescript
async login(email: string, password: string) {
  // 方法内部实现不需要改变
}

async register(userData: RegisterRequest) {
  // ...
}

async smsLogin(phone: string, code: string) {
  // ...
}

async smsRegister(phone: string, code: string, userData?: Partial<SmsRegisterRequest>) {
  // ...
}
```

**Step 4: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 5: 测试认证功能**

手动测试所有认证流程
Expected: 所有功能正常



---

### 任务 1.8: 更新 studyStore 使用统一类型

**Files:**
- Modify: `src/stores/studyStore.ts`

**Step 1: 移除本地类型定义**

删除 `src/stores/studyStore.ts` 中的 `Study` 接口定义（第 23-46 行）。

**Step 2: 导入统一类型**

在文件顶部添加：

```typescript
import type {
  Study,
  StudyQueryParams,
  CreateStudyRequest,
  UpdateStudyRequest,
} from 'src/types';
import type { AnalysisResult } from 'src/types';
```

**Step 3: 更新 Store 的 state 类型**

```typescript
state: () => ({
  studies: [] as Study[],
  currentStudy: null as Study | null,
  loading: false,
  error: null as string | null,
}),
```

**Step 4: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 5: 测试病例功能**

手动测试病例 CRUD 操作
Expected: 所有功能正常



---

### 任务 1.9: 更新 API 服务使用统一类型

**Files:**
- Modify: `src/services/api.ts`

**Step 1: 为 API 函数添加类型注解**

更新 `authAPI` 的函数签名：

```typescript
import type {
  LoginRequest,
  RegisterRequest,
  SmsLoginRequest,
  SmsRegisterRequest,
  SendSmsCodeRequest,
  ResetPasswordRequest,
  LoginResponse,
  RegisterResponse,
  ApiResponse,
  User,
} from 'src/types';

export const authAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  async logout(): Promise<ApiResponse> {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  async sendSmsCode(params: SendSmsCodeRequest): Promise<ApiResponse> {
    const { data } = await apiClient.post('/auth/sms/send-code', params);
    return data;
  },

  async smsLogin(params: SmsLoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post('/auth/sms/login', params);
    return data;
  },

  async smsRegister(params: SmsRegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post('/auth/sms/register', params);
    return data;
  },

  async resetPassword(params: ResetPasswordRequest): Promise<ApiResponse> {
    const { data } = await apiClient.post('/auth/sms/reset-password', params);
    return data;
  },
};
```

**Step 2: 更新其他 API 模块**

为 `patientAPI`, `studyAPI`, `analysisTaskAPI` 应用相同的类型注解模式。

**Step 3: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 4: 测试 API 调用**

手动测试各种 API 调用
Expected: 所有功能正常，类型提示正确

**Step 5: 移除 eslint-disable 注释**

删除不必要的 `/* eslint-disable @typescript-eslint/no-explicit-any */` 注释。



---

## 任务 2: 创建共享工具函数库

**背景问题:**
- localStorage 操作在多个地方重复
- 数据映射逻辑重复（studyStore 中的 mapStudyData）
- 缺少统一的数据验证和转换工具

**解决策略:**
创建 `src/utils/` 目录下的工具函数模块。

### 任务 2.1: 创建 localStorage 工具

**Files:**
- Create: `src/utils/storage.ts`

**Step 1: 创建存储工具**

```typescript
// src/utils/storage.ts

/**
 * 本地存储键名
 */
export const StorageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 获取存储项
   */
  get<T = string>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // 尝试解析 JSON
      if (item.startsWith('{') || item.startsWith('[')) {
        return JSON.parse(item) as T;
      }

      return item as T;
    } catch {
      return null;
    }
  },

  /**
   * 设置存储项
   */
  set(key: string, value: string | object): void {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  },

  /**
   * 移除存储项
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * 清空所有存储项
   */
  clear(): void {
    localStorage.clear();
  },

  /**
   * 保存认证信息
   */
  saveAuth(accessToken: string, refreshToken: string, user: unknown): void {
    this.set(StorageKeys.ACCESS_TOKEN, accessToken);
    this.set(StorageKeys.REFRESH_TOKEN, refreshToken);
    this.set(StorageKeys.USER, user);
  },

  /**
   * 获取认证信息
   */
  getAuth(): { accessToken?: string; refreshToken?: string; user?: unknown } {
    return {
      accessToken: this.get(StorageKeys.ACCESS_TOKEN) || undefined,
      refreshToken: this.get(StorageKeys.REFRESH_TOKEN) || undefined,
      user: this.get(StorageKeys.USER),
    };
  },

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    this.remove(StorageKeys.ACCESS_TOKEN);
    this.remove(StorageKeys.REFRESH_TOKEN);
    this.remove(StorageKeys.USER);
  },
};
```



---

### 任务 2.2: 更新 authStore 使用存储工具

**Files:**
- Modify: `src/stores/authStore.ts`

**Step 1: 导入存储工具**

在文件顶部添加：

```typescript
import { storage, StorageKeys } from 'src/utils/storage';
```

**Step 2: 重构 _saveAuthData 方法**

```typescript
_saveAuthData(data: { accessToken: string; refreshToken: string; user: User }) {
  this.token = data.accessToken;
  this.refreshToken = data.refreshToken;
  this.user = data.user;
  this.isAuthenticated = true;
  storage.saveAuth(data.accessToken, data.refreshToken, data.user);
}
```

**Step 3: 重构 initializeAuth 方法**

```typescript
initializeAuth() {
  const auth = storage.getAuth();
  if (auth.accessToken && auth.user) {
    this.token = auth.accessToken;
    this.refreshToken = auth.refreshToken || null;
    this.user = auth.user as User;
    this.isAuthenticated = true;
  }
}
```

**Step 4: 重构 clearAuthData 方法**

```typescript
clearAuthData() {
  this.user = null;
  this.token = null;
  this.refreshToken = null;
  this.isAuthenticated = false;
  storage.clearAuth();
}
```

**Step 5: 重构 setAuthData 方法**

```typescript
setAuthData(token: string, refreshToken: string, user: User) {
  this._saveAuthData({ accessToken: token, refreshToken, user });
}
```

**Step 6: 测试认证功能**

手动测试登录、登出、页面刷新
Expected: 所有功能正常



---

### 任务 2.3: 创建数据映射工具

**Files:**
- Create: `src/utils/mappers.ts`

**Step 1: 创建数据映射工具**

```typescript
// src/utils/mappers.ts
import type { Study, StudyImage } from 'src/types';

/**
 * 将相对路径转换为完整URL
 */
export function getImageUrl(
  filePath: string | undefined,
  serverBaseUrl?: string,
): string | undefined {
  if (!filePath) return undefined;

  // 如果已经是完整URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // 从环境变量获取服务器地址
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const SERVER_BASE_URL = serverBaseUrl || API_BASE_URL.replace('/api', '');

  // 拼接服务器地址
  return `${SERVER_BASE_URL}${filePath}`;
}

/**
 * 映射后端病例数据到前端格式
 */
export function mapStudyData(rawStudy: any): Study {
  const imageUrl = getImageUrl(rawStudy.images?.[0]?.file_path);

  return {
    id: rawStudy.id,
    study_id: rawStudy.study_id,
    patient_id: rawStudy.patient_id,
    patient: rawStudy.patient,
    patientName: rawStudy.patient?.name || '',
    patientId: rawStudy.patient?.patient_id || '',
    studyDate: rawStudy.study_date,
    status: rawStudy.status,
    study_type: rawStudy.study_type,
    modality: rawStudy.study_type,
    bodyPart: '宫颈',
    description: rawStudy.description,
    imageUrl,
    images: rawStudy.images,
    analysisResult: undefined, // 将在单独的方法中处理
    uploadedAt: rawStudy.created_at,
    created_at: rawStudy.created_at,
    taskId: rawStudy.task_id,
    downloaded: rawStudy.downloaded,
    downloaded_at: rawStudy.downloaded_at,
    diagnosis: rawStudy.diagnosis,
    riskLevel: rawStudy.riskLevel,
  };
}

/**
 * 映射病例列表
 */
export function mapStudyList(rawStudies: any[]): Study[] {
  return rawStudies.map(mapStudyData);
}

/**
 * 格式化日期为本地字符串
 */
export function formatDateToLocal(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 计算年龄
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
```


---

### 任务 2.4: 更新 studyStore 使用映射工具

**Files:**
- Modify: `src/stores/studyStore.ts`

**Step 1: 移除本地映射函数**

删除 `src/stores/studyStore.ts` 中的 `getImageUrl` 函数（第 13-21 行）。

**Step 2: 导入映射工具**

在文件顶部添加：

```typescript
import { mapStudyData, getImageUrl } from 'src/utils/mappers';
```

**Step 3: 更新 fetchStudies 方法**

在 `fetchStudies` 方法中，替换映射代码：

```typescript
async fetchStudies(params?: StudyQueryParams) {
  this.loading = true;
  this.error = null;

  const result = await handleApiCall(
    () => studyAPI.getStudies(params),
    '获取病例列表失败',
  );

  this.loading = false;

  if (result.success && result.data) {
    this.studies = mapStudyList(result.data.studies);
  } else {
    this.error = result.error;
  }

  return result;
}
```

**Step 4: 更新 loadStudyById 方法**

应用相同的映射模式。

**Step 5: 测试病例功能**

手动测试病例列表和详情页
Expected: 数据显示正常



---

### 任务 2.5: 创建验证工具

**Files:**
- Create: `src/utils/validators.ts`

**Step 1: 创建验证工具**

```typescript
// src/utils/validators.ts

/**
 * 验证电子邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证密码强度
 * 至少8个字符，包含字母和数字
 */
export function isStrongPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * 验证身份证号（中国大陆）
 */
export function isValidIdNumber(idNumber: string): boolean {
  const idRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return idRegex.test(idNumber);
}

/**
 * 验证患者ID格式
 */
export function isValidPatientId(patientId: string): boolean {
  // 患者ID应该是字母数字组合，至少3个字符
  const patientIdRegex = /^[A-Za-z0-9]{3,}$/;
  return patientIdRegex.test(patientId);
}

/**
 * 验证字符串是否为空
 */
export function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * 验证年龄范围
 */
export function isValidAge(age: number): boolean {
  return age >= 0 && age <= 150;
}
```



---

### 任务 2.6: 创建工具函数导出索引

**Files:**
- Create: `src/utils/index.ts`

**Step 1: 创建导出文件**

```typescript
// src/utils/index.ts

// 错误处理
export * from './errorHandler';

// 日志
export * from './logger';

// 存储
export * from './storage';

// 数据映射
export * from './mappers';

// 验证
export * from './validators';
```

**Step 2: 验证导出**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误



---

## 任务 3: 减少代码嵌套深度

**背景问题:**
- `loadStudyById` 方法有 3-4 层嵌套（130-217 行）
- `LoginPage.vue` 中有三重条件判断（342-397 行）
- 深度嵌套影响代码可读性

**解决策略:**
使用提前返回（guard clauses）、提取辅助函数、使用可选链。

### 任务 3.1: 重构 loadStudyById 方法

**Files:**
- Modify: `src/stores/studyStore.ts:130-217`

**Step 1: 提取分析结果映射函数**

在文件顶部的辅助函数区域添加：

```typescript
/**
 * 映射分析结果
 */
function mapAnalysisResult(latestResult: any): AnalysisResult | undefined {
  if (!latestResult) return undefined;

  return {
    id: latestResult.id,
    task_id: latestResult.task_id,
    study_id: latestResult.study_id,
    status: latestResult.status,
    progress: latestResult.progress,
    diagnosis: latestResult.diagnosis,
    confidence: latestResult.confidence,
    suspiciousAreas: latestResult.suspicious_areas || [],
    biomarkers: latestResult.biomarkers || undefined,
    recommendations: latestResult.recommendations || [],
    detailedReport: latestResult.detailed_report,
    completedAt: latestResult.completed_at,
    createdAt: latestResult.created_at,
  };
}
```

**Step 2: 简化 loadStudyById 方法**

使用提前返回和辅助函数：

```typescript
async loadStudyById(id: number, forceRefresh = false) {
  // 检查缓存
  const existingStudy = this.studies.find((study) => study.id === id);
  if (existingStudy && !forceRefresh) {
    this.currentStudy = existingStudy;
    return existingStudy;
  }

  // 从服务器获取
  this.loading = true;
  this.error = null;

  const result = await handleApiCall(
    () => studyAPI.getStudy(id),
    '获取病例详情失败',
  );

  this.loading = false;

  if (!result.success || !result.data) {
    this.error = result.error || '获取病例详情失败';
    return null;
  }

  // 映射数据
  const study = mapStudyData(result.data.study);

  // 映射分析结果
  const latestResult = result.data.study.analysis_results?.[0];
  if (latestResult) {
    study.analysisResult = mapAnalysisResult(latestResult);
  }

  // 更新状态
  this.currentStudy = study;

  // 更新列表中的记录
  const index = this.studies.findIndex((s) => s.id === id);
  if (index !== -1) {
    this.studies[index] = study;
  } else {
    this.studies.push(study);
  }

  return study;
}
```

**Step 3: 测试功能**

手动测试病例详情页加载
Expected: 功能正常



---

### 任务 3.2: 重构 LoginPage 中的短信登录逻辑

**Files:**
- Modify: `src/pages/LoginPage.vue:342-397`

**Step 1: 提取自动注册逻辑**

创建新的辅助函数：

```typescript
// 在 script setup 中添加
async function ensureUserRegistered(phone: string, smsCode: string) {
  const result = await authStore.smsLogin(phone, smsCode);

  // 如果用户未注册，自动注册
  if (!result.success && result.error?.includes('未注册')) {
    console.log('📝 手机号未注册，自动注册...');
    $q.notify({
      type: 'info',
      message: '手机号未注册，正在自动注册...',
      position: 'top',
    });

    return await authStore.smsRegister(phone, smsCode, {
      username: phone,
    });
  }

  return result;
}
```

**Step 2: 简化 onSmsLogin 函数**

```typescript
const onSmsLogin = async () => {
  if (!isValidPhone(phone.value)) {
    $q.notify({
      type: 'warning',
      message: '请输入正确的手机号',
      position: 'top',
    });
    return;
  }

  if (!smsCode.value) {
    $q.notify({
      type: 'warning',
      message: '请输入验证码',
      position: 'top',
    });
    return;
  }

  loading.value = true;

  try {
    const result = await ensureUserRegistered(phone.value, smsCode.value);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '登录成功',
        position: 'top',
      });
      await router.push('/dashboard');
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || '登录失败',
        position: 'top',
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '登录失败，请稍后重试',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};
```

**Step 3: 测试短信登录**

手动测试短信验证码登录流程
Expected: 功能正常



---

### 任务 3.3: 使用可选链简化属性访问

**Files:**
- Modify: `src/stores/studyStore.ts`
- Modify: `src/stores/patientStore.ts`
- Modify: `src/stores/analysisStore.ts`

**Step 1: 查找所有深度嵌套的属性访问**

搜索模式：
- `response.data?.data?.accessToken`
- `study.patient?.name || ''`
- `rawStudy.images?.[0]?.file_path`

**Step 2: 应用可选链和空值合并**

将：
```typescript
const name = study.patient && study.patient.name ? study.patient.name : '';
```

改为：
```typescript
const name = study.patient?.name ?? '';
```

**Step 3: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 4: 测试应用**

手动测试所有功能
Expected: 无运行时错误



---

## 验收测试

### 测试 1: 类型系统验证

**Step 1: 运行完整类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 2: 验证类型导出**

创建临时测试文件 `src/types/test.ts`：

```typescript
import type { User, Study, Patient, AnalysisResult } from 'src/types';

// 确保所有类型都可以正确导入
const testUser: User = {} as User;
const testStudy: Study = {} as Study;
const testPatient: Patient = {} as Patient;
const testAnalysis: AnalysisResult = {} as AnalysisResult;

console.log('Types import test passed');
```

Run: `npx vue-tsc --noEmit`
Expected: 无错误

**Step 3: 删除测试文件**

```bash
rm src/types/test.ts
```

---

### 测试 2: 工具函数测试

**Step 1: 测试存储工具**

在浏览器控制台测试：
```javascript
import { storage } from 'src/utils/storage';

storage.set('test', { foo: 'bar' });
console.log(storage.get('test')); // 应该输出 { foo: 'bar' }
storage.remove('test');
console.log(storage.get('test')); // 应该输出 null
```

Expected: 所有操作正常

**Step 2: 测试映射工具**

```javascript
import { mapStudyData, getImageUrl } from 'src/utils/mappers';

const testStudy = {
  id: 1,
  study_id: 'ST001',
  patient_id: 1,
  patient: { name: '张三', patient_id: 'P001' },
  study_date: '2025-01-15',
  status: 'completed',
  study_type: 'cervical_cancer_screening',
  created_at: '2025-01-15T10:00:00Z',
};

const mapped = mapStudyData(testStudy);
console.log(mapped);
```

Expected: 数据正确映射

**Step 3: 测试验证工具**

```javascript
import { isValidEmail, isValidPhone, isStrongPassword } from 'src/utils/validators';

console.log(isValidEmail('test@example.com')); // true
console.log(isValidEmail('invalid')); // false
console.log(isValidPhone('13800138000')); // true
console.log(isValidPhone('123')); // false
console.log(isStrongPassword('Abc12345')); // true
console.log(isStrongPassword('weak')); // false
```

Expected: 所有验证函数正确

---

### 测试 3: 代码嵌套深度检查

**Step 1: 检查最大嵌套深度**

Run: 使用 ESLint 的 max-depth 规则或手动检查
Expected: 没有超过 4 层的嵌套

**Step 2: 检查函数复杂度**

Run: `npx eslint src/stores/*.ts --rule "max-depth: [error, 4]"`
Expected: 无 max-depth 错误

**Step 3: 代码审查**

手动审查重构后的代码
Expected: 代码更易读，逻辑清晰

---

### 测试 4: 完整功能测试

**Step 1: 测试用户管理**

- 注册新用户
- 登录
- 查看个人资料
- 更新个人资料
- 登出

Expected: 所有功能正常

**Step 2: 测试患者管理**

- 创建患者
- 搜索患者
- 更新患者信息
- 删除患者

Expected: 所有功能正常，类型提示正确

**Step 3: 测试病例管理**

- 创建病例
- 上传图像
- 查看病例列表
- 查看病例详情
- 分析图像

Expected: 所有功能正常，数据映射正确

---

## 完成检查清单

- [ ] 所有类型定义集中在 `src/types/` 目录
- [ ] 所有 Store 使用统一类型定义
- [ ] 所有 API 服务有完整的类型注解
- [ ] localStorage 操作使用统一工具
- [ ] 数据映射逻辑提取到共享工具
- [ ] 验证工具函数齐全
- [ ] 没有超过 4 层的代码嵌套
- [ ] 所有功能测试通过
- [ ] TypeScript 类型检查无错误
- [ ] 代码审查通过

---

## 后续步骤

完成中优先级优化后，继续执行：

**下一步:** `docs/plans/2025-01-15-code-optimization-priority-low.md`
