# 代码质量优化 - 高优先级（第一阶段）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 解决最紧急的代码重复和不一致问题，提升代码库的可维护性和稳定性。

**架构方案:**
1. 合并三个重复的 axios 配置，创建统一的 API 客户端层
2. 重构 authStore 消除重复代码，使用已有的 `_executeAuth` 辅助方法
3. 建立统一的错误处理机制，确保所有 Store 使用相同的错误处理模式

**技术栈:** Vue 3, Pinia, TypeScript, Axios, Quasar

---

## 任务 1: 创建统一的 API 配置和客户端

**背景问题:**
- `src/boot/axios.ts` - Quasar boot 配置的 axios 实例
- `src/services/api.ts` - 带有拦截器的完整 API 客户端 (353 行)
- `src/services/apiService.ts` - 另一个带轮询功能的 API 客户端 (201 行)
- 三个文件都有独立的 axios.create() 调用和配置

**解决策略:**
创建统一的配置文件和 API 客户端，让其他服务文件通过导入使用。

### 任务 1.1: 创建 API 配置文件

**Files:**
- Create: `src/config/api.config.ts`

**Step 1: 创建配置文件**

```typescript
// src/config/api.config.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 60000,
  POLLING: {
    INTERVAL: 2000,
    MAX_ATTEMPTS: 150,
  },
} as const;
```

**Step 2: 验证 TypeScript 编译**

Run: `npm run build -- --mode development`
Expected: 编译成功，无类型错误


---

### 任务 1.2: 创建统一的核心 API 客户端

**Files:**
- Create: `src/services/apiClient.ts`
- Modify: `src/services/api.ts` (稍后删除)

**Step 1: 创建核心 axios 客户端**

