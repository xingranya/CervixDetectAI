/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { Op } = require('sequelize');
const { User, UserAvatar, EmailCode } = require('../models');
const emailService = require('../services/email.service');
const { uploadBufferToTucang } = require('../services/tucang.service');
const { authenticate, authorize } = require('../middleware/auth');
const { CODE_EXPIRE_MINUTES, SEND_INTERVAL_SECONDS, MAX_DAILY_SEND_COUNT } = require('../constants/verification');
const { validateEmail } = require('../utils/validators');
const { checkSendInterval, checkDailyLimit } = require('../utils/rateLimiter');
const { handleRouteError } = require('../utils/errorHandler');

const router = express.Router();

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, GIF, WebP 格式的图片'));
    }
  },
});

/**
 * GET /api/users/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserAvatar,
          as: 'avatars',
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'GET /me' });
  }
});

/**
 * PUT /api/users/me
 * 更新当前用户信息
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { real_name, phone, email } = req.body;
    const updateData = {};

    if (real_name !== undefined) {
      const normalizedRealName = typeof real_name === 'string' ? real_name.trim() : '';
      updateData.real_name = normalizedRealName || null;
    }

    if (phone !== undefined) {
      const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
      updateData.phone = normalizedPhone || null;
    }

    if (email !== undefined) {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const currentEmail = (req.user.email || '').trim().toLowerCase();

      if (normalizedEmail) {
        if (!validateEmail(normalizedEmail)) {
          return res.status(400).json({
            success: false,
            message: '邮箱格式不正确',
          });
        }

        // 邮箱变更需走验证码验证链路，避免直接修改绕过校验
        if (normalizedEmail !== currentEmail) {
          return res.status(409).json({
            success: false,
            message: '邮箱变更需先完成验证码校验，请使用“发送验证码/确认更换邮箱”流程',
          });
        }
      }
    }

    await req.user.update(updateData);

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.json({
      success: true,
      message: '更新成功',
      data: { user: updatedUser },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'PUT /me' });
  }
});

/**
 * POST /api/users/me/email/send-code
 * 发送更换邮箱验证码（验证新邮箱）
 */
router.post('/me/email/send-code', authenticate, async (req, res) => {
  try {
    const { new_email } = req.body;
    const normalizedEmail = typeof new_email === 'string' ? new_email.trim().toLowerCase() : '';
    const currentEmail = (req.user.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: '新邮箱不能为空',
      });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: '新邮箱格式不正确',
      });
    }

    if (normalizedEmail === currentEmail) {
      return res.status(400).json({
        success: false,
        message: '新邮箱与当前邮箱一致，无需更换',
      });
    }

    const existedUser = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: req.user.id },
      },
    });

    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被其他账号使用',
      });
    }

    // 频率限制：检查发送间隔
    const intervalResult = await checkSendInterval(
      EmailCode, 'email', normalizedEmail, SEND_INTERVAL_SECONDS, { type: 'change_email' },
    );
    if (!intervalResult.allowed) {
      return res.status(429).json({
        success: false,
        message: `发送过于频繁，请${intervalResult.remainingSeconds}秒后再试`,
        error: String(intervalResult.remainingSeconds),
      });
    }

    // 频率限制：检查每日发送上限
    const dailyResult = await checkDailyLimit(
      EmailCode, 'email', normalizedEmail, MAX_DAILY_SEND_COUNT, { type: 'change_email' },
    );
    if (!dailyResult.allowed) {
      return res.status(429).json({
        success: false,
        message: `今日发送次数已达上限（${MAX_DAILY_SEND_COUNT}次）`,
        error: String(MAX_DAILY_SEND_COUNT),
      });
    }

    const code = emailService.generateCode();
    await EmailCode.invalidatePreviousCodes(normalizedEmail, 'change_email');
    const sendResult = await emailService.sendVerifyCode(normalizedEmail, code, 'change_email');

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: sendResult.message || '验证码发送失败，请稍后重试',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await EmailCode.create({
      email: normalizedEmail,
      code,
      biz_id: sendResult.bizId,
      type: 'change_email',
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000),
    });

    res.json({
      success: true,
      message: '验证码已发送到新邮箱',
      data: {
        expiresIn: CODE_EXPIRE_MINUTES * 60,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'POST /me/email/send-code' });
  }
});

