# 邮箱认证API

<cite>
**本文档引用的文件**  
- [auth.js](file://server/routes/auth.js)
- [auth.js](file://server/middleware/auth.js)
- [jwt.js](file://server/utils/jwt.js)
- [User.js](file://server/models/User.js)
- [api.ts](file://src/services/api.ts)
- [authStore.ts](file://src/stores/authStore.ts)
- [RegisterPage.vue](file://src/pages/RegisterPage.vue)
- [LoginPage.vue](file://src/pages/LoginPage.vue)
</cite>

## 目录
1. [简介](#简介)
2. [核心端点说明](#核心端点说明)
3. [用户注册](#用户注册)
4. [邮箱登录](#邮箱登录)
5. [JWT令牌刷新](#jwt令牌刷新)
6. [获取当前用户信息](#获取当前用户信息)
7. [用户登出](#用户登出)
8. [JWT双令牌机制详解](#jwt双令牌机制详解)
9. [前端调用流程与最佳实践](#前端调用流程与最佳实践)
10. [错误处理与常见场景](#错误处理与常见场景)

## 简介
CervixDetectAI系统提供了一套完整的邮箱认证API，支持用户注册、登录、令牌管理及身份验证功能。该API基于JWT（JSON Web Token）实现无状态认证，采用双令牌机制（accessToken和refreshToken）提升安全性，并通过中间件统一处理用户身份解析与权限控制。本文档详细说明各认证端点的使用方式、数据结构、状态码及安全策略。

**Section sources**
- [auth.js](file://server/routes/auth.js#L1-L306)
- [middleware/auth.js](file://server/middleware/auth.js#L1-L125)

## 核心端点说明
以下是邮箱认证模块提供的主要HTTP接口：

| 端点 | 方法 | 描述 | 认证要求 |
|------|------|------|--------|
| `/api/auth/register` | POST | 用户注册 | 无需认证 |
| `/api/auth/login` | POST | 用户邮箱登录 | 无需认证 |
| `/api/auth/refresh` | POST | 刷新访问令牌 | 需提供refreshToken |
| `/api/auth/me` | GET | 获取当前用户信息 | 需提供有效的accessToken |
| `/api/auth/logout` | POST | 用户登出 | 需已认证（可选） |

**Section sources**
- [auth.js](file://server/routes/auth.js#L17-L305)

## 用户注册
### 请求信息
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **认证要求**: 无需认证

### 请求参数（Body）
```json
{
  "email": "user@example.com",
  "password": "password123",
  "real_name": "张三",
  "phone": "13800138000"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 用户邮箱，需符合邮箱格式 |
| `password` | string | 是 | 登录密码，至少6位 |
| `real_name` | string | 否 | 真实姓名 |
| `phone` | string | 否 | 手机号码 |

### 响应数据结构
#### 成功响应（201）
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "user_1712345678",
      "email": "user@example.com",
      "real_name": "张三",
      "role": "user",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 错误响应
| 状态码 | 错误信息 | 说明 |
|--------|--------|------|
| 400 | "邮箱和密码为必填项" | 缺少必要字段 |
| 400 | "密码长度至少6位" | 密码过短 |
| 400 | "邮箱格式不正确" | 邮箱格式无效 |
| 409 | "该邮箱已被注册" | 邮箱已存在 |
| 409 | "该用户名已被使用" | 用户名冲突 |
| 500 | "注册失败" | 服务器内部错误 |

### 校验机制
- **邮箱格式验证**：使用正则表达式 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 验证邮箱格式。
- **密码强度要求**：密码长度不得少于6位。
- **唯一性校验**：
  - 检查邮箱是否已存在于数据库中（通过 `User.findOne({ where: { email } })`）。
  - 若提供用户名，则检查其唯一性。

**Section sources**
- [auth.js](file://server/routes/auth.js#L17-L97)
- [User.js](file://server/models/User.js#L19-L25)

## 邮箱登录
### 请求信息
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **认证要求**: 无需认证

### 请求参数（Body）
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 用户注册邮箱 |
| `password` | string | 是 | 登录密码 |

### 响应数据结构
#### 成功响应（200）
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "user_1712345678",
      "email": "user@example.com",
      "real_name": "张三",
      "role": "user",
      "status": "active",
      "last_login_at": "2025-04-05T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 错误响应
| 状态码 | 错误信息 | 说明 |
|--------|--------|------|
| 400 | "邮箱和密码为必填项" | 参数缺失 |
| 401 | "邮箱或密码错误" | 用户不存在或密码错误 |
| 403 | "账号未激活" | 账号状态为 `inactive` |
| 403 | "账号已被禁用" | 账号状态为 `suspended` 或 `disabled` |
| 500 | "登录失败" | 服务器内部错误 |

### 登录流程
1. 验证邮箱和密码是否为空。
2. 查询数据库中是否存在该邮箱对应的用户。
3. 使用 `user.validatePassword(password)` 方法比对密码哈希值。
4. 检查用户状态（`active` 才允许登录）。
5. 更新 `last_login_at` 字段。
6. 生成新的 `accessToken` 和 `refreshToken`。

**Section sources**
- [auth.js](file://server/routes/auth.js#L112-L188)
- [User.js](file://server/models/User.js#L84-L86)

## JWT令牌刷新
### 请求信息
- **URL**: `/api/auth/refresh`
- **方法**: `POST`
- **认证要求**: 需在请求体中提供有效的 `refreshToken`

### 请求参数（Body）
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refreshToken` | string | 是 | 用于刷新的令牌 |

### 响应数据结构
#### 成功响应（200）
```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 错误响应
| 状态码 | 错误信息 | 说明 |
|--------|--------|------|
| 400 | "未提供刷新令牌" | 请求体中缺少 `refreshToken` |
| 401 | "无效或已过期的刷新令牌" | 令牌无效或已过期 |
| 401 | "令牌类型错误" | 提供的令牌不是 `refresh` 类型 |
| 401 | "用户不存在或已被禁用" | 用户不存在或状态非 `active` |
| 500 | "刷新令牌失败" | 服务器内部错误 |

### 安全策略
- 仅接受类型为 `refresh` 的令牌。
- 验证令牌签名和有效期。
- 重新查询用户状态以确保账户仍处于激活状态。

**Section sources**
- [auth.js](file://server/routes/auth.js#L195-L249)
- [jwt.js](file://server/utils/jwt.js#L40-L48)

## 获取当前用户信息
### 请求信息
- **URL**: `/api/auth/me`
- **方法**: `GET`
- **认证要求**: 需在请求头中携带 `Bearer <accessToken>`

### 请求头示例
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 响应数据结构
#### 成功响应（200）
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user_1712345678",
      "email": "user@example.com",
      "real_name": "张三",
      "phone": "13800138000",
      "role": "user",
      "status": "active",
      "created_at": "2025-04-05T09:00:00.000Z",
      "last_login_at": "2025-04-05T10:00:00.000Z"
    }
  }
}
```

#### 错误响应
| 状态码 | 错误信息 | 说明 |
|--------|--------|------|
| 401 | "未提供认证令牌" | 请求头中无 `Authorization` |
| 401 | "无效或已过期的令牌" | 令牌无效或已过期 |
| 401 | "令牌类型错误" | 令牌类型不是 `access` |
| 401 | "用户不存在" | 用户ID在数据库中找不到 |
| 403 | "账号已被禁用" | 用户状态非 `active` |
| 500 | "获取用户信息失败" | 服务器内部错误 |

### 脱敏处理
通过 `authenticate` 中间件从数据库查询用户时，自动排除 `password_hash` 字段，确保敏感信息不被泄露。

**Section sources**
- [auth.js](file://server/routes/auth.js#L277-L294)
- [auth.js](file://server/middleware/auth.js#L37-L39)

## 用户登出
### 请求信息
- **URL**: `/api/auth/logout`
- **方法**: `POST`
- **认证要求**: 可选（用于记录日志）

### 请求头（可选）
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 响应数据结构
#### 成功响应（200）
```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 错误响应
| 状态码 | 错误信息 | 说明 |
|--------|--------|------|
| 500 | "登出失败" | 服务器内部错误 |

> **注意**：服务端不维护会话状态，登出操作主要由客户端清除本地存储的令牌完成。此接口可用于记录登出日志。

**Section sources**
- [auth.js](file://server/routes/auth.js#L256-L270)
- [authStore.ts](file://src/stores/authStore.ts#L157-L166)

## JWT双令牌机制详解
### 令牌类型与配置
| 令牌类型 | 过期时间 | 用途 | 存储位置 |
|--------|--------|------|--------|
| `accessToken` | 1小时（可配置） | 接口认证 | localStorage |
| `refreshToken` | 7天（可配置） | 刷新 `accessToken` | localStorage |

### 生成逻辑
```mermaid
sequenceDiagram
participant Client as 客户端
participant Server as 服务端
participant JWT as JWT工具
Client->>Server : 发起注册/登录请求
Server->>Server : 创建/查找用户
Server->>JWT : generateAccessToken(user)
JWT-->>Server : 返回accessToken
Server->>JWT : generateRefreshToken(user)
JWT-->>Server : 返回refreshToken
Server->>Client : 返回tokens
```

**Diagram sources**
- [jwt.js](file://server/utils/jwt.js#L12-L37)
- [auth.js](file://server/routes/auth.js#L78-L79)

### 安全策略
- **令牌类型标识**：每个令牌包含 `type` 字段（`access` 或 `refresh`），防止混用。
- **刷新令牌验证**：仅当 `type === 'refresh'` 且用户状态为 `active` 时才允许刷新。
- **环境变量保护**：密钥 `JWT_SECRET` 来自 `.env` 文件，避免硬编码。

**Section sources**
- [jwt.js](file://server/utils/jwt.js#L4-L7)
- [auth.js](file://server/middleware/auth.js#L28-L34)

## 前端调用流程与最佳实践
### 典型调用流程
```mermaid
flowchart TD
A[用户填写注册表单] --> B[调用 register API]
B --> C{注册成功？}
C --> |是| D[自动登录并跳转主页]
C --> |否| E[显示错误提示]
D --> F[存储 accessToken 和 refreshToken]
F --> G[访问 /api/auth/me 获取用户信息]
G --> H[展示用户资料]
```

**Diagram sources**
- [RegisterPage.vue](file://src/pages/RegisterPage.vue#L146-L193)
- [authStore.ts](file://src/stores/authStore.ts#L64-L95)

### 代码示例（Vue + TypeScript）
```typescript
// 注册
const result = await authStore.register({
  email: 'user@example.com',
  password: 'password123',
  real_name: '张三'
});

if (result.success) {
  router.push('/app');
}
```

```typescript
// 自动刷新令牌
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken(localStorage.getItem('refreshToken'));
      setAuthToken(newToken.accessToken);
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### 最佳实践
- **持久化存储**：使用 `localStorage` 保存 `accessToken`、`refreshToken` 和用户信息。
- **拦截器处理**：通过 Axios 拦截器统一处理 401 错误并尝试刷新令牌。
- **登出清理**：调用 `logout()` 后清除所有本地认证数据。

**Section sources**
- [api.ts](file://src/services/api.ts#L92-L95)
- [authStore.ts](file://src/stores/authStore.ts#L157-L166)
- [MainLayout.vue](file://src/layouts/MainLayout.vue#L201-L204)

## 错误处理与常见场景
| 场景 | 原因 | 处理方式 |
|------|------|--------|
| 邮箱已存在 | `409 Conflict` | 提示用户更换邮箱或直接登录 |
| 密码错误 | `401 Unauthorized` | 提示“邮箱或密码错误”，不暴露具体原因 |
| 令牌过期 | `401 Unauthorized` | 拦截并尝试用 `refreshToken` 刷新 |
| 账号被禁用 | `403 Forbidden` | 显示“账号已被禁用”并引导联系管理员 |
| 网络异常 | `500 Internal Error` | 显示友好提示并记录日志 |

**Section sources**
- [auth.js](file://server/routes/auth.js#L99-L104)
- [authStore.ts](file://src/stores/authStore.ts#L64-L95)