```typescript
// src/services/apiClient.ts
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { API_CONFIG } from 'src/config/api.config';

// 创建主 axios 实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
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

// 响应拦截器 - 处理令牌刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // 如果令牌过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_CONFIG.BASE_URL}/auth/refresh`,
            { refreshToken },
          );

          if (data.success && data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${data.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // 刷新失败，清除令牌并跳转到登录页
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
```

**Step 2: 运行 TypeScript 检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误


---

### 任务 1.3: 重构 api.ts 使用新的客户端

**Files:**
- Modify: `src/services/api.ts:1-64`

**Step 1: 替换文件顶部的 axios 创建代码**

找到 `src/services/api.ts` 的第 1-64 行（axios 实例创建和拦截器部分），替换为：

```typescript
import { apiClient } from './apiClient';

// API Base URL 已迁移到 src/config/api.config.ts
// axios 实例和拦截器已迁移到 src/services/apiClient.ts
```

**Step 2: 替换所有 apiClient 引用**

在 `src/services/api.ts` 中，所有对 `apiClient` 的引用现在会使用从 `./apiClient` 导入的实例。

**Step 3: 验证编译和运行**

Run: `npm run lint`
Expected: 通过 lint 检查

**Step 4: 测试 API 调用**

Run: `npm run dev`
Expected: 应用启动，API 调用正常工作


---

### 任务 1.4: 重构 apiService.ts 使用新的客户端

**Files:**
- Modify: `src/services/apiService.ts:1-39`

**Step 1: 替换 axios 创建代码**

将 `src/services/apiService.ts` 的第 1-39 行替换为：

```typescript
import { apiClient } from './apiClient';
import { API_CONFIG } from 'src/config/api.config';
```

**Step 2: 移除日志输出**

删除 `src/services/apiService.ts` 中拦截器的 console.log 语句（因为 apiClient.ts 已经处理了核心逻辑）。

**Step 3: 更新 pollTaskStatus 函数**

保持 `pollTaskStatus` 函数不变，因为这是该文件特有的功能。

**Step 4: 验证编译**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误


---

### 任务 1.5: 更新 boot/axios.ts

**Files:**
- Modify: `src/boot/axios.ts`

**Step 1: 简化 boot 文件**

将 `src/boot/axios.ts` 的内容替换为：

```typescript
import { defineBoot } from '#q-app/wrappers';
import { apiClient } from 'src/services/apiClient';
import type { AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: typeof import('axios');
    $api: AxiosInstance;
  }
}

export default defineBoot(({ app }) => {
  // 为 Vue Options API 提供全局 axios 和 apiClient
  app.config.globalProperties.$axios = require('axios');
  app.config.globalProperties.$api = apiClient;
});

export { apiClient };
```

**Step 2: 验证应用启动**

Run: `npm run dev`
Expected: Quasar 应用正常启动，$api 可在组件中使用



---

## 任务 2: 重构 authStore 消除重复代码

**背景问题:**
- `login`, `register`, `smsLogin`, `smsRegister` 四个方法有完全相同的结构
- 已定义 `_executeAuth` 辅助方法但未被使用
- 每个 auth 方法都重复 20+ 行代码

**解决策略:**
使用 `_executeAuth` 辅助方法简化所有认证方法。

### 任务 2.1: 修改 _executeAuth 以支持保存认证数据

**Files:**
- Modify: `src/stores/authStore.ts:52-68`

**Step 1: 更新 _executeAuth 方法**

将 `src/stores/authStore.ts` 的 `_executeAuth` 方法替换为：

```typescript
/**
 * 内部辅助：执行认证操作的通用包装
 */
async _executeAuth<T>(
  operation: () => Promise<{ success: boolean; data?: any; message?: string }>,
  errorMsg: string,
  saveAuth = true,
): Promise<{ success: boolean; error?: string; data?: T }> {
  this.isAuthenticating = true;
  try {
    const response = await operation();
    if (response.success && response.data) {
      if (saveAuth) {
        this._saveAuthData(response.data);
      }
      return { success: true, data: response.data };
    }
    return { success: false, error: response.message || errorMsg };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || errorMsg };
  } finally {
    this.isAuthenticating = false;
  }
}
```

**Step 2: 验证 TypeScript 类型**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误


---

### 任务 2.2: 重构 login 方法

**Files:**
- Modify: `src/stores/authStore.ts:70-88`

**Step 1: 替换 login 方法**

将 `login` 方法简化为：

```typescript
async login(email: string, password: string) {
  return this._executeAuth(
    () => authAPI.login(email, password),
    '登录失败',
  );
}
```

**Step 2: 测试登录功能**

手动测试：在应用中尝试登录
Expected: 登录功能正常工作

**Step 3: Git commit**

```bash
git add src/stores/authStore.ts
git commit -m "refactor(authStore): simplify login method using _executeAuth"
```

---

### 任务 2.3: 重构 register 方法

**Files:**
- Modify: `src/stores/authStore.ts:90-114`

**Step 1: 替换 register 方法**

将 `register` 方法简化为：

```typescript
async register(userData: {
  email: string;
  password: string;
  real_name?: string;
  phone?: string;
}) {
  return this._executeAuth(
    () => authAPI.register(userData),
    '注册失败',
  );
}
```

**Step 2: 测试注册功能**

手动测试：在应用中尝试注册
Expected: 注册功能正常工作


---

### 任务 2.4: 重构 smsLogin 方法

**Files:**
- Modify: `src/stores/authStore.ts:117-135`

**Step 1: 替换 smsLogin 方法**

将 `smsLogin` 方法简化为：

```typescript
async smsLogin(phone: string, code: string) {
  return this._executeAuth(
    () => authAPI.smsLogin(phone, code),
    '短信登录失败',
  );
}
```

**Step 2: 测试短信登录**

手动测试：使用短信验证码登录
Expected: 短信登录功能正常工作


---

### 任务 2.5: 重构 smsRegister 方法

**Files:**
- Modify: `src/stores/authStore.ts:138-160`

**Step 1: 替换 smsRegister 方法**

将 `smsRegister` 方法简化为：

```typescript
async smsRegister(
  phone: string,
  code: string,
  userData?: { username?: string; real_name?: string; email?: string },
) {
  return this._executeAuth(
    () => authAPI.smsRegister(phone, code, userData),
    '短信注册失败',
  );
}
```

**Step 2: 测试短信注册**

手动测试：使用短信验证码注册
Expected: 短信注册功能正常工作

---

### 任务 2.6: 移除 localStorage 重复代码

**Files:**
- Modify: `src/stores/authStore.ts:200-209`

**Step 1: 简化 setAuthData 方法**

将 `setAuthData` 方法简化为使用 `_saveAuthData`：

```typescript
setAuthData(token: string, refreshToken: string, user: User) {
  this._saveAuthData({ accessToken: token, refreshToken, user });
}
```

**Step 2: 验证所有认证流程**

手动测试：
- 登录
- 注册
- 短信登录
- 短信注册
- 刷新页面（验证 localStorage 正常）
Expected: 所有功能正常


---

## 任务 3: 统一错误处理机制

**背景问题:**
- `authStore` 返回 `{ success, error }` 对象
- `patientStore` 抛出异常
- `studyStore` 混合使用两种模式
- 错误处理不一致导致难以预测的行为

**解决策略:**
创建统一的错误处理工具函数，让所有 Store 使用相同的模式。

### 任务 3.1: 创建统一错误处理工具

**Files:**
- Create: `src/utils/errorHandler.ts`

**Step 1: 创建错误处理工具**

```typescript
// src/utils/errorHandler.ts
export interface ApiError {
  success: false;
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResult<T> = ApiError | ApiSuccess<T>;

/**
 * 统一的 API 错误处理
 * 将 try-catch 转换为 { success, data?, error? } 格式
 */
export async function handleApiCall<T>(
  operation: () => Promise<{ success: boolean; data?: T; message?: string }>,
  defaultErrorMessage = '操作失败',
): Promise<ApiResult<T>> {
  try {
    const response = await operation();

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.message || defaultErrorMessage };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || defaultErrorMessage;
    return { success: false, error: errorMessage };
  }
}

