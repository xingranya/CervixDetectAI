/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();

// Mock Data
let users = [
  { id: 1, name: '李华', role: 'admin', status: 'active' },
  { id: 2, name: '王芳', role: 'senior', status: 'active' },
  { id: 3, name: '刘伟', role: 'doctor', status: 'inactive' },
];

let systemParams = {
  lowRiskThreshold: 0.3,
  highRiskThreshold: 0.7,
  includeSummary: true,
  includeFollowUp: true,
  requireReview: false,
  analysisMode: 'balanced',
  saveIntermediate: true,
  diagnosticStandard: 'who2020',
};

let logs = [
  { time: '2025-12-12 10:23:11', message: '用户[张明]登录系统。' },
  { time: '2025-12-12 09:45:30', message: 'AI模型完成病例[20251211005]分析，置信度: 0.92。' },
  { time: '2025-12-12 02:00:15', message: '每日数据备份任务执行成功，大小: 4.7GB。' },
  { time: '2025-12-11 22:10:05', message: '系统服务重启完成，版本: V1.0.0。' },
];

/**
 * @swagger
 * /settings/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 */
router.get('/users', (req, res) => {
  res.json(users);
});

/**
 * @swagger
 * /settings/users:
 *   post:
 *     summary: 添加用户
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: 用户创建成功
 */
router.post('/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body,
    status: 'active',
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /settings/params:
 *   get:
 *     summary: 获取系统参数
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功获取系统参数
 */
router.get('/params', (req, res) => {
  res.json(systemParams);
});

/**
 * @swagger
 * /settings/params:
 *   put:
 *     summary: 更新系统参数
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 参数更新成功
 */
router.put('/params', (req, res) => {
  systemParams = { ...systemParams, ...req.body };
  res.json(systemParams);
});

/**
 * @swagger
 * /settings/logs:
 *   get:
 *     summary: 获取系统日志
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功获取日志
 */
router.get('/logs', (req, res) => {
  res.json(logs);
});

/**
 * @swagger
 * /settings/ai-model:
 *   get:
 *     summary: 获取AI模型信息
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功获取模型信息
 */
router.get('/ai-model', (req, res) => {
  res.json({
    name: 'CervixNet-V3.2',
    releaseDate: '2025-11-20',
    accuracy: 0.967,
    status: 'running',
    performance: {
      dates: ['11-01', '11-08', '11-15', '11-22', '11-29', '12-06', '12-12'],
      accuracy: [0.912, 0.923, 0.935, 0.942, 0.951, 0.962, 0.967],
      recall: [0.898, 0.905, 0.918, 0.927, 0.934, 0.945, 0.952],
    },
  });
});

module.exports = router;
