/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const { EmailCode, User } = require('../models');
const emailService = require('../services/email.service');
const { Op } = require('sequelize');

// 常量配置
const CODE_EXPIRE_MINUTES = 5; // 验证码有效期5分钟
const SEND_INTERVAL_SECONDS = 60; // 发送间隔60秒
const MAX_DAILY_SEND_COUNT = 10; // 每日最多10次

/**
 * POST /api/auth/email/send-code
 * 发送邮箱验证码
 */
router.post('/send-code', async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;

    // 参数验证
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址不能为空',
      });
    }

    // 验证邮箱格式
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
    }

    // 验证类型
    if (!['register', 'reset_password'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '验证码类型不正确',
      });
    }

    // 业务逻辑验证
    if (type === 'register') {
      // 注册时检查邮箱是否已被注册
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册',
        });
      }
    } else if (type === 'reset_password') {
      // 重置密码时检查邮箱是否存在
      const existingUser = await User.findOne({ where: { email } });
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱未注册',
        });
      }
    }

    // 频率限制：检查60秒内是否已发送
    const oneMinuteAgo = new Date(Date.now() - SEND_INTERVAL_SECONDS * 1000);
    const recentCode = await EmailCode.findOne({
      where: {
        email,
        created_at: {
          [Op.gte]: oneMinuteAgo,
        },
      },
    });

    if (recentCode) {
      const remainingSeconds = Math.ceil(
        (recentCode.created_at.getTime() + SEND_INTERVAL_SECONDS * 1000 - Date.now()) / 1000,
      );
      return res.status(429).json({
        success: false,
        message: `发送过于频繁，请${remainingSeconds}秒后再试`,
        error: String(remainingSeconds),
      });
    }

    // 频率限制：检查今日发送次数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await EmailCode.count({
      where: {
        email,
        created_at: {
          [Op.gte]: todayStart,
        },
      },
    });

    if (todayCount >= MAX_DAILY_SEND_COUNT) {
      return res.status(429).json({
        success: false,
        message: `今日发送次数已达上限（${MAX_DAILY_SEND_COUNT}次）`,
        error: String(MAX_DAILY_SEND_COUNT),
      });
    }

    // 生成验证码
    const code = emailService.generateCode();

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // 使之前的验证码失效
    await EmailCode.invalidatePreviousCodes(email, type);

    // 发送邮件
    const sendResult = await emailService.sendVerifyCode(email, code, type);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: sendResult.message,
      });
    }

    // 保存验证码记录
    await EmailCode.create({
      email,
      code,
      biz_id: sendResult.bizId,
      type,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000),
    });

    // 返回成功（不包含验证码）
    res.json({
      success: true,
      message: '验证码已发送到您的邮箱',
      data: {
        expiresIn: CODE_EXPIRE_MINUTES * 60, // 秒
      },
    });
  } catch (error) {
    console.error('[EmailAuth] 发送验证码失败:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: '发送验证码失败，请稍后重试',
    });
  }
});

/**
 * POST /api/auth/email/verify
 * 验证邮箱验证码（内部接口，供其他服务调用）
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, code, type = 'register' } = req.body;

    // 参数验证
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: '邮箱和验证码不能为空',
      });
    }

    // 查找有效验证码
    const validCode = await EmailCode.findValidCode(email, code, type);

    if (!validCode) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期',
      });
    }

    // 标记验证码已使用
    await validCode.markAsUsed();

    res.json({
      success: true,
      message: '验证成功',
      data: {
        valid: true,
      },
    });
  } catch (error) {
    console.error('[EmailAuth] 验证码校验失败:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: '验证失败，请稍后重试',
    });
  }
});

/**
 * POST /api/auth/email/reset-password
 * 通过邮箱验证码重置密码
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.trim() : '';
    const normalizedPassword = typeof newPassword === 'string' ? newPassword : '';

    if (!normalizedEmail || !normalizedCode || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: '邮箱、验证码和新密码为必填项',
      });
    }

    if (!emailService.validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '该邮箱未注册',
      });
    }

    const validCode = await EmailCode.findValidCode(normalizedEmail, normalizedCode, 'reset_password');
    if (!validCode) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期',
      });
    }

    await validCode.markAsUsed();
    user.password_hash = normalizedPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('[EmailAuth] 邮箱重置密码失败:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: '重置密码失败，请稍后重试',
    });
  }
});

module.exports = router;
