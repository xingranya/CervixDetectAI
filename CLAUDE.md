# CervixDetectAI 项目记忆

## 项目概述

宫颈检测 AI 辅助诊断系统 - 一个全栈 Web 应用，支持移动端部署。

## 技术栈

### 前端

- **框架**: Vue 3 + Quasar Framework v2.16.0
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts
- **移动端**: Capacitor
- **HTTP 请求**: Axios
- **PDF 生成**: html2canvas + jspdf

### 后端

- **运行时**: Node.js
- **位置**: `/server` 目录
- **认证服务**: 阿里云号码认证 (@alicloud/dypnsapi)

## 目录结构

```
CervixDetectAI/
├── src/                # 前端源代码
│   ├── pages/          # 页面组件
│   ├── components/     # 可复用 UI 组件
│   ├── layouts/        # 页面布局模板
│   ├── stores/         # Pinia 状态管理
│   ├── router/         # 路由配置
│   ├── services/       # API 请求服务
│   ├── boot/           # Quasar 启动插件
│   └── utils/          # 工具函数
├── server/             # 后端源代码
│   ├── routes/         # API 路由
│   ├── models/         # 数据库模型
│   ├── services/       # 业务逻辑层
│   ├── middleware/     # 中间件
│   ├── config/         # 配置文件
│   └── uploads/        # 上传文件存储
├── public/             # 静态资源
├── docs/               # 项目文档
└── dist/               # 构建产物
```

## 核心功能模块

1. **AI 检测分析** - 宫颈图像识别与辅助诊断（核心功能）
2. **患者管理** - 患者信息录入、扩展字段、病历查看
3. **用户中心** - 登录注册、邮箱验证码、阿里云号码认证、阿里云 AI 验证码安全验证、权限管理
4. **订阅支付** - 会员订阅、价格展示、优惠计算、用户协议
5. **报告生成** - PDF 导出、ECharts 图表展示
6. **数据库维护** - 自动清理过期验证码和旧数据

## 关键配置文件

| 文件                    | 用途                               |
| ----------------------- | ---------------------------------- |
| `package.json`          | 前端依赖管理                       |
| `quasar.config.ts`      | Quasar 框架配置                    |
| `server/package.json`   | 后端依赖管理                       |
| `server/.env`           | 后端环境变量（数据库、API 密钥等） |
| `capacitor.config.json` | 移动端配置                         |
| `tsconfig.json`         | TypeScript 配置                    |
| `eslint.config.js`      | 代码规范                           |

### 关键环境变量

#### 数据库同步

```env
DB_SYNC=false  # 是否自动同步表结构（生产环境建议 false）
```

#### 腾讯云邮件推送

```env
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SES_REGION=ap-guangzhou
TENCENT_SES_FROM_EMAIL=no-reply@hpvsc.icu
TEMPLATE_ID_REGISTER=42423
TEMPLATE_ID_RESET_PASSWORD=42424
```

## 常用命令

```bash
# 前端开发
quasar dev              # 启动开发服务器
quasar build            # 生产构建

# 后端开发
cd server && bun run dev  # 启动后端服务

# 移动端
quasar build -m capacitor -T android  # Android 构建
```

## 开发规范

- 使用 ESLint + Prettier 保持代码风格一致
- TypeScript 强类型约束
- 组件遵循单一职责原则
- API 请求统一通过 services 层处理

## 协作偏好（前端迭代）

- 与我沟通统一使用简体中文。
- 不要主动运行开发服务器（如 `bun run dev` / `quasar dev`），由我自行启动验证。
- 登录/认证页动画要求：医疗稳重风格，避免生硬跳动与“假翻页”效果。
- AuthBrandPanel 的“今日处理量”展示偏好：起始值从 `5` 开始，节奏偏慢（默认按 10 秒级变化，除非我临时指定）。
- 登录页 footer 的注册引导文案优先使用“开始注册”这类直接表达。

## 近期更新

- **[2026-02-20] 平台体验与生态规划升级**
  - 全面支持全局暗色模式 (Dark Mode) 及相关组件的响应式样式适配
  - 重构登录、注册、找回密码页面，支持多通道验证并优化交互流程
  - 优化服务偏好设置界面及个性化偏好管理功能
  - 优化生产环境安全头与静态资源托管配置，并扩展环境安全指南
  - 补充多阶段项目生态规划文档 (`phase-4-ecosystem.md`) 与邮件 HTML 模板
  - 集成与规范 Swagger API 接口文档，优化 GitHub Wiki 自动同步工作流

