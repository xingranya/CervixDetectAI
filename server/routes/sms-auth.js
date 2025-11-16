/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 短信验证登录注册路由
 * 提供基于短信验证码的登录和注册功能
 */
const express = require('express');
const { Op } = require('sequelize');
const { User } = require('../models');
const SmsCode = require('../models/SmsCode');
const smsService = require('../services/sms.service');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const router = express.Router();

// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 5;
// 同一手机号发送间隔（秒）
const SEND_INTERVAL_SECONDS = 60;
// 每日同一手机号最大发送次数
const MAX_DAILY_SEND_COUNT = 10;

/**
 * POST /api/auth/sms/send-code
 * 发送短信验证码
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone, type = 'login' } = req.body;

    // 验证手机号
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号',
      });
    }

    if (!smsService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确',
      });
    }

    // 验证类型
    if (!['login', 'register', 'reset_password'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '验证码类型不正确',
      });
    }

    // 检查发送频率限制
    const recentCode = await SmsCode.findOne({
      where: {
        phone,
        created_at: {
          [Op.gte]: new Date(Date.now() - SEND_INTERVAL_SECONDS * 1000),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (recentCode) {
      const waitSeconds = Math.ceil(
        (SEND_INTERVAL_SECONDS * 1000 - (Date.now() - new Date(recentCode.created_at).getTime())) /
          1000,
      );
      return res.status(429).json({
        success: false,
        message: `发送过于频繁，请${waitSeconds}秒后再试`,
      });
    }

    // 检查每日发送次数限制
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await SmsCode.count({
      where: {
        phone,
        created_at: {
          [Op.gte]: todayStart,
        },
      },
    });

    if (todayCount >= MAX_DAILY_SEND_COUNT) {
      return res.status(429).json({
        success: false,
        message: '今日发送次数已达上限，请明天再试',
      });
    }

    // 如果是注册，检查手机号是否已存在
    if (type === 'register') {
      const existingUser = await User.findOne({ where: { phone } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '该手机号已被注册',
        });
      }
    }

    // 如果是重置密码，检查手机号是否存在
    if (type === 'reset_password') {
      const existingUser = await User.findOne({ where: { phone } });
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: '该手机号未注册',
        });
      }
    }

    // 注意：type === 'login' 时不检查手机号是否存在，支持登录/注册通用

    // 获取客户端IP
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // 发送短信
    const sendResult = await smsService.sendVerifyCode(phone, CODE_EXPIRE_MINUTES);

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: `短信发送失败: ${sendResult.error}`,
      });
    }

    // 计算过期时间
    const expiresAt = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000);

    // 保存验证码记录（使用阿里云返回的验证码）
    await SmsCode.create({
      phone,
      code: sendResult.code, // 使用阿里云生成的验证码
      biz_id: sendResult.bizId,
      type,
      status: 'pending',
      expires_at: expiresAt,
      ip_address: ipAddress,
    });

    console.log(
      `📱 [短信验证码] 已发送 - 手机号: ${phone}, 类型: ${type}, 验证码: ${sendResult.code}`,
    );

    res.json({
      success: true,
      message: '验证码已发送',
      data: {
        expiresIn: CODE_EXPIRE_MINUTES * 60, // 秒
      },
    });
  } catch (error) {
    console.error('❌ [短信验证码] 发送失败:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/sms/login
 * 短信验证码登录
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, code } = req.body;

    // 验证必填字段
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号和验证码为必填项',
      });
    }

    // 验证手机号格式
    if (!smsService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确',
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '该手机号未注册',
      });
    }

    // 检查账号状态
    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
    }

    // 查找验证码
    const smsCode = await SmsCode.findOne({
      where: {
        phone,
        code,
        type: 'login',
        status: 'pending',
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (!smsCode) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期',
      });
    }

    // 标记验证码为已使用
    await smsCode.update({ status: 'used' });

    // 更新最后登录时间和IP
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await user.update({
      last_login_at: new Date(),
      last_login_ip: ipAddress,
    });

    // 生成tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ [短信登录] 用户登录成功 - 手机号: ${phone}, 用户ID: ${user.id}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          real_name: user.real_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
          last_login_at: user.last_login_at,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ [短信登录] 登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/sms/register
 * 短信验证码注册
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, code, username, real_name, email } = req.body;

    // 验证必填字段
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号和验证码为必填项',
      });
    }

    // 验证手机号格式
    if (!smsService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确',
      });
    }

    // 检查手机号是否已存在
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '该手机号已被注册',
      });
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确',
        });
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: '该邮箱已被注册',
        });
      }
    }

    // 检查用户名是否已存在（如果提供了用户名）
    if (username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: '该用户名已被使用',
        });
      }
    }

    // 查找验证码（注意：登录/注册通用，都使用login类型）
    const smsCode = await SmsCode.findOne({
      where: {
        phone,
        code,
        type: 'login', // 登录/注册通用，都查找login类型
        status: 'pending',
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (!smsCode) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期',
      });
    }

    // 标记验证码为已使用
    await smsCode.update({ status: 'used' });

    // 创建用户（短信注册不需要密码，可以后续设置）
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user = await User.create({
      username: username || `user_${phone}`,
      email: email || `${phone}@temp.local`, // 临时邮箱，后续可修改
      password_hash: await require('bcrypt').hash(Math.random().toString(36), 10), // 随机密码
      real_name,
      phone,
      role: 'user',
      status: 'active',
      last_login_at: new Date(),
      last_login_ip: ipAddress,
    });

    // 生成tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ [短信注册] 用户注册成功 - 手机号: ${phone}, 用户ID: ${user.id}`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          real_name: user.real_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ [短信注册] 注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/sms/reset-password
 * 通过短信验证码重置密码
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    // 验证必填字段
    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '手机号、验证码和新密码为必填项',
      });
    }

    // 验证手机号格式
    if (!smsService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确',
      });
    }

    // 密码长度验证
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '该手机号未注册',
      });
    }

    // 查找验证码
    const smsCode = await SmsCode.findOne({
      where: {
        phone,
        code,
        type: 'reset_password',
        status: 'pending',
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (!smsCode) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期',
      });
    }

    // 标记验证码为已使用
    await smsCode.update({ status: 'used' });

    // 更新密码
    user.password_hash = newPassword; // beforeSave hook会自动加密
    await user.save();

    console.log(`✅ [重置密码] 密码重置成功 - 手机号: ${phone}, 用户ID: ${user.id}`);

    res.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('❌ [重置密码] 重置失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message,
    });
  }
});

module.exports = router;
