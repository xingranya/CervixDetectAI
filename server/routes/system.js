/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const dbMonitorService = require('../services/dbMonitorService');
const os = require('os');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: 系统监控与管理
 */

/**
 * @swagger
 * /system/db-metrics:
 *   get:
 *     summary: 获取数据库性能指标
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 成功获取指标
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                 qps:
 *                   type: number
 *                 avgResponseTime:
 *                   type: number
 *                 healthScore:
 *                   type: number
 */
router.get('/db-metrics', (req, res) => {
  try {
    const metrics = dbMonitorService.getMetrics();

    // 添加系统级指标
    const systemMetrics = {
      ...metrics,
      system: {
        memoryUsage: process.memoryUsage(),
        cpuLoad: os.loadavg(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      },
    };

    res.json(systemMetrics);
  } catch {
    res.status(500).json({ error: '获取性能指标失败' });
  }
});

module.exports = router;
