# 代码质量优化 - 低优先级（第三阶段）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 完善代码规范、优化命名、增强类型安全、提升代码文档和可维护性。

**架构方案:**
1. 统一变量和函数命名规范
2. 移除所有 eslint-disable 注释，完善类型定义
3. 添加 JSDoc 文档注释
4. 优化导入语句和代码组织

**技术栈:** Vue 3, Pinia, TypeScript, Quasar, ESLint

**前置条件:** 完成高优先级和中优先级优化

---

## 任务 1: 统一命名规范

**背景问题:**
- 变量命名不一致（如 `numId` vs `parsedId`, `conf` vs `confidence`）
- 缩写过多影响可读性
- 魔法数字未定义为常量

**解决策略:**
建立并应用一致的命名规范。

### 任务 1.1: 重命名缩写变量为完整单词

**Files:**
- Modify: `src/stores/studyStore.ts`
- Modify: `src/components/studies/ImageAnalyzer.vue`

**Step 1: 查找所有缩写变量**

搜索模式：
- `numId` → `parsedId`
- `conf` → `confidence`
- `errMsg` → `errorMessage`
- `resp` → `response`
- `req` → `request`

**Step 2: 重命名 studyStore 中的变量**

在 `src/stores/studyStore.ts` 中：

```typescript
// 修改前
const numId = parseInt(id);

// 修改后
const parsedId = parseInt(id);
```

**Step 3: 重命名 ImageAnalyzer 中的变量**

在 `src/components/studies/ImageAnalyzer.vue` 中：

```typescript
// 修改前
const conf = confidence ?? 0.5;

// 修改后
const confidenceValue = confidence ?? 0.5;
```

**Step 4: 验证功能**

Run: `npm run dev`
手动测试相关功能
Expected: 所有功能正常

**Step 5: Git commit**

```bash
git add src/stores/studyStore.ts src/components/studies/ImageAnalyzer.vue
git commit -m "refactor: rename abbreviated variables to full words"
```

---

### 任务 1.2: 定义魔法数字为命名常量

**Files:**
- Modify: `src/components/studies/ImageAnalyzer.vue`
- Modify: `src/services/apiService.ts`
- Create: `src/constants/index.ts`

**Step 1: 创建常量定义文件**

```typescript
// src/constants/index.ts

/**
 * 轮询配置
 */
export const POLLING = {
  DEFAULT_INTERVAL: 2000, // 2秒
  MAX_ATTEMPTS: 150, // 5分钟
  TIMEOUT: 300000, // 5分钟（毫秒）
} as const;

/**
 * 图像分析配置
 */
export const IMAGE_ANALYSIS = {
  DEFAULT_CONFIDENCE: 0.5,
  MIN_CONFIDENCE: 0,
  MAX_CONFIDENCE: 1,
} as const;

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * 用户角色
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  USER: 'user',
} as const;

/**
 * 用户状态
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

/**
 * 病例状态
 */
export const STUDY_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * 风险等级
 */
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
```

**Step 2: 更新 apiService.ts 使用常量**

在 `src/services/apiService.ts` 中：

```typescript
import { POLLING } from 'src/constants';

// 使用常量
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (status: TaskStatusResponse) => void,
  interval = POLLING.DEFAULT_INTERVAL,
  maxAttempts = POLLING.MAX_ATTEMPTS,
): Promise<TaskStatusResponse> {
  // ...
}
```

**Step 3: 更新 ImageAnalyzer.vue 使用常量**

在 `src/components/studies/ImageAnalyzer.vue` 中：

```typescript
import { IMAGE_ANALYSIS } from 'src/constants';

// 使用常量
const confidenceValue = confidence ?? IMAGE_ANALYSIS.DEFAULT_CONFIDENCE;
```

**Step 4: Git commit**

```bash
git add src/constants/index.ts src/services/apiService.ts src/components/studies/ImageAnalyzer.vue
git commit -m "refactor: define magic numbers as named constants"
```

---

### 任务 1.3: 统一文件命名规范

**Files:** Multiple files to rename

**Step 1: 检查文件命名一致性**

确保所有文件遵循：
- 组件文件：PascalCase（如 `PatientForm.vue`）
- 工具文件：camelCase（如 `errorHandler.ts`）
- 类型文件：camelCase（如 `auth.ts`）
- 常量文件：camelCase（如 `index.ts`）

