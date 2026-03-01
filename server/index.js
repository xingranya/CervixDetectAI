/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const analyzeRouter = require('./routes/analyze');
const authRouter = require('./routes/auth');
const smsAuthRouter = require('./routes/sms-auth');
const emailAuthRouter = require('./routes/email-auth');
const usersRouter = require('./routes/users');
const patientsRouter = require('./routes/patients');
const studiesRouter = require('./routes/studies');
const analysisTasksRouter = require('./routes/analysis-tasks');
const reportsRouter = require('./routes/reports');
const dashboardRouter = require('./routes/dashboard');
const systemRouter = require('./routes/system');
const settingsRouter = require('./routes/settings');
const paymentRouter = require('./routes/payment');
const chatRouter = require('./routes/chat');
const followupsRouter = require('./routes/followups');
const notificationsRouter = require('./routes/notifications');
const patientInsightsRouter = require('./routes/patient-insights');
const { testConnection, syncDatabase } = require('./config/sequelize');
const swaggerUi = require('swagger-ui-express');
const {
  ensureFollowUpInfrastructure,
  startFollowUpScheduler,
} = require('./services/followupScheduler.service');
const { ensureEmailInfrastructure } = require('./services/emailInfrastructure.service');

const app = express();
const PORT = process.env.PORT || 4000;

// OpenAPI 文档路径（放在 server/docs 目录下，方便部署）
const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');

// 确保必要的目录存在
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const reportsDir = path.join(__dirname, process.env.PDF_OUTPUT_DIR || 'reports');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 中间件
// 生产环境安全头设置
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

const defaultCorsOrigins = [
  'http://localhost:9000',
  'http://localhost:9001',
  'http://localhost:9002',
];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : defaultCorsOrigins;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(
  compression({
    // SSE 流式响应不压缩，避免缓冲导致数据无法实时到达前端
    filter: (req, res) => {
      if (res.getHeader('Content-Type')?.toString().includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/reports', express.static(reportsDir));
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRouter);
app.use('/api/auth/sms', smsAuthRouter);
app.use('/api/auth/email', emailAuthRouter);
app.use('/api/users', usersRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/analysis-tasks', analysisTasksRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/system', systemRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/patient-insights', patientInsightsRouter);

// 使用环境变量配置前端构建路径，便于服务器部署
const distPath = process.env.FRONTEND_DIST_PATH
  ? path.resolve(process.env.FRONTEND_DIST_PATH)
  : path.join(__dirname, '../../dist/spa');

if (fs.existsSync(distPath)) {
  console.log(`📦 静态资源托管开启: ${distPath}`);
  // 1. 托管静态文件 (CSS, JS, Fonts, Images)
  app.use(express.static(distPath));

  // 2. 处理 SPA 前端路由 (所有非 API 请求都返回 index.html)
  app.get(/^(?!\/(api|uploads|reports)).*$/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('⚠️ 未找到前端构建产物，仅运行 API 服务');
}
// -----------------------

// 错误处理中间件
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(openapiPath);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/openapi.yaml',
    },
  }),
);

// 访问根路径时跳转到文档
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 CervixDetectAI 后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 API基础路径: http://localhost:${PORT}/api`);
  console.log(`📁 前端资源路径: ${distPath}`);
  console.log(`💾 上传目录: ${uploadDir}`);
  console.log(`📄 报告目录: ${reportsDir}`);
  console.log(`🤖 通义千问模型: ${process.env.QWEN_MODEL || '未配置'}`);
  console.log(`🔧 运行环境: ${process.env.NODE_ENV || 'development'}`);
  startFollowUpScheduler();

  // 测试数据库连接
  try {
    await testConnection();
    console.log('✅ 数据库连接成功');

    // 独立保障随访模块表结构，避免 DB_SYNC=false 导致新功能直接报 500
    await ensureFollowUpInfrastructure();
    // 独立保障邮箱验证码枚举，避免 DB_SYNC=false 导致 change_email 不可用
    await ensureEmailInfrastructure();

    // 数据库同步（通过 DB_SYNC 环境变量控制）
    // DB_SYNC=true 启用同步，DB_SYNC=false 或不设置则跳过
    if (process.env.DB_SYNC === 'true') {
      console.log('🔄 正在同步数据库表结构...');
      await syncDatabase({ alter: true });
      console.log('✅ 数据库表结构同步完成');
    }
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
});
