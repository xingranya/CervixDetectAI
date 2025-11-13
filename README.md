# CervixDetectAI - 宫颈癌AI筛查云平台

## 项目概述

CervixDetectAI 是一个基于 Quasar 框架开发的宫颈癌影像AI辅助筛查SaaS云平台。本项目采用"互联网+医疗"的电子商务SaaS模式，通过云端提供服务，医疗机构可按次、按年或定制化购买服务，极大降低了初始投入门槛，实现了筛查服务的"即插即用"。

### 核心创新

- **技术创新**：通过自研算法，在保持高准确率的同时，显著降低了计算成本和参数数量，使其能在基层医疗机构的普通硬件上流畅运行
- **模式创新**：采用SaaS云服务模式，实现宫颈癌筛查的普惠化

## 功能特性

### 用户认证

- 用户登录/注册
- 会话管理
- 权限控制

### 病例管理

- 病例信息查看
- 病例状态跟踪（已完成、处理中）
- 病例搜索和筛选

### AI分析

- 宫颈图像上传
- AI自动分析处理
- 实时分析进度跟踪
- 分析结果展示

### 报告系统

- 自动报告生成
- 报告下载
- 历史报告查看

### 系统设置

- 个人信息管理
- 通知偏好设置
- AI模型信息查看

## 技术栈

### 前端技术

- **前端框架**: Quasar (Vue 3 + TypeScript)
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **UI组件**: Quasar Components
- **构建工具**: Vite
- **HTTP客户端**: Axios

### 后端技术

- **运行环境**: Node.js + Express
- **数据库**: MySQL (Sequelize ORM)
- **认证方式**: JWT (accessToken + refreshToken)
- **文件上传**: Multer
- **短信服务**: 阿里云短信服务 (Dypnsapi20170525)

## 系统架构

### 前端架构

- **布局系统**: PublicLayout (公共页面) 和 MainLayout (应用主界面)
- **状态管理**:
  - authStore: 用户认证状态
  - studyStore: 病例数据管理
  - analysisStore: AI分析任务管理
- **路由结构**: 包含认证保护的路由系统

### UI组件

- **响应式设计**: 适配桌面端、平板、移动端
- **中文界面**: 完全本地化的中文用户界面
- **数据可视化**: 表格、图表、进度条等

## 安装和运行

### 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn
- MySQL 5.7+ 或 8.0+

### 数据库配置

#### 1. 创建数据库

```sql
CREATE DATABASE cervix_detect_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. 配置数据库连接

在 `server/.env` 文件中配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cervix_detect_ai
```

#### 3. 初始化数据库

运行初始化脚本创建表结构和默认数据：

```bash
cd server
node scripts/init-database.js
```

该脚本会自动创建以下数据表：

- `users` - 用户表
- `patients` - 患者信息表
- `studies` - 病例研究表
- `analysis_tasks` - AI分析任务表
- `reports` - 分析报告表
- `sms_codes` - 短信验证码表

并创建默认管理员账户：

- 邮箱: `admin@cervixdetectai.com`
- 密码: `admin123456`

### 短信服务配置（可选）

如需使用短信验证码登录/注册功能，需配置阿里云短信服务：

在 `server/.env` 文件中添加：

```env
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=your_sign_name
ALIYUN_SMS_TEMPLATE_CODE=your_template_code
```

创建短信验证码表：

```bash
cd server
node scripts/create-sms-table.js
```

### 前端安装步骤

1. 克隆项目

```bash
git clone <repository-url>
cd CervixDetectAI
```

2. 安装前端依赖

```bash
npm install
# 或使用 yarn
yarn install
```

3. 配置环境变量
   复制 `.env.example` 为 `.env` 并配置：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

4. 启动前端开发服务器

```bash
npm run dev
# 或使用 yarn
yarn dev
```

前端将运行在: `http://localhost:9000`

### 后端安装步骤

1. 安装后端依赖

```bash
cd server
npm install
```

2. 配置环境变量
   在 `server/.env` 文件中配置完整参数：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cervix_detect_ai

# JWT密钥
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# 服务器端口
PORT=3000

# 阿里云短信配置（可选）
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=your_sign_name
ALIYUN_SMS_TEMPLATE_CODE=100001
```

3. 初始化数据库（如果还未执行）

```bash
node scripts/init-database.js
```

4. 启动后端服务器

```bash
npm start
# 或使用开发模式（带自动重启）
npm run dev
```

后端将运行在: `http://localhost:3000`

### 构建生产版本

前端构建：

```bash
npm run build
# 或使用 yarn
yarn build
```

构建产物位于 `dist/spa` 目录

## 核心功能

### 用户认证系统

- **邮箱登录**: 支持邮箱+密码登录
- **手机号登录**: 支持手机号+短信验证码登录
- **注册即登录**: 手机号登录时，新用户自动注册并登录
- **JWT认证**: accessToken（1小时）+ refreshToken（7天）双Token机制
- **忘记密码**: 通过短信验证码重置密码

### 用户体验流程