**Step 2: 重命名不符合规范的文件**

如果有文件不符合规范，进行重命名：

```bash
# 示例：如果有下划线命名的文件
git mv src/services/my_service.ts src/services/myService.ts
```

**Step 3: 更新所有导入语句**

确保所有导入语句使用新的文件名。

**Step 4: 验证编译**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

**Step 5: Git commit**

```bash
git add .
git commit -m "refactor: standardize file naming conventions"
```

---

## 任务 2: 移除 eslint-disable 并完善类型

**背景问题:**
- 多处使用 `/* eslint-disable @typescript-eslint/no-explicit-any */`
- 使用 `any` 类型逃避类型检查
- 缺少精确的类型定义

**解决策略:**
定义精确的类型替代 `any`，移除所有 eslint-disable 注释。

### 任务 2.1: 完善 patientService 类型

**Files:**
- Modify: `src/services/patientService.ts`

**Step 1: 查看当前的 any 使用情况**

找到所有使用 `any` 的地方。

**Step 2: 定义精确类型**

如果 `patientService.ts` 存在，为其添加精确的类型定义：

```typescript
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientQueryParams,
  PatientListResponse,
  PatientResponse,
} from 'src/types';

export const patientService = {
  async createPatient(data: CreatePatientRequest): Promise<PatientResponse> {
    // 实现
  },

  async getPatients(params?: PatientQueryParams): Promise<PatientListResponse> {
    // 实现
  },

  async getPatientById(id: number): Promise<PatientResponse> {
    // 实现
  },

  async updatePatient(id: number, data: UpdatePatientRequest): Promise<PatientResponse> {
    // 实现
  },

  async deletePatient(id: number): Promise<{ success: boolean }> {
    // 实现
  },
};
```

**Step 3: 移除 eslint-disable 注释**

删除文件顶部的 `/* eslint-disable @typescript-eslint/no-explicit-any */`。

**Step 4: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 5: Git commit**

```bash
git add src/services/patientService.ts
git commit -m "types(patientService): replace 'any' with proper types"
```

---

### 任务 2.2: 完善 modelService 类型

**Files:**
- Modify: `src/services/modelService.ts`

**Step 1: 定义模型相关类型**

创建 `src/types/model.ts`：

```typescript
// src/types/model.ts
import type { ApiResponse, PaginatedData } from './api';

/**
 * AI 模型信息
 */
export interface Model {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: 'active' | 'deprecated' | 'experimental';
  accuracy?: number;
  created_at: string;
}

/**
 * 模型查询参数
 */
export interface ModelQueryParams {
  status?: string;
  version?: string;
}

/**
 * 模型列表响应
 */
export type ModelListResponse = ApiResponse<PaginatedData<Model>>;
```

**Step 2: 更新 modelService.ts 使用类型**

```typescript
import type { Model, ModelQueryParams, ModelListResponse } from 'src/types';

export const modelService = {
  async getModels(params?: ModelQueryParams): Promise<ModelListResponse> {
    // 实现时使用精确类型
  },

  async getModelById(id: string): Promise<ApiResponse<Model>> {
    // 实现
  },
};
```

**Step 3: 移除 eslint-disable**

删除所有 `/* eslint-disable */` 注释。

**Step 4: Git commit**

```bash
git add src/types/model.ts src/services/modelService.ts
git commit -m "types(modelService): replace 'any' with proper types"
```

---

### 任务 2.3: 完善 Store 中的类型

**Files:**
- Modify: `src/stores/patientStore.ts`
- Modify: `src/stores/studyStore.ts`
- Modify: `src/stores/analysisStore.ts`
- Modify: `src/stores/modelStore.ts`

**Step 1: 为 patientStore 添加精确类型**

```typescript
import type { Patient, CreatePatientRequest, UpdatePatientRequest } from 'src/types';

export const usePatientStore = defineStore('patient', {
  state: () => ({
    patients: [] as Patient[],
    currentPatient: null as Patient | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async createPatient(data: CreatePatientRequest): Promise<Patient> {
      // 使用精确类型
    },

    async updatePatient(id: number, data: UpdatePatientRequest): Promise<Patient> {
      // 使用精确类型
    },
  },
});
```

**Step 2: 移除所有 eslint-disable 注释**

逐个文件删除 `/* eslint-disable @typescript-eslint/no-explicit-any */`。

**Step 3: 修复类型错误**