- **[2026-02-05] 邮箱验证码与数据库优化**
  - 集成腾讯云 SES 邮件推送服务，支持邮箱验证码注册/登录/重置密码
  - 新增 `EmailCode` 数据模型，记录邮箱验证码（6位数字，5分钟有效期）
  - 新增 `server/routes/email-auth.js` 邮箱认证路由
  - 新增 `server/services/tencentEmail.service.js` 邮件发送服务
  - 登录/注册页面新增邮箱验证码模式切换
  - 新增 `server/services/databaseCleanup.service.js` 数据库清理服务
    - 自动清理过期验证码（7天）
    - 自动清理旧分析任务（30天）
    - 批量删除优化，避免内存溢出
  - 新增系统管理 API (`/api/system/database/cleanup`, `/api/system/database/size`)
  - 用户模型扩展：邮箱改为可选字段（`email` 字段 `allowNull: true`）
  - 支持 DB_SYNC 环境变量控制数据库表结构自动同步
  - 优化部署脚本 `scripts/deploy-menu.sh`，支持 SSH 连接复用
  - 清理 6 个过时的数据库迁移脚本

- **[2026-01-31] 用户系统增强与医院配置**
  - 用户模型扩展：新增 `hospital_id`（所属医院）和 `employee_id`（工号）字段
  - 支持工号登录/注册，邮箱改为可选
  - 新增 `src/constants/hospitals.ts` 医院与科室常量配置
  - 新增 `public/icons/hospitals/` 医院图标目录，支持自定义 Logo
  - 已配置医院：荆州市中心医院、荆州区金盾门诊、武汉大学人民医院、华中科技大学同济医学院、江陵县三湖管理区卫生院、荆州保和堂中医诊所、荆州市妇幼保健院
  - 登录/注册/设置/个人资料页面集成医院选择下拉框

- **[2026-01-28] 易支付(EPay)集成**
  - 集成第三方支付平台，支持支付宝、微信支付、银行卡（模拟）
  - 新增 `Order` 订单数据模型，记录支付订单
  - 新增 `PaymentResultPage.vue` 支付结果页
  - 用户模型扩展订阅字段：`subscription_type`、`subscription_expires_at`、`remaining_credits`
  - 支持套餐购买和订阅会员，自动发放积分权益
  - Hash Mode 路由兼容处理（前端重定向脚本）
  - **NAT 网络环境支持**：通过 `EXTERNAL_PORT` 环境变量配置外网端口
    - `paymentService.js`: 创建订单时动态生成带端口的回调 URL
    - `payment.js /return`: 支付完成跳转时自动添加外网端口
    - 支持多域名部署，自动获取请求域名 + 固定端口

- **[2026-01-26] 阿里云 AI 验证码集成**
  - 新增 `AliCaptcha.vue` 组件，支持阿里云 ESA AI 验证码
  - 登录/注册页面集成"一点即过"验证（场景ID: u1g43fza）
  - 发送短信验证码前集成"图像复原"验证（场景ID: 1dynwu1h）
  - 支持多场景验证类型切换

- **[2026-01-26] UI/UX 优化**
  - 用户协议对话框改为响应式弹窗（桌面端 700px 居中，移动端全屏）
  - 移除登录页无效的"记住我"复选框
  - 修复协议页面返回按钮在新标签页场景下的异常行为

- **[2026-01-26] AI 标注模拟增强**
  - 使用真实医学术语（NILM/LSIL/HSIL/ASC-US 等）模拟检测结果
  - 实现基于置信度的风险等级颜色区分
  - 添加宫颈病变分类标签及权重配置

- **[2026-01-26] 代码质量优化**
  - 修复 ESLint consistent-type-imports 警告
  - 修复 Promise 相关类型问题
  - 优化 apiClient 错误处理

- 重构项目文档为 Claude Code 指南
- 添加登录注册和支付的用户协议确认功能
- 优化订阅页面价格展示与优惠计算
- 添加患者信息扩展字段支持
- 取消非管理员查看患者限制

---

## 深度架构分析

### 前端核心页面

