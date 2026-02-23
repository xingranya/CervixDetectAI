/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { User, UserAvatar } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于头像上传
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message,
    });
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

      if (normalizedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return res.status(400).json({
            success: false,
            message: '邮箱格式不正确',
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

        updateData.email = normalizedEmail;
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
    console.error('更新用户信息错误:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: '邮箱已被使用，请更换后重试',
      });
    }
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message,
    });
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
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/users/me/avatar
 * 上传头像
 */
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传头像文件',
      });
    }

    const originalPath = req.file.path;
    const baseDir = path.dirname(originalPath);
    const baseName = path.basename(originalPath, path.extname(originalPath));

    // 生成多个尺寸的头像
    const sizes = [
      { name: 'large', width: 500, height: 500 },
      { name: 'medium', width: 200, height: 200 },
      { name: 'small', width: 100, height: 100 },
      { name: 'thumbnail', width: 50, height: 50 },
    ];

    const avatarPaths = {};

    for (const size of sizes) {
      const outputPath = path.join(baseDir, `${baseName}-${size.name}.jpg`);
      await sharp(originalPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      avatarPaths[`${size.name}_url`] = `/uploads/avatars/${path.basename(outputPath)}`;
    }

    // 获取图片元数据
    const metadata = await sharp(originalPath).metadata();

    // 删除原始文件
    fs.unlinkSync(originalPath);

    // 保存到数据库
    const avatar = await UserAvatar.create({
      user_id: req.user.id,
      original_url: avatarPaths.large_url,
      large_url: avatarPaths.large_url,
      medium_url: avatarPaths.medium_url,
      small_url: avatarPaths.small_url,
      thumbnail_url: avatarPaths.thumbnail_url,
      file_size: req.file.size,
      mime_type: req.file.mimetype || 'image/jpeg',
      width: metadata.width || 500,
      height: metadata.height || 500,
    });

    // 更新用户表的avatar_url
    await req.user.update({ avatar_url: avatarPaths.medium_url });

    res.json({
      success: true,
      message: '头像上传成功',
      data: { avatar },
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    // 如果出错,删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: '上传头像失败',
      error: error.message,
    });
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
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message,
    });
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message,
    });
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
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message,
    });
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
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message,
    });
  }
});

module.exports = router;
