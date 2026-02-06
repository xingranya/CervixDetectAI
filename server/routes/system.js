/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const dbMonitorService = require('../services/dbMonitorService');
const databaseCleanupService = require('../services/databaseCleanup.service');
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

    res.json({
      success: true,
      data: systemMetrics,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: '获取性能指标失败',
    });
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
    console.error('[System] 数据库清理失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '数据库清理失败',
    });
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
    console.error('[System] 获取表大小失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表大小失败',
    });
  }
});

module.exports = router;