1. **登录页面**: 用户通过邮箱或手机号登录系统
2. **仪表盘**: 查看整体统计信息和近期病例
3. **病例管理**: 查看所有病例记录，支持搜索和筛选
4. **图像上传**: 上传宫颈图像进行AI分析
5. **结果查看**: 查看AI分析结果和详细报告
6. **报告中心**: 访问历史分析报告，支持下载
7. **个人资料**: 管理个人信息、头像、联系方式
8. **系统设置**: 配置通知偏好、密码、隐私设置

### AI分析流程

1. 上传宫颈图像（支持拖拽上传）
2. 填写患者基本信息
3. 系统开始AI分析处理
4. 实时显示分析进度
5. 分析完成后显示诊断结果
6. 提供临床建议和生物标志物信息
7. 自动生成PDF报告

## 项目结构

```
CervixDetectAI/
├── src/                      # 前端源代码
│   ├── assets/              # 静态资源
│   ├── boot/                # Quasar启动文件
│   ├── components/          # 公共组件
│   │   └── EssentialLink.vue
│   ├── layouts/             # 页面布局
│   │   ├── MainLayout.vue   # 主应用布局
│   │   └── PublicLayout.vue # 公共页面布局
│   ├── pages/               # 页面组件
│   │   ├── LoginPage.vue        # 登录页（邮箱/手机号）
│   │   ├── RegisterPage.vue     # 注册页
│   │   ├── ForgotPasswordPage.vue # 忘记密码
│   │   ├── DashboardPage.vue    # 仪表盘
│   │   ├── StudiesPage.vue      # 病例管理
│   │   ├── StudyDetailPage.vue  # 病例详情
│   │   ├── UploadPage.vue       # 上传分析
│   │   ├── ReportsPage.vue      # 报告中心
│   │   ├── ApiSettingsPage.vue  # API设置
│   │   ├── ProfilePage.vue      # 个人资料
│   │   ├── SettingsPage.vue     # 系统设置
│   │   └── ErrorNotFound.vue    # 404页面
│   ├── router/              # 路由配置
│   ├── services/            # API服务
│   │   └── api.ts          # HTTP请求封装
│   ├── stores/              # Pinia状态管理
│   │   ├── authStore.ts    # 认证状态
│   │   ├── studyStore.ts   # 病例数据
│   │   └── analysisStore.ts # AI分析任务
│   └── App.vue              # 根组件
├── server/                   # 后端服务器
│   ├── config/              # 配置文件
│   │   └── database.js     # 数据库配置
│   ├── models/              # Sequelize模型
│   │   ├── User.js         # 用户模型
│   │   ├── Patient.js      # 患者模型
│   │   ├── Study.js        # 病例模型
│   │   ├── AnalysisTask.js # 分析任务模型
│   │   ├── Report.js       # 报告模型
│   │   ├── SmsCode.js      # 短信验证码模型
│   │   └── index.js        # 模型关联
│   ├── routes/              # 路由控制器
│   │   ├── auth.js         # 认证接口
│   │   ├── sms-auth.js     # 短信认证接口
│   │   ├── users.js        # 用户管理
│   │   ├── patients.js     # 患者管理
│   │   ├── studies.js      # 病例管理
│   │   ├── analysis-tasks.js # 分析任务
│   │   ├── reports.js      # 报告管理
│   │   └── analyze.js      # AI分析接口
│   ├── services/            # 业务逻辑
│   │   └── sms.service.js  # 短信服务
│   ├── middleware/          # 中间件
│   │   └── auth.js         # JWT认证中间件
│   ├── scripts/             # 数据库脚本
│   │   ├── init-database.js      # 数据库初始化
│   │   ├── create-sms-table.js   # 创建短信表
│   │   ├── update-study-status.js # 更新病例状态
│   │   └── update-status.sql     # SQL脚本
│   ├── uploads/             # 上传文件目录
│   ├── reports/             # 生成的报告目录
│   ├── .env                 # 环境变量
│   ├── index.js             # 服务器入口
│   └── package.json         # 后端依赖
├── public/                   # 静态资源
├── .env                      # 前端环境变量
├── quasar.config.ts          # Quasar构建配置
├── package.json              # 前端依赖
└── README.md                 # 项目说明
```

## 技术亮点

### 1. 响应式设计

- 完美适配各种屏幕尺寸
- 采用Quasar的响应式布局系统

### 2. 状态管理

- 使用Pinia进行集中式状态管理
- 类型安全的Store定义
- 持久化存储支持

### 3. 国际化支持

- 完全中文界面
- 统一的术语使用

### 4. 性能优化

- 组件懒加载
- 代码分割
- 虚拟滚动（如需要）

## 重要脚本说明

### 数据库管理脚本

#### 1. 初始化数据库

```bash
cd server
node scripts/init-database.js
```

功能：

- 自动创建所有数据表
- 建立表之间的关联关系
- 创建默认管理员账户
- 插入测试数据（可选）

#### 2. 创建短信验证码表

```bash
node scripts/create-sms-table.js
```

功能：

- 创建 `sms_codes` 表
- 设置验证码过期时间（5分钟）
- 配置发送频率限制（60秒）

