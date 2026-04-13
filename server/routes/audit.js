/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');
const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * GET /api/audit/logs
 * 审计日志列表（分页、筛选）
 */
router.get('/logs', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      action,
      resource_type,
      date_from,
      date_to,
      keyword,
    } = req.query;

    const where = {};

    if (user_id) {
      where.user_id = Number(user_id);
    }
    if (action) {
      where.action = action;
    }
    if (resource_type) {
      where.resource_type = resource_type;
    }
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }
    if (keyword) {
      const keywordLike = `%${keyword}%`;
      where[Op.or] = [
        { action: { [Op.like]: keywordLike } },
        { resource_type: { [Op.like]: keywordLike } },
        { ip_address: { [Op.like]: keywordLike } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Audit', endpoint: 'GET /logs' });
  }
});

/**
 * GET /api/audit/logs/export
 * 导出审计日志（CSV）
 */
router.get('/logs/export', authenticate, async (req, res) => {
  try {
    const { user_id, action, resource_type, date_from, date_to } = req.query;

    const where = {};
    if (user_id) where.user_id = Number(user_id);
    if (action) where.action = action;
    if (resource_type) where.resource_type = resource_type;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 10000, // 导出上限
    });

    // CSV 表头
    const headers = ['ID', '时间', '用户', '操作', '资源类型', '资源ID', 'IP地址', '详情'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.created_at ? new Date(log.created_at).toLocaleString('zh-CN') : '',
        log.user?.real_name || log.user?.username || (log.user_id ? `用户#${log.user_id}` : '系统'),
        log.action,
        log.resource_type || '',
        log.resource_id || '',
        log.ip_address || '',
        log.details ? JSON.stringify(log.details).replace(/,/g, '，') : '',
      ];
      csvRows.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    // BOM 头支持 Excel 中文显示
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    handleRouteError(res, error, { service: 'Audit', endpoint: 'GET /logs/export' });
  }
});

/**
 * GET /api/audit/logs/summary
 * 操作统计摘要
 */
router.get('/logs/summary', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 今日操作总数
    const todayCount = await AuditLog.count({
      where: { created_at: { [Op.gte]: todayStart } },
    });

    // 按 action 分组的操作次数（近24小时）
    const actionStats = await AuditLog.findAll({
      attributes: ['action', [sequelize.fn('COUNT', '*'), 'count']],
      where: { created_at: { [Op.gte]: last24h } },
      group: ['action'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true,
    });

    // 最近24小时活跃用户数
    const activeUsers = await AuditLog.count({
      where: {
        created_at: { [Op.gte]: last24h },
        user_id: { [Op.ne]: null },
      },
      distinct: true,
      col: 'user_id',
    });

    // 按小时分布（近24小时）— 使用 MySQL DATE_FORMAT
    const hourlyStats = await AuditLog.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00'), 'hour'],
        [sequelize.fn('COUNT', '*'), 'count'],
      ],
      where: { created_at: { [Op.gte]: last24h } },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m-%d %H:00'), 'ASC']],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        todayCount,
        actionStats,
        activeUsers,
        hourlyStats,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Audit', endpoint: 'GET /logs/summary' });
  }
});

module.exports = router;
