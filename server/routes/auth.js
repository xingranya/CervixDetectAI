/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, real_name, phone, hospital_id, employee_id } = req.body;

    // 基础验证
    if ((!email && !employee_id) || !password) {
      return res.status(400).json({
        success: false,
        message: '账号和密码为必填项',
      });
    }

    // 密码长度验证（最低6位）
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      });
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

    // 返回用户信息和tokens
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
        refreshToken,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message,
    });
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
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: '账号未激活',
      });
    }

    if (user.status === 'suspended') {
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
        refreshToken,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
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
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出（客户端删除token即可，此接口可用于记录登出日志）
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 这里可以添加登出日志记录
    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message,
    });
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message,
    });
  }
});

module.exports = router;