| 页面            | 功能               | 路径                          |
| --------------- | ------------------ | ----------------------------- |
| UploadPage      | 病例创建与影像上传 | src/pages/UploadPage.vue      |
| StudyDetailPage | AI诊断结论展示     | src/pages/StudyDetailPage.vue |
| StudiesPage     | 病例中心           | src/pages/StudiesPage.vue     |
| PatientsPage    | 患者管理           | src/pages/PatientsPage.vue    |

### 后端数据模型关系

```
User 1:N Patient 1:N Study 1:N StudyImage
              └── 1:1 AnalysisTask 1:1 AnalysisResult 1:1 MedicalReport

EmailCode (邮箱验证码，独立模型)
SmsCode (短信验证码，独立模型)
Order (支付订单)
```

### API 服务特性

- 双 Token 认证 (Access + Refresh)
- 401 自动刷新重试机制
- 模块化封装 (authAPI, patientAPI, studyAPI 等)
- **邮箱认证 API** (`/api/auth/email`)
  - `POST /send-code` - 发送邮箱验证码
  - `POST /register` - 邮箱验证码注册
  - `POST /reset-password` - 邮箱验证码重置密码
- **系统管理 API** (`/api/system`)
  - `POST /database/cleanup` - 执行数据库清理
  - `GET /database/size` - 获取表大小统计

### 第三方集成

- 阿里云 DYPNS (号码认证)
- 阿里云 ESA AI 验证码（登录/注册安全验证）
- 阿里云 SMS (短信验证码)
- **腾讯云 SES (邮箱验证码推送)**
- 通义千问大模型 (AI 诊断建议)
- Sharp (医学影像处理)
- 易支付 (支付接口)

---

## 邮箱验证码功能详解

### 数据模型

**EmailCode 模型** (`server/models/EmailCode.js`)

```javascript
{
  id: INTEGER (主键)
  email: STRING (邮箱地址)
  code: STRING (6位验证码)
  type: ENUM ('register', 'reset_password')
  expires_at: DATETIME (过期时间，5分钟)
  used: BOOLEAN (是否已使用)
  created_at: DATETIME
  updated_at: DATETIME
}
```

### 业务逻辑

1. **发送验证码** - `POST /api/auth/email/send-code`
   - 验证邮箱格式
   - 检查发送频率（60秒限制）
   - 生成 6 位数字验证码
   - 调用腾讯云 SES API 发送邮件
   - 保存到数据库（5分钟有效）

2. **邮箱注册** - `POST /api/auth/email/register`
   - 验证邮箱格式
   - 验证验证码有效性
   - 检查邮箱是否已注册
   - 创建用户账户
   - 标记验证码已使用

3. **重置密码** - `POST /api/auth/email/reset-password`
   - 验证邮箱格式
   - 验证验证码有效性
   - 更新用户密码
   - 标记验证码已使用

### 安全特性

- ✅ 验证码 5 分钟自动过期
- ✅ 60 秒发送频率限制
- ✅ 验证码一次性使用（验证后标记 used）
- ✅ 自动清理过期验证码（7天）
- ✅ 批量删除优化（每次 1000 条）

### 部署脚本

**`scripts/deploy-menu.sh`** - 交互式部署工具

- 支持 SSH 连接复用（ControlMaster）
- 自动检测环境依赖（rsync, Node.js, PM2）
- 8 项菜单选项：首次部署、快速更新、仅同步、查看状态等
- Windows Git Bash 兼容

---

## 安全注意事项 ⚠️

### 已知风险

1. **[高危]** `/uploads` 和 `/reports` 目录未鉴权公开
2. **[高危]** 患者数据访问权限过于宽松
3. **[中危]** Token 存储在 localStorage，存在 XSS 风险
4. **[中危]** 缺少 Helmet 安全头中间件

### 改进建议

- 对静态资源增加权限校验中间件
- 恢复患者数据的所有权访问控制
- 将 Refresh Token 迁移到 HttpOnly Cookie
- 引入 Joi/Zod 进行输入验证

---

## 待办改进

- [ ] P0: 修复患者数据权限漏洞
- [ ] P0: 保护静态资源目录
- [ ] P1: 编写 Dockerfile 容器化部署
- [ ] P1: 配置 GitHub Actions CI/CD
- [ ] P2: 后端迁移至 TypeScript
- [ ] P3: 集成 Swagger UI 交互文档
