/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const analyzeRouter = require('./routes/analyze');
const authRouter = require('./routes/auth');
const smsAuthRouter = require('./routes/sms-auth');
const usersRouter = require('./routes/users');
const patientsRouter = require('./routes/patients');
const studiesRouter = require('./routes/studies');
const analysisTasksRouter = require('./routes/analysis-tasks');
const reportsRouter = require('./routes/reports');
const { testConnection } = require('./config/sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

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
    origin: ['http://localhost:9000', 'http://localhost:9001', 'http://localhost:9002'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(uploadDir));
app.use('/reports', express.static(reportsDir));

// 路由
app.use('/api/auth', authRouter);
app.use('/api/auth/sms', smsAuthRouter);
app.use('/api/users', usersRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/analysis-tasks', analysisTasksRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analyze', analyzeRouter);

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
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
});