/**
 * 从错误中提取用户友好的消息
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

**Step 2: 验证 TypeScript 类型**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误



---

### 任务 3.2: 重构 patientStore 使用统一错误处理

**Files:**
- Modify: `src/stores/patientStore.ts`

**Step 1: 在文件顶部导入错误处理**

在 `src/stores/patientStore.ts` 顶部添加：

```typescript
import { handleApiCall, getErrorMessage } from 'src/utils/errorHandler';
```

**Step 2: 重构 createPatient 方法**

找到 `createPatient` 方法，将其重构为：

```typescript
async createPatient(patientData: CreatePatientRequest) {
  this.loading = true;
  this.error = null;

  const result = await handleApiCall(
    () => patientAPI.createPatient(patientData),
    '创建患者失败',
  );

  this.loading = false;

  if (result.success) {
    this.patients.push(result.data);
    return result.data;
  } else {
    this.error = result.error;
    throw new Error(result.error);
  }
}
```

**Step 3: 重构其他方法**

对所有其他 patient 方法应用相同的模式：
- `updatePatient`
- `deletePatient`
- `fetchPatients`

**Step 4: 测试患者管理功能**

手动测试：
- 创建患者
- 更新患者
- 删除患者
- 查看患者列表
Expected: 所有功能正常，错误提示一致

---

### 任务 3.3: 重构 studyStore 使用统一错误处理

**Files:**
- Modify: `src/stores/studyStore.ts`

**Step 1: 导入错误处理工具**

在 `src/stores/studyStore.ts` 顶部添加：

```typescript
import { handleApiCall } from 'src/utils/errorHandler';
```

**Step 2: 重构 fetchStudies 方法**

找到 `fetchStudies` 方法，替换错误处理部分为：

```typescript
async fetchStudies(params?: {
  page?: number;
  limit?: number;
  patient_id?: number;
  status?: string;
}) {
  this.loading = true;
  this.error = null;

  const result = await handleApiCall(
    () => studyAPI.getStudies(params),
    '获取病例列表失败',
  );

  this.loading = false;

  if (result.success) {
    // Map backend data to frontend format
    this.studies = result.data.studies.map((study: any) => {
      // ... 保留原有的映射逻辑
    });
  } else {
    this.error = result.error;
  }

  return result;
}
```

**Step 3: 重构其他 study 方法**

对以下方法应用相同的错误处理模式：
- `loadStudyById`
- `createStudy`
- `updateStudy`
- `deleteStudy`

**Step 4: 测试病例管理功能**

手动测试：
- 查看病例列表
- 创建病例
- 更新病例
- 删除病例
Expected: 所有功能正常，错误提示一致

---

### 任务 3.4: 更新组件使用统一的错误处理

**Files:**
- Modify: `src/pages/LoginPage.vue`
- Modify: `src/pages/RegisterPage.vue`
- Modify: `src/pages/PatientsPage.vue`

**Step 1: 更新 LoginPage 错误处理**

在 `src/pages/LoginPage.vue` 中，确保所有 API 调用都使用统一的错误处理格式。

**Step 2: 更新 RegisterPage 错误处理**

在 `src/pages/RegisterPage.vue` 中，应用相同的模式。

**Step 3: 更新 PatientsPage 错误处理**

在 `src/pages/PatientsPage.vue` 中，使用 Store 返回的错误信息。

**Step 4: 测试所有页面功能**

手动测试所有修改的页面：
Expected: 错误提示一致且友好



---

## 任务 4: 清理 console.log 调试输出

**背景问题:**
生产代码中包含大量 `console.log` 语句，影响性能和安全性。

### 任务 4.1: 创建环境感知的日志工具

**Files:**
- Create: `src/utils/logger.ts`

**Step 1: 创建日志工具**

```typescript
// src/utils/logger.ts
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
};
```


---

### 任务 4.2: 替换 studyStore 中的 console.log

**Files:**
- Modify: `src/stores/studyStore.ts`

**Step 1: 导入 logger**

在 `src/stores/studyStore.ts` 顶部添加：

```typescript
import { logger } from 'src/utils/logger';
```

**Step 2: 替换所有 console.log 为 logger.log**

搜索并替换所有 `console.log` 为 `logger.log`。

**Step 3: 保留 console.error**

将 `console.error` 替换为 `logger.error`。

**Step 4: Git commit**


---

### 任务 4.3: 替换 apiService.ts 中的 console.log

**Files:**
- Modify: `src/services/apiService.ts`

**Step 1: 导入并使用 logger**

应用与任务 4.2 相同的模式。



---

### 任务 4.4: 替换 api.ts 中的 console.log

**Files:**
- Modify: `src/services/api.ts`

**Step 1: 移除 studyAPI 中的 console.log**

删除 `src/services/api.ts` 中 `studyAPI.createStudy` 和 `studyAPI.getStudies` 的所有 console.log。



---

## 验收测试

### 测试 1: 完整的用户认证流程

**Step 1: 测试所有认证方式**

- 邮箱密码登录
- 邮箱密码注册
- 短信验证码登录
- 短信验证码注册
- 登出
- 令牌刷新（等待 access token 过期）

Expected: 所有流程正常，错误提示一致

**Step 2: 检查代码质量**

Run:
```bash
npm run lint
npx vue-tsc --noEmit
```

Expected: 无 lint 错误，无 TypeScript 类型错误

**Step 3: 检查重复代码减少**

Run: 查看代码行数变化
Expected: authStore 从 223 行减少到约 150 行

---

### 测试 2: 完整的病例管理流程

**Step 1: 测试病例 CRUD 操作**

- 创建患者
- 为患者创建病例
- 上传医学图像
- 查看病例列表
- 更新病例信息
- 删除病例

Expected: 所有操作正常，错误处理一致

**Step 2: 测试 API 错误场景**

- 断开网络连接
- 发送无效数据
- 触发 401 未授权错误
- 触发 500 服务器错误

Expected: 所有错误都有友好的提示

---

### 测试 3: 生产构建验证

**Step 1: 构建生产版本**

Run: `npm run build`

Expected: 构建成功，无错误

**Step 2: 检查构建输出**

检查 `dist` 目录大小
Expected: 相比优化前，体积有所减小（移除了重复代码）

**Step 3: 验证生产环境日志**

在构建后的代码中搜索 console.log
Expected: 只找到 logger 相关代码，没有直接的 console.log

---

## 完成检查清单

- [ ] 所有 axios 配置合并到统一文件
- [ ] authStore 代码行数减少 30% 以上
- [ ] 所有 Store 使用统一的错误处理模式
- [ ] 生产构建中无调试 console.log
- [ ] 所有功能测试通过
- [ ] TypeScript 类型检查无错误
- [ ] ESLint 检查无错误
- [ ] 代码审查通过

---

## 后续步骤

完成高优先级优化后，继续执行：

**下一步:** `docs/plans/2025-01-15-code-optimization-priority-medium.md`
