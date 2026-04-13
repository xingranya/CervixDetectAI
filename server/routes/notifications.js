/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { ensureFollowUpInfrastructure } = require('../services/followupScheduler.service');
const { handleRouteError } = require('../utils/errorHandler');

const router = express.Router();

async function seedDefaultNotificationsForUser(userId) {
  const total = await Notification.count({
    where: { user_id: userId },
  });

  if (total > 0) {
    return;
  }

  await Notification.bulkCreate([
    {
      user_id: userId,
      type: 'followup_due',
      title: '复查提醒：今日有随访到期',
      content: '有患者随访计划已到期，请及时安排复查并更新随访状态。',
      related_type: 'followup',
      related_id: null,
      is_read: false,
    },
    {
      user_id: userId,
      type: 'followup_high_attention',
      title: '重点关注患者提醒',
      content: '检测到高风险随访任务，建议优先处理重点关注患者。',
      related_type: 'followup',
      related_id: null,
      is_read: false,
    },
    {
      user_id: userId,
      type: 'system',
      title: '系统提示：已启用随访管理',
      content: '你可以在“随访管理”页面使用预设模板一键创建复查计划。',
      related_type: 'study',
      related_id: null,
      is_read: true,
      read_at: new Date(),
    },
  ]);
}

/**
 * GET /api/notifications
 * 获取当前用户通知列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();
    await seedDefaultNotificationsForUser(req.user.id);

    const { page = 1, limit = 20 } = req.query;
    const currentPage = Number(page);
    const pageSize = Number(limit);

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: currentPage,
          limit: pageSize,
          pages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Notifications', endpoint: 'GET /' });
  }
});

/**
 * GET /api/notifications/unread-count
 * 获取未读通知数量
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();
    await seedDefaultNotificationsForUser(req.user.id);

    const unreadCount = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false,
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Notifications', endpoint: 'GET /unread-count' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * 标记单条通知为已读
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: '通知不存在',
      });
    }

    if (!notification.is_read) {
      await notification.update({
        is_read: true,
        read_at: new Date(),
      });
    }

    res.json({
      success: true,
      message: '通知已标记为已读',
      data: { notification },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Notifications', endpoint: 'PATCH /:id/read' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * 全部标记为已读
 */
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const [updatedCount] = await Notification.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          user_id: req.user.id,
          is_read: false,
        },
      },
    );

    res.json({
      success: true,
      message: '已全部标记为已读',
      data: { updatedCount },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Notifications', endpoint: 'PATCH /read-all' });
  }
});

module.exports = router;
