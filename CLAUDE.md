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
3. **用户中心** - 登录注册、阿里云号码认证、权限管理
4. **订阅支付** - 会员订阅、价格展示、优惠计算、用户协议
5. **报告生成** - PDF 导出、ECharts 图表展示

## 关键配置文件

| 文件 | 用途 |
|------|------|
| `package.json` | 前端依赖管理 |
| `quasar.config.ts` | Quasar 框架配置 |
| `server/package.json` | 后端依赖管理 |
| `capacitor.config.json` | 移动端配置 |
| `tsconfig.json` | TypeScript 配置 |
| `eslint.config.js` | 代码规范 |

## 常用命令

```bash
# 前端开发
quasar dev              # 启动开发服务器
quasar build            # 生产构建

# 后端开发
cd server && npm start  # 启动后端服务

# 移动端
quasar build -m capacitor -T android  # Android 构建
```

## 开发规范

- 使用 ESLint + Prettier 保持代码风格一致
- TypeScript 强类型约束
- 组件遵循单一职责原则
- API 请求统一通过 services 层处理

## 近期更新

- 重构项目文档为 Claude Code 指南
- 添加登录注册和支付的用户协议确认功能
- 优化订阅页面价格展示与优惠计算
- 添加患者信息扩展字段支持
- 取消非管理员查看患者限制

---

## 深度架构分析

### 前端核心页面

| 页面 | 功能 | 路径 |
|------|------|------|
| UploadPage | 病例创建与影像上传 | src/pages/UploadPage.vue |
| StudyDetailPage | AI诊断结论展示 | src/pages/StudyDetailPage.vue |
| StudiesPage | 病例中心 | src/pages/StudiesPage.vue |
| PatientsPage | 患者管理 | src/pages/PatientsPage.vue |

### 后端数据模型关系

```
Patient 1:N Study 1:N StudyImage
              └── 1:1 AnalysisTask 1:1 AnalysisResult 1:1 MedicalReport
```

### API 服务特性

- 双 Token 认证 (Access + Refresh)
- 401 自动刷新重试机制
- 模块化封装 (authAPI, patientAPI, studyAPI 等)

### 第三方集成

- 阿里云 DYPNS (号码认证)
- 阿里云 SMS (短信验证码)
- 通义千问大模型 (AI 诊断建议)
- Sharp (医学影像处理)

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