根据 TypeScript 错误提示，修复所有类型问题。

**Step 4: 验证类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无 `any` 类型相关错误

**Step 5: Git commit**

```bash
git add src/stores/*.ts
git commit -m "types(stores): remove all 'any' types and eslint-disable comments"
```

---

### 任务 2.4: 完善 API 服务中的类型

**Files:**
- Modify: `src/services/api.ts`

**Step 1: 为所有 API 函数添加精确类型**

确保每个 API 函数都有明确的返回类型：

```typescript
import type {
  // ... 导入所有需要的类型
} from 'src/types';

export const reportAPI = {
  async createReport(reportData: CreateReportRequest): Promise<ReportResponse> {
    const { data } = await apiClient.post('/reports', reportData);
    return data;
  },

  async generateReport(studyId: number): Promise<ReportResponse> {
    const { data } = await apiClient.post(`/reports/generate/${studyId}`);
    return data;
  },

  async getReports(params?: ReportQueryParams): Promise<ReportListResponse> {
    const { data } = await apiClient.get('/reports', { params });
    return data;
  },
};
```

**Step 2: 移除 eslint-disable 注释**

删除文件顶部的所有 `/* eslint-disable */` 注释。

**Step 3: 定义缺失的类型**

如果有缺少的类型，在 `src/types/` 中添加相应定义。

**Step 4: 验证编译**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 5: Git commit**

```bash
git add src/services/api.ts src/types/*.ts
git commit -m "types(api): add precise return types for all API functions"
```

---

## 任务 3: 添加 JSDoc 文档注释

**背景问题:**
- 大部分函数缺少文档注释
- 复杂逻辑没有说明
- 参数和返回值缺少描述

**解决策略:**
为所有公共函数和复杂逻辑添加 JSDoc 注释。

### 任务 3.1: 为工具函数添加文档

**Files:**
- Modify: `src/utils/errorHandler.ts`
- Modify: `src/utils/storage.ts`
- Modify: `src/utils/mappers.ts`
- Modify: `src/utils/validators.ts`

**Step 1: 为 errorHandler 添加文档**

```typescript
/**
 * 错误处理工具模块
 * @module utils/errorHandler
 */

import type { ApiResponse } from 'src/types';

/**
 * API 错误响应接口
 */
export interface ApiError {
  success: false;
  error: string;
}

/**
 * API 成功响应接口
 * @template T - 响应数据类型
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * API 结果类型，可能是成功或失败
 * @template T - 成功时的数据类型
 */
export type ApiResult<T> = ApiError | ApiSuccess<T>;

/**
 * 统一的 API 调用错误处理包装器
 *
 * 将可能抛出异常的 API 调用转换为统一的 { success, data?, error? } 格式
 *
 * @template T - 成功响应的数据类型
 * @param operation - 要执行的 API 操作
 * @param defaultErrorMessage - 操作失败时的默认错误消息
 * @returns Promise<ApiResult<T>> - 统一格式的结果对象
 *
 * @example
 * ```typescript
 * const result = await handleApiCall(
 *   () => patientAPI.createPatient(data),
 *   '创建患者失败'
 * );
 *
 * if (result.success) {
 *   console.log('患者ID:', result.data.id);
 * } else {
 *   console.error('错误:', result.error);
 * }
 * ```
 */
export async function handleApiCall<T>(
  operation: () => Promise<ApiResponse<T>>,
  defaultErrorMessage = '操作失败',
): Promise<ApiResult<T>> {
  try {
    const response = await operation();

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.message || defaultErrorMessage };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : error instanceof Error
          ? error.message
          : defaultErrorMessage;

    return { success: false, error: errorMessage || defaultErrorMessage };
  }
}

/**
 * 从错误对象中提取用户友好的错误消息
 *
 * @param error - 错误对象（可以是任何类型）
 * @returns string - 用户友好的错误消息
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   notify(message, 'error');
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || '发生未知错误';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '发生未知错误';
}
```

**Step 2: 为 storage 添加文档**