/**
 * POST /api/users/me/email/confirm
 * 确认更换邮箱
 */
router.post('/me/email/confirm', authenticate, async (req, res) => {
  try {
    const { new_email, code } = req.body;
    const normalizedEmail = typeof new_email === 'string' ? new_email.trim().toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.trim() : '';

    if (!normalizedEmail || !normalizedCode) {
      return res.status(400).json({
        success: false,
        message: '新邮箱和验证码不能为空',
      });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: '新邮箱格式不正确',
      });
    }

    const existedUser = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: req.user.id },
      },
    });

    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被其他账号使用',
      });
    }

    const validCode = await EmailCode.findValidCode(normalizedEmail, normalizedCode, 'change_email');
    if (!validCode) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期',
      });
    }

    await validCode.markAsUsed();
    await req.user.update({ email: normalizedEmail });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.json({
      success: true,
      message: '邮箱更换成功',
      data: { user: updatedUser },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'POST /me/email/confirm' });
  }
});

/**
 * PUT /api/users/me/password
 * 修改密码
 */
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // 验证必填字段
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码为必填项',
      });
    }

    // 验证新密码长度
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少6位',
      });
    }

    // 获取完整用户信息（包含password_hash）
    const user = await User.findByPk(req.user.id);

    // 验证当前密码
    const isValidPassword = await user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误',
      });
    }

    // 更新密码（beforeSave hook会自动加密）
    await user.update({ password_hash: new_password });

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'PUT /me/password' });
  }
});

/**
 * POST /api/users/me/avatar
 * 上传头像
 */
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: '请上传头像文件',
      });
    }

    const uploadedAvatar = await uploadBufferToTucang({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      folderId: process.env.TUCANG_AVATAR_FOLDER_ID,
    });
    const avatarUrl = uploadedAvatar.url;

    const metadata = await sharp(req.file.buffer).metadata().catch(() => null);

    // 保存到数据库
    const avatar = await UserAvatar.create({
      user_id: req.user.id,
      original_url: avatarUrl,
      large_url: avatarUrl,
      medium_url: avatarUrl,
      small_url: avatarUrl,
      thumbnail_url: avatarUrl,
      file_size: req.file.size,
      mime_type: req.file.mimetype || 'image/jpeg',
      width: metadata.width || 500,
      height: metadata.height || 500,
    });

    // 更新用户表的avatar_url
    await req.user.update({ avatar_url: avatarUrl });

    res.json({
      success: true,
      message: '头像上传成功',
      data: { avatar },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'POST /me/avatar' });
  }
});

/**
 * GET /api/users
 * 获取用户列表（仅管理员）
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { real_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'GET /' });
  }
});

/**
 * GET /api/users/:id
 * 获取指定用户信息（仅管理员）
 */
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserAvatar,
          as: 'avatars',
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'GET /:id' });
  }
});

/**
 * PUT /api/users/:id
 * 更新用户信息（仅管理员）
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    const { real_name, phone, role, status } = req.body;
    const updateData = {};

    if (real_name !== undefined) updateData.real_name = real_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.json({
      success: true,
      message: '更新成功',
      data: { user: updatedUser },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'PUT /:id' });
  }
});

/**
 * DELETE /api/users/:id
 * 删除用户（软删除，仅管理员）
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 不能删除自己
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己',
      });
    }

    // 软删除
    await user.destroy();

    res.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Users', endpoint: 'DELETE /:id' });
  }
});

module.exports = router;