#### 3. 更新病例状态

```bash
node scripts/update-study-status.js
```

功能：

- 批量更新病例状态
- 修复数据不一致问题

### API接口说明

#### 认证接口 (`/api/auth`)

- `POST /register` - 邮箱注册
- `POST /login` - 邮箱登录
- `POST /refresh` - 刷新Token
- `POST /logout` - 登出
- `GET /me` - 获取当前用户信息

#### 短信认证接口 (`/api/auth/sms`)

- `POST /send-code` - 发送短信验证码
- `POST /login` - 短信验证码登录
- `POST /register` - 短信验证码注册
- `POST /reset-password` - 短信验证码重置密码

#### 病例管理接口 (`/api/studies`)

- `GET /` - 获取病例列表
- `POST /` - 创建新病例
- `GET /:id` - 获取病例详情
- `PUT /:id` - 更新病例信息
- `DELETE /:id` - 删除病例

#### AI分析接口 (`/api/analysis`)

- `POST /analyze` - 开始AI分析
- `GET /tasks` - 获取分析任务列表
- `GET /tasks/:id` - 获取任务详情

#### 报告接口 (`/api/reports`)

- `GET /` - 获取报告列表
- `GET /:id` - 获取报告详情
- `GET /:id/download` - 下载PDF报告

### 环境变量说明

#### 前端 `.env`

```env
VITE_API_BASE_URL=http://localhost:3000/api  # 后端API地址
```

#### 后端 `server/.env`

```env
# 数据库配置
DB_HOST=localhost              # 数据库主机
DB_PORT=3306                   # 数据库端口
DB_USER=root                   # 数据库用户名
DB_PASSWORD=your_password      # 数据库密码
DB_NAME=cervix_detect_ai       # 数据库名称

# JWT配置
JWT_SECRET=your-secret-key                    # JWT密钥（生产环境必须修改）
JWT_REFRESH_SECRET=your-refresh-secret-key    # 刷新Token密钥

# 服务器配置
PORT=3000                      # 服务器端口

# 阿里云短信配置（可选）
ALIYUN_ACCESS_KEY_ID=your_key              # 阿里云AccessKey ID
ALIYUN_ACCESS_KEY_SECRET=your_secret       # 阿里云AccessKey Secret
ALIYUN_SMS_SIGN_NAME=your_sign_name        # 短信签名
ALIYUN_SMS_TEMPLATE_CODE=100001            # 短信模板代码（纯数字，无SMS_前缀）
```

## 开发注意事项

### 数据库设计

- 所有表使用 `utf8mb4_unicode_ci` 字符集，支持中文和emoji
- 时间字段统一使用 `TIMESTAMP` 或 `DATETIME`
- 软删除使用 `deleted_at` 字段
- 外键关联使用 Sequelize 的关联方法

### 认证机制

- accessToken 有效期1小时，存储在内存中
- refreshToken 有效期7天，存储在 localStorage
- 前端自动刷新Token机制
- 后端使用JWT中间件验证所有受保护的路由

### 短信验证码

- 验证码6位数字，有效期5分钟
- 发送频率限制：60秒内只能发送一次
- 每日发送上限：10次/手机号
- 验证码一次性使用，验证后标记为已使用

### 文件上传

- 图像上传限制：10MB
- 支持格式：JPG, PNG, JPEG
- 文件存储在 `server/uploads/` 目录
- 报告生成在 `server/reports/` 目录

## 未来发展

### 模型集成

- 集成真实的宫颈癌AI检测模型
- 实现云端模型服务
- 模型版本管理

### 数据分析

- 提供更详细的统计分析
- 趋势报告生成
- 数据可视化仪表盘

### 扩展功能

- 多用户协作
- 病例分享功能
- 更详细的图像分析工具
- 移动端APP
- 微信小程序

## 生产环境部署

详细的服务器部署文档请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署

```bash
# 1. 克隆代码
git clone <your-repo-url> /var/www/cervixdetectai
cd /var/www/cervixdetectai

# 2. 配置环境变量
cp .env.production .env
cp server/.env.production server/.env
# 编辑环境变量文件，填入实际值

# 3. 初始化数据库
cd server && npm install && node scripts/init-database.js

# 4. 构建前端
cd .. && npm install && npm run build

# 5. 启动服务
pm2 start ecosystem.config.js

# 6. 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/cervixdetectai
sudo ln -s /etc/nginx/sites-available/cervixdetectai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 部署文件说明

- `.env.production` - 前端生产环境配置模板
- `server/.env.production` - 后端生产环境配置模板
- `ecosystem.config.js` - PM2进程管理器配置
- `nginx.conf` - Nginx配置文件模板
- `deploy.sh` - 自动部署脚本

## 许可证

本项目仅供演示和学术研究使用。

## 贡献

欢迎提交Issue和Pull Request来改进本项目。

## 联系我们

如有问题或建议，请通过以下方式联系我们：

- 邮箱: [xingranya@outlook.jp]
- GitHub: [https://github.com/xingranya]