```typescript
/**
 * 本地存储工具模块
 * @module utils/storage
 */

/**
 * 本地存储键名常量
 */
export const StorageKeys = {
  /** 访问令牌 */
  ACCESS_TOKEN: 'accessToken',
  /** 刷新令牌 */
  REFRESH_TOKEN: 'refreshToken',
  /** 用户信息 */
  USER: 'user',
} as const;

/**
 * 本地存储工具类
 *
 * 提供类型安全的 localStorage 操作方法
 */
export const storage = {
  /**
   * 从 localStorage 获取存储项
   *
   * @template T - 返回值类型
   * @param key - 存储键名
   * @returns 存储的值，如果不存在或解析失败则返回 null
   *
   * @example
   * ```typescript
   * const user = storage.get<User>('user');
   * if (user) {
   *   console.log('用户名:', user.username);
   * }
   * ```
   */
  get<T = string>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      if (item.startsWith('{') || item.startsWith('[')) {
        return JSON.parse(item) as T;
      }

      return item as T;
    } catch {
      return null;
    }
  },

  /**
   * 向 localStorage 设置存储项
   *
   * @param key - 存储键名
   * @param value - 要存储的值（字符串或对象）
   *
   * @example
   * ```typescript
   * storage.set('user', { name: '张三', age: 30 });
   * storage.set('token', 'abc123');
   * ```
   */
  set(key: string, value: string | object): void {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  },

  // ... 为其他方法添加类似的文档
};
```

**Step 3: 为 validators 添加文档**

```typescript
/**
 * 验证工具模块
 * @module utils/validators
 */

/**
 * 验证电子邮箱格式
 *
 * @param email - 要验证的电子邮箱地址
 * @returns true 如果格式有效，否则返回 false
 *
 * @example
 * ```typescript
 * isValidEmail('test@example.com') // true
 * isValidEmail('invalid') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 *
 * @param phone - 要验证的手机号
 * @returns true 如果格式有效，否则返回 false
 *
 * @example
 * ```typescript
 * isValidPhone('13800138000') // true
 * isValidPhone('123') // false
 * ```
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证密码强度
 *
 * 密码要求：
 * - 至少 8 个字符
 * - 包含字母
 * - 包含数字
 * - 可以包含特殊字符 @$!%*#?&
 *
 * @param password - 要验证的密码
 * @returns true 如果密码强度满足要求，否则返回 false
 *
 * @example
 * ```typescript
 * isStrongPassword('Abc12345') // true
 * isStrongPassword('weak') // false
 * ```
 */
export function isStrongPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
}
```

**Step 4: Git commit**

```bash
git add src/utils/*.ts
git commit -m "docs(utils): add comprehensive JSDoc documentation"
```

---

### 任务 3.2: 为 Store 添加文档

**Files:**
- Modify: `src/stores/authStore.ts`
- Modify: `src/stores/patientStore.ts`
- Modify: `src/stores/studyStore.ts`

**Step 1: 为 authStore 添加文档**

```typescript
/**
 * 认证状态管理 Store
 *
 * 管理用户认证状态、登录、注册、登出等操作
 *
 * @module stores/authStore
 */
import { defineStore } from 'pinia';
import type { User, AuthData } from 'src/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** 当前登录用户 */
    user: null as User | null,
    /** 访问令牌 */
    token: null as string | null,
    /** 刷新令牌 */
    refreshToken: null as string | null,
    /** 是否已认证 */
    isAuthenticated: false,
    /** 是否正在进行认证操作 */
    isAuthenticating: false,
  }),

  getters: {
    /**
     * 检查用户是否已登录
     */
    isLoggedIn: (state) => !!state.token,

    /**
     * 获取当前用户
     */
    currentUser: (state) => state.user,

    /**
     * 获取认证令牌
     */
    authToken: (state) => state.token,
  },

  actions: {
    /**
     * 用户登录
     *
     * @param email - 用户电子邮箱
     * @param password - 用户密码
     * @returns 登录结果
     */
    async login(email: string, password: string) {
      return this._executeAuth(
        () => authAPI.login(email, password),
        '登录失败',
      );
    },

    /**
     * 用户注册
     *
     * @param userData - 注册数据
     * @returns 注册结果
     */
    async register(userData: RegisterRequest) {
      return this._executeAuth(
        () => authAPI.register(userData),
        '注册失败',
      );
    },

    // ... 为其他方法添加文档
  },
});
```

**Step 2: 为 patientStore 添加文档**

应用相同的文档模式。

**Step 3: 为 studyStore 添加文档**

应用相同的文档模式。

**Step 4: Git commit**

```bash
git add src/stores/*.ts
git commit -m "docs(stores): add JSDoc documentation for all stores"
```

---

### 任务 3.3: 为 API 服务添加文档

**Files:**
- Modify: `src/services/api.ts`

**Step 1: 为 API 模块添加文档**

```typescript
/**
 * API 服务模块
 *
 * 封装所有后端 API 调用
 *
 * @module services/api
 */

