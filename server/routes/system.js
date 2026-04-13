/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const dbMonitorService = require('../services/dbMonitorService');
const databaseCleanupService = require('../services/databaseCleanup.service');
const os = require('os');
const { handleRouteError } = require('../utils/errorHandler');
const { authenticate } = require('../middleware/auth');
const { AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');

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

    res.json({
      success: true,
      data: systemMetrics,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'System', endpoint: 'GET /db-metrics' });
  }
});

/**
 * @swagger
 * /system/database/cleanup:
 *   post:
 *     summary: 执行数据库清理（管理员）
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 清理完成
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                 report:
 *                   type: string
 *       401:
 *         description: 未授权
 *       403:
 *         description: 非管理员
 */
router.post('/database/cleanup', async (req, res) => {
  try {
    // TODO: 添加管理员权限验证
    // const user = req.user;
    // if (!user || !user.is_admin) {
    //   return res.status(403).json({ message: '需要管理员权限' });
    // }

    const summary = await databaseCleanupService.performCleanup();
    const report = databaseCleanupService.generateReport(summary);

    res.json({
      success: true,
      message: '清理完成',
      data: { summary, report },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'System', endpoint: 'POST /database/cleanup' });
  }
});

/**
 * @swagger
 * /system/database/size:
 *   get:
 *     summary: 获取数据库表大小信息
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取表大小
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   table_name:
 *                     type: string
 *                   size_mb:
 *                     type: number
 *                   table_rows:
 *                     type: integer
 */
router.get('/database/size', async (req, res) => {
  try {
    const tableSizes = await databaseCleanupService.getTableSizes();
    res.json({
      success: true,
      data: tableSizes,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'System', endpoint: 'GET /database/size' });
  }
});

/**
 * GET /api/system/monitor
 * 实时监控数据
 */
router.get('/monitor', authenticate, async (req, res) => {
  try {
    // CPU 使用率
    const cpuUsage = os.loadavg(); // [1min, 5min, 15min]
    const cpuCount = os.cpus().length;

    // 内存使用
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const processMemory = process.memoryUsage();

    // 数据库连接池状态
    const pool = sequelize.connectionManager.pool;
    const dbPool = {
      size: pool?.size || 0,
      available: pool?.available || 0,
      pending: pool?.pending || 0,
    };

    // 分析队列状态
    let analysisQueue = { running: 0, waiting: 0, concurrency: 3 };
    try {
      const { analysisTaskQueue } = require('../services/simpleAnalysisQueue.service');
      analysisQueue = analysisTaskQueue.getStatus();
    } catch {
      // 队列服务不可用时使用默认值
    }

    // 进程运行时间
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        cpu: { loadAvg: cpuUsage, count: cpuCount },
        memory: {
          total: totalMem,
          free: freeMem,
          used: totalMem - freeMem,
          usagePercent: ((totalMem - freeMem) / totalMem * 100).toFixed(1),
          process: {
            rss: processMemory.rss,
            heapTotal: processMemory.heapTotal,
            heapUsed: processMemory.heapUsed,
          },
        },
        database: dbPool,
        analysisQueue,
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'System', endpoint: 'GET /monitor' });
  }
});

/**
 * GET /api/system/monitor/history
 * 历史监控数据（基于审计日志统计）
 */
router.get('/monitor/history', authenticate, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 按小时统计操作数
    const hourlyStats = await AuditLog.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00'), 'hour'],
        [sequelize.fn('COUNT', '*'), 'count'],
      ],
      where: { created_at: { [Op.gte]: since } },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00'), 'ASC']],
      raw: true,
    });

    // 按操作类型统计
    const actionStats = await AuditLog.findAll({
      attributes: ['action', [sequelize.fn('COUNT', '*'), 'count']],
      where: { created_at: { [Op.gte]: since } },
      group: ['action'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        hourlyStats,
        actionStats,
        period: { hours, since },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'System', endpoint: 'GET /monitor/history' });
  }
});

module.exports = router;
