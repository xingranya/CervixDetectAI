/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { User, EmailCode } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const emailService = require('../services/email.service');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const { handleRouteError } = require('../utils/errorHandler');
const { logAudit } = require('../middleware/auditLogger');

const router = express.Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, real_name, phone, hospital_id, employee_id, emailCode } =
      req.body;

    // 基础验证：邮箱和工号至少需要一个
    if ((!email && !employee_id) || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写邮箱或工号信息（至少需要一种），密码为必填项',
      });
    }

    // 密码长度验证（最低6位）
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      });
    }

    // 邮箱验证码校验（如果提供了邮箱）
    if (email && emailCode) {
      const validCode = await EmailCode.findOne({
        where: {
          email,
          code: emailCode,
          type: 'register',
          status: 'pending',
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!validCode) {
        return res.status(400).json({
          success: false,
          message: '邮箱验证码无效或已过期',
        });
      }

      // 标记验证码已使用
      await validCode.update({ status: 'used' });
    }

    // 邮箱格式验证
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确',
        });
      }

      // 检查邮箱是否已存在
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '该邮箱已被注册',
        });
      }
    }

    // 检查工号是否已存在
    if (employee_id) {
      const existingEmployee = await User.findOne({ where: { employee_id } });
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: '该工号已被注册',
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

    // 创建用户（password_hash会在beforeSave hook中自动加密）
    const user = await User.create({
      username: username || `user_${Date.now()}`,
      email: email || null,
      password_hash: password, // beforeSave hook会自动加密
      real_name,
      phone,
      hospital_id,
      employee_id,
      role: 'user', // 默认角色
      status: 'active', // 注册即激活
    });

    // 生成tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    if (user.email) {
      const receiverName = user.real_name || user.username || '用户';
      emailService
        .sendRegisterSuccessEmail(user.email, { username: receiverName })
        .then((sendResult) => {
          if (!sendResult.success) {
            console.error('注册成功欢迎邮件发送失败:', sendResult.message);
          }
        })
        .catch((emailError) => {
          console.error('注册成功欢迎邮件发送异常:', emailError.message);
        });
    }

    // 通过 HttpOnly Cookie 设置 refreshToken
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: '/api/auth',
    });

    // 返回用户信息和 accessToken（refreshToken 不再通过响应体返回）
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
          hospital_id: user.hospital_id,
          employee_id: user.employee_id,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
        },
        accessToken,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Auth', endpoint: 'POST /register' });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, hospital_id, employee_id } = req.body;

    // 验证必填字段
    if ((!email && (!hospital_id || !employee_id)) || !password) {
      return res.status(400).json({
        success: false,
        message: '账号和密码为必填项',
      });
    }

    // 查找用户
    let user;
    if (hospital_id && employee_id) {
      user = await User.findOne({ where: { hospital_id, employee_id } });
    } else {
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误',
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 检查账号状态
    // User.status 枚举为 active/disabled；兼容历史值 inactive/suspended
    if (user.status === 'disabled' || user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
    }

    // 更新最后登录时间
    await user.update({ last_login_at: new Date() });

    // 生成tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 通过 HttpOnly Cookie 设置 refreshToken
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: '/api/auth',
    });

    // 记录登录审计日志
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      details: { method: email ? 'email' : 'employee_id' },
      req,
    });

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
          hospital_id: user.hospital_id,
          employee_id: user.employee_id,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
          last_login_at: user.last_login_at,
        },
        accessToken,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Auth', endpoint: 'POST /login' });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', async (req, res) => {
  try {
    // 从 HttpOnly Cookie 读取 refreshToken
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '未提供刷新令牌',
      });
    }

    // 验证refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效或已过期的刷新令牌',
      });
    }

    // 检查token类型
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: '令牌类型错误',
      });
    }

    // 获取用户信息
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用',
      });
    }

    // 生成新的access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Auth', endpoint: 'POST /refresh' });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出（客户端删除token即可，此接口可用于记录登出日志）
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 记录登出审计日志
    await logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      resourceType: 'user',
      resourceId: req.user.id,
      req,
    });

    // 清除 refreshToken Cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Auth', endpoint: 'POST /logout' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          real_name: req.user.real_name,
          phone: req.user.phone,
          avatar_url: req.user.avatar_url,
          role: req.user.role,
          status: req.user.status,
          created_at: req.user.created_at,
          last_login_at: req.user.last_login_at,
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Auth', endpoint: 'GET /me' });
  }
});

module.exports = router;