/**
 * 认证相关 API
 */
export const authAPI = {
  /**
   * 用户登录
   *
   * @param email - 用户电子邮箱
   * @param password - 用户密码
   * @returns 登录响应，包含认证令牌和用户信息
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  /**
   * 用户注册
   *
   * @param userData - 注册数据
   * @returns 注册响应，包含认证令牌和用户信息
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  // ... 为其他方法添加文档
};
```

**Step 2: Git commit**

```bash
git add src/services/api.ts
git commit -m "docs(api): add JSDoc documentation for all API endpoints"
```

---

## 任务 4: 优化导入语句和代码组织

**背景问题:**
- 导入语句顺序不一致
- 绝对路径和相对路径混用
- 未使用的导入语句

**解决策略:**
统一导入语句风格，使用绝对路径，清理未使用的导入。

### 任务 4.1: 配置路径别名

**Files:**
- Modify: `quasar.config.ts`
- Modify: `tsconfig.json`

**Step 1: 确保路径别名配置正确**

在 `quasar.config.ts` 中：

```typescript
build: {
  viteVuePluginOptions: {
    script: {
      // 使用绝对路径导入
      globalScopeImports: true,
    },
  },
},
```

在 `tsconfig.json` 中：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "src/*": ["src/*"],
      "components/*": ["src/components/*"],
      "stores/*": ["src/stores/*"],
      "services/*": ["src/services/*"],
      "utils/*": ["src/utils/*"],
      "types/*": ["src/types/*"],
      "config/*": ["src/config/*"],
      "constants/*": ["src/constants/*"]
    }
  }
}
```

**Step 2: Git commit**

```bash
git add quasar.config.ts tsconfig.json
git commit -m "config: standardize path aliases for imports"
```

---

### 任务 4.2: 统一导入语句格式

**Files:**
- Modify: All `src/**/*.ts` and `src/**/*.vue` files

**Step 1: 确立导入顺序规则**

按以下顺序组织导入：
1. Vue 相关
2. 第三方库
3. 项目内部模块（使用绝对路径）
4. 类型导入
5. 样式文件

**Step 2: 应用导入规则**

示例：

```typescript
// ✅ 正确的导入顺序
import { defineStore } from 'pinia';
import { apiClient } from 'src/services/apiClient';
import type { User, AuthData } from 'src/types';

// ❌ 错误的导入顺序
import type { User } from 'src/types';
import { apiClient } from 'src/services/apiClient';
import { defineStore } from 'pinia';
```

**Step 3: 使用 ESLint 自动修复**

Run:
```bash
npm run lint -- --fix
```

**Step 4: 验证编译**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

**Step 5: Git commit**

```bash
git add .
git commit -m "style: standardize import statement order and format"
```

---

### 任务 4.3: 清理未使用的导入

**Files:**
- Modify: Multiple files

**Step 1: 使用 ESLint 检测未使用的导入**

Run:
```bash
npm run lint
```

**Step 2: 移除所有未使用的导入**

根据 ESLint 提示，删除未使用的导入语句。

**Step 3: 验证功能**

Run: `npm run dev`
手动测试应用功能
Expected: 无运行时错误

**Step 4: Git commit**

```bash
git add .
git commit -m "refactor: remove unused imports"
```

---

## 任务 5: 添加代码质量工具

**背景问题:**
缺少自动化代码质量检查工具。

**解决策略:**
配置和启用更多代码质量工具。

### 任务 5.1: 配置 ESLint 规则

**Files:**
- Modify: `eslint.config.js`

**Step 1: 添加更严格的 ESLint 规则**

```javascript
export default [
  {
    rules: {
      // 强制使用 const 或 let
      'no-var': 'error',

      // 强制使用 === 而不是 ==
      eqeqeq: ['error', 'always'],

      // 禁止未使用的变量
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // 强制代码复杂度限制
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 100],

      // 强制命名规范
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
      }],

      // 强制返回类型
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // 禁止 any 类型
      '@typescript-eslint/no-explicit-any': 'warn',

      // 强制使用可选链
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // 强制使用空值合并
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    },
  },
];
```

**Step 2: 测试 ESLint 配置**

Run: `npm run lint`
Expected: 显示新的警告和错误

**Step 3: 逐步修复问题**

根据优先级修复 ESLint 报告的问题。

**Step 4: Git commit**

```bash
git add eslint.config.js
git commit -m "config(eslint): add stricter code quality rules"
```

---

### 任务 5.2: 添加 Prettier 配置

**Files:**
- Create: `.prettierrc`

**Step 1: 创建 Prettier 配置**

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Step 2: 格式化所有文件**

Run:
```bash
npm run format
```

**Step 3: Git commit**

```bash
git add .prettierrc
git add .
git commit -m "config(prettier): add code formatting configuration"
```

---

### 任务 5.3: 添加 Git Hooks

**Files:**
- Modify: `package.json`

**Step 1: 安装 Husky 和 lint-staged**

Run:
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Step 2: 配置 lint-staged**

在 `package.json` 中添加：

```json
{
  "lint-staged": {
    "*.{ts,js,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**Step 3: 配置 pre-commit hook**

Run:
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

**Step 4: 测试 Git Hook**

Run:
```bash
git add .
git commit -m "test: verify git hooks"
```

Expected: 在提交前自动运行 lint-staged

**Step 5: Git commit**

```bash
git add package.json .husky/pre-commit
git commit -m "config(husky): add pre-commit hooks for code quality"
```

---

## 任务 6: 优化组件代码

**背景问题:**
- 部分组件过于庞大
- 组件职责不够单一
- 缺少组件文档

**解决策略:**
拆分大型组件，优化组件结构。

### 任务 6.1: 分析组件复杂度

**Files:**
- Analyze: `src/components/studies/ImageAnalyzer.vue`
- Analyze: `src/pages/LoginPage.vue`

**Step 1: 检查组件行数**

统计各组件文件的行数，找出超过 300 行的组件。

**Step 2: 识别可拆分的部分**

查找：
- 独立的 UI 区域
- 可复用的逻辑
- 复杂的表单验证
- 大量的数据处理

**Step 3: 创建拆分计划**

为每个大型组件制定拆分方案。

---

### 任务 6.2: 重构 ImageAnalyzer 组件

**Files:**
- Modify: `src/components/studies/ImageAnalyzer.vue`
- Create: `src/components/studies/ImageCanvas.vue`
- Create: `src/components/studies/AnnotationOverlay.vue`
- Create: `src/components/studies/AnalysisResultPanel.vue`

**Step 1: 提取画布组件**

创建 `src/components/studies/ImageCanvas.vue`：

```vue
<template>
  <div class="image-canvas">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  imageUrl?: string;
  width: number;
  height: number;
}

const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement>();

// 绘制图像逻辑
</script>
```

**Step 2: 提取标注覆盖层组件**

创建 `src/components/studies/AnnotationOverlay.vue`。

**Step 3: 提取分析结果面板组件**

创建 `src/components/studies/AnalysisResultPanel.vue`。

**Step 4: 简化主组件**

在 `ImageAnalyzer.vue` 中使用新组件。

**Step 5: 测试功能**

手动测试图像分析功能
Expected: 所有功能正常

**Step 6: Git commit**

```bash
git add src/components/studies/*.vue
git commit -m "refactor(ImageAnalyzer): split into smaller components"
```

---

### 任务 6.3: 为组件添加文档

**Files:**
- Modify: `src/components/**/*.vue`

**Step 1: 为组件添加 JSDoc 注释**

```vue
<script setup lang="ts">
/**
 * 图像分析器组件
 *
 * 用于显示和分析医学图像，支持：
 * - 图像缩放和平移
 * - 可疑区域标注
 * - 分析结果展示
 *
 * @component
 * @example
 * ```vue
 * <ImageAnalyzer
 *   :study-id="study.id"
 *   :image-url="study.imageUrl"
 *   :analysis-result="study.analysisResult"
 * />
 * ```
 */
import type { Study, AnalysisResult } from 'src/types';

interface Props {
  /** 病例 ID */
  studyId: number;
  /** 图像 URL */
  imageUrl?: string;
  /** 分析结果 */
  analysisResult?: AnalysisResult;
}

const props = defineProps<Props>();
</script>
```

**Step 2: Git commit**

```bash
git add src/components/**/*.vue
git commit -m "docs(components): add JSDoc documentation"
```

---

## 验收测试

### 测试 1: 代码质量检查

**Step 1: 运行所有检查工具**

Run:
```bash
npm run lint
npx vue-tsc --noEmit
npm run format -- --check
```

Expected: 无错误

**Step 2: 检查代码复杂度**

Run:
```bash
npx eslint src/**/*.ts --rule "complexity: [error, 10]"
npx eslint src/**/*.ts --rule "max-depth: [error, 4]"
```

Expected: 无复杂度错误

**Step 3: 检查命名规范**

Run:
```bash
npx eslint src/**/*.{ts,vue} --rule "@typescript-eslint/naming-convention: error"
```

Expected: 无命名规范错误

---

### 测试 2: 文档生成测试

**Step 1: 生成 API 文档**

如果有文档生成工具（如 TypeDoc），运行：
```bash
npx typedoc --out docs/api src/types src/services src/utils
```

Expected: 成功生成文档

**Step 2: 检查文档覆盖率**

手动检查主要模块是否有文档：
- [ ] 所有工具函数有 JSDoc
- [ ] 所有 Store 有文档
- [ ] 所有 API 函数有文档
- [ ] 所有主要组件有文档

---

### 测试 3: 完整功能测试

**Step 1: 测试所有用户流程**

- 用户注册和登录
- 患者管理
- 病例创建和分析
- 报告生成

Expected: 所有功能正常

**Step 2: 性能测试**

使用 Chrome DevTools 检查：
- 组件加载时间
- 内存使用
- 渲染性能

Expected: 性能良好

---

### 测试 4: 代码统计

**Step 1: 统计代码改进**

Run:
```bash
# 统计代码行数
find src -name "*.ts" -o -name "*.vue" | xargs wc -l

# 统计类型覆盖率
grep -r "any" src --include="*.ts" --include="*.vue" | wc -l

# 统计文档覆盖率
grep -r "/**" src --include="*.ts" --include="*.vue" | wc -l
```

Expected:
- 相比优化前，`any` 使用减少 80% 以上
- 文档覆盖率达到 70% 以上

**Step 2: 生成改进报告**

记录所有改进的数据。

---

## 完成检查清单

- [ ] 所有变量使用完整单词而非缩写
- [ ] 魔法数字定义为命名常量
- [ ] 文件命名规范统一
- [ ] 所有 `eslint-disable` 注释已移除
- [ ] `any` 类型使用减少到最低
- [ ] 所有公共函数有 JSDoc 文档
- [ ] 所有 Store 有文档
- [ ] 所有 API 端点有文档
- [ ] 导入语句格式统一
- [ ] 未使用的导入已清理
- [ ] ESLint 规则更加严格
- [ ] Prettier 配置已添加
- [ ] Git hooks 已配置
- [ ] 大型组件已拆分
- [ ] 组件文档完整
- [ ] 所有测试通过
- [ ] 代码质量达到生产标准

---

## 优化成果总结

完成所有三个优先级的优化后，预期达到：

### 代码质量指标

- **代码重复率**: 从 30% 降低到 5% 以下
- **any 类型使用**: 减少 90% 以上
- **函数复杂度**: 平均圈复杂度 < 10
- **代码嵌套深度**: 最多 4 层
- **文档覆盖率**: 70% 以上的公共 API 有文档

### 可维护性提升

- **类型安全**: 完整的 TypeScript 类型定义
- **错误处理**: 统一的错误处理机制
- **代码组织**: 清晰的模块和文件结构
- **测试覆盖**: 为关键功能添加测试
- **开发体验**: 更好的 IDE 智能提示

### 性能优化

- **打包体积**: 减少重复代码和未使用导入
- **运行时性能**: 移除生产环境的调试日志
- **构建速度**: 优化依赖导入和代码拆分

---

## 后续建议

持续改进建议：

1. **添加单元测试**
   - 为工具函数添加单元测试
   - 为 Store 添加测试
   - 目标：测试覆盖率 > 70%

2. **性能监控**
   - 集成性能监控工具
   - 跟踪关键指标
   - 定期优化

3. **代码审查流程**
   - 建立代码审查规范
   - 使用 Pull Request 模板
   - 强制执行代码质量标准

4. **文档完善**
   - 添加开发者指南
   - 完善 API 文档
   - 添加架构文档

---

**恭喜！** 完成所有三个优先级的代码优化后，项目的代码质量和可维护性将得到显著提升。
