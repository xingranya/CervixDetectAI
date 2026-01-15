# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CervixDetectAI 是一个基于 Quasar (Vue 3 + TypeScript) 的宫颈癌AI辅助筛查SaaS云平台。项目采用前后端分离架构，前端使用 Quasar Framework，后端使用 Node.js + Express + MySQL。

## 常用命令

### 前端开发

```bash
# 启动开发服务器（端口 9000）
npm run dev

# 类型检查
npx vue-tsc --noEmit

# 代码检查
npm run lint

# 代码格式化
npm run format

# 构建生产版本
npm run build
```

### 后端开发（在 server 目录）

```bash
cd server

# 启动后端服务器（端口 3000）
npm start

# 开发模式（自动重启）
npm run dev

# 初始化数据库
node scripts/init-database.js

# 创建短信验证码表
node scripts/create-sms-table.js

# 更新病例状态
node scripts/update-study-status.js
```

## 核心架构

### 双 API 客户端架构（重要）

项目存在**两个独立的 axios 实例**，需要注意区分：

1. **`src/services/api.ts`** - 主要 API 客户端
   - 带有 JWT 认证拦截器
   - 自动处理 token 刷新
   - 包含所有业务 API（auth, user, patient, study, report 等）
   - 导出 `authAPI`, `patientAPI`, `studyAPI` 等命名导出

2. **`src/services/apiService.ts`** - 图像上传专用客户端
   - 超时时间 60 秒（适用于大文件上传）
   - 包含 `uploadImage`, `pollTaskStatus` 等图像相关功能
   - 用于 AI 分析的上传和轮询

3. **`src/boot/axios.ts`** - Quasar 全局实例
   - 注册为 `$api` 全局属性
   - 用于组件中的直接访问（Options API）

**注意**: 这三个实例用途不同，修改时需要明确区分，避免破坏现有功能。

### 状态管理（Pinia Stores）

所有 stores 位于 `src/stores/`：

- **`authStore.ts`** - 用户认证状态
  - 管理登录/登出状态
  - 处理 JWT token（accessToken + refreshToken）
  - 提供 `initializeAuth()` 从 localStorage 恢复会话
  - `login`, `register`, `smsLogin`, `smsRegister` 方法有重复代码模式

- **`studyStore.ts`** - 病例数据管理
  - 管理病例列表和当前病例
  - `fetchStudies()` - 获取病例列表
  - `loadStudyById()` - 获取单个病例详情
  - 包含数据映射逻辑（将后端数据映射到前端格式）

- **`patientStore.ts`** - 患者信息管理
- **`analysisStore.ts`** - AI 分析任务状态
- **`modelStore.ts`** - AI 模型信息

### 路由结构

**两层架构**：

1. **公共路由**（`PublicLayout`）- 无需认证
   - `/` 或 `/login` - 登录页
   - `/register` - 注册页
   - `/forgot-password` - 忘记密码
   - `/user-agreement` - 用户协议
   - `/privacy-policy` - 隐私政策

2. **应用路由**（`MainLayout`）- 需要认证（`meta: { requiresAuth: true }`）
   - `/app` - 仪表盘
   - `/app/studies` - 病例管理
   - `/app/studies/:id` - 病例详情
   - `/app/upload` - 上传分析
   - `/app/patients` - 患者管理
   - `/app/reports` - 报告中心
   - `/app/models` - AI 模型设置
   - `/app/settings` - 系统设置
   - `/app/profile` - 个人资料

路由守卫在 `src/router/index.ts` 中检查认证状态。

### 认证机制

**双 Token 系统**：
- `accessToken` - 1 小时有效期，存储在内存（Pinia store）
- `refreshToken` - 7 天有效期，存储在 localStorage

自动刷新流程：
1. API 请求返回 401
2. `src/services/api.ts` 的响应拦截器捕获
3. 使用 refreshToken 调用 `/api/auth/refresh`
4. 更新 localStorage 中的 accessToken
5. 重试原始请求
6. 如果刷新失败，清除 token 并跳转 `/login`

### 短信验证码

使用阿里云短信服务（`@alicloud/dypnsapi20170525`）：
- 配置在 `server/.env`
- 验证码有效期：5 分钟
- 发送频率限制：60 秒
- 日发送上限：10 次/手机号
- 支持登录、注册、重置密码场景

## 关键开发注意事项

### TypeScript 配置

- 严格模式已启用（`quasar.config.ts`）
- 大量使用 `eslint-disable @typescript-eslint/no-explicit-any`
- 类型定义分散在各文件中，未统一管理

### 数据库

- 使用 Sequelize ORM
- 所有表使用 `utf8mb4_unicode_ci` 字符集
- 软删除通过 `deleted_at` 字段
- 模型关联定义在 `server/models/index.js`

### 文件上传

- 图像上传限制：10MB
- 支持格式：JPG, PNG, JPEG
- 上传目录：`server/uploads/`
- 报告生成目录：`server/reports/`

### 环境变量

**前端** `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**后端** `server/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cervix_detect_ai
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
ALIYUN_ACCESS_KEY_ID=your_key
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_SMS_SIGN_NAME=your_sign_name
ALIYUN_SMS_TEMPLATE_CODE=100001
```

## 常见任务模式

### 添加新的 API 端点

1. 在 `src/services/api.ts` 添加函数
2. 在对应的 Store 中调用
3. 在页面组件中使用 Store 的 action

示例：
```typescript
// 1. src/services/api.ts
export const newFeatureAPI = {
  async getData() {
    const { data } = await apiClient.get('/new-feature');
    return data;
  }
};

// 2. src/store/newFeatureStore.ts
import { newFeatureAPI } from 'src/services/api';
export const useNewFeatureStore = defineStore('newFeature', {
  actions: {
    async fetchData() {
      const response = await newFeatureAPI.getData();
      return response;
    }
  }
});

// 3. 页面组件
import { useNewFeatureStore } from 'stores/newFeatureStore';
const newFeatureStore = useNewFeatureStore();
await newFeatureStore.fetchData();
```

### 添加需要认证的新页面

1. 在 `src/pages/` 创建组件
2. 在 `src/router/routes.ts` 的 `/app` 路由组中添加路由
3. 确保路由有 `meta: { requiresAuth: true }`

### 修改认证相关逻辑

认证逻辑分散在多处，修改时需要同步：
- `src/stores/authStore.ts`
- `src/services/api.ts` (authAPI 部分)
- `src/router/index.ts` (路由守卫)
- `src/boot/axios.ts` (全局拦截器)

### 数据映射模式

`studyStore` 中有将后端数据映射到前端格式的逻辑（约 88-111 行）。如果后端 API 响应格式变化，需要更新映射逻辑。

## 已知技术债务

1. **API 客户端重复** - 三个 axios 实例功能重叠
2. **authStore 代码重复** - `login`, `register`, `smsLogin`, `smsRegister` 有相同的 try-catch 结构
3. **类型定义分散** - 使用 `any` 类型过多，缺少统一的类型定义文件
4. **console.log** - 生产代码中有调试日志（`studyAPI`, `apiService.ts`）
5. **错误处理不一致** - 有的 Store 返回 `{success, error}`，有的抛出异常

## 重要提醒

⚠️ **项目当前功能运行正常，进行重构时请格外谨慎：**

- 任何修改都应该在功能上保持等效
- 优先创建新分支进行实验性修改
- 每个小改动都要完整测试相关功能
- 注意双 API 客户端架构，不要混淆使用
- 修改认证逻辑时必须测试所有认证方式（邮箱、短信）
- 数据库操作前先备份数据

如果不需要解决具体问题，建议保持现状，不要进行大规模重构。
