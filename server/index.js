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
const { testConnection, syncDatabase } = require('./config/sequelize');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 4000;

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CervixDetectAI API 文档',
      version: '1.0.0',
      description: '宫颈病变智能风险评估与辅助诊断系统 API 接口文档',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: '本地开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // 指定包含注解的路由文件
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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
app.use(
  cors({
    origin: [
      'http://localhost:9000',
      'http://localhost:9001',
      'http://localhost:9002',
      'http://182.140.180.9:9001',
      'http://182.140.180.9:26140',
    ],
    credentials: true,
  }),
);
app.use(compression()); // 启用Gzip压缩
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 CervixDetectAI 后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 API基础路径: http://localhost:${PORT}/api`);
  console.log(`💾 上传目录: ${uploadDir}`);
  console.log(`📄 报告目录: ${reportsDir}`);
  console.log(`🤖 通义千问模型: ${process.env.QWEN_MODEL}`);

  // 测试数据库连接
  try {
    await testConnection();
    console.log('✅ 数据库连接成功');

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
