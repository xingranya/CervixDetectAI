/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Study, Patient, StudyImage, User, AnalysisTask } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于影像文件上传
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/studies');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `study-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadImages = multer({
  storage: imageStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, TIFF, BMP 格式的医学影像'));
    }
  },
});

/**
 * POST /api/studies
 * 创建病例
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patient_id,
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
    } = req.body;

    // 验证必填字段
    if (!patient_id || !study_date || !study_type) {
      return res.status(400).json({
        success: false,
        message: '患者ID、检查日期和检查类型为必填项',
      });
    }

    // 验证患者是否存在
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能为自己创建的患者创建病例
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权为该患者创建病例',
      });
    }

    // 创建病例（study_id会在beforeCreate hook中自动生成）
    const study = await Study.create({
      patient_id,
      user_id: req.user.id,
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
      status: 'pending',
    });

    const createdStudy = await Study.findByPk(study.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patient_id', 'name', 'gender', 'birth_date'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '病例创建成功',
      data: { study: createdStudy },
    });
  } catch (error) {
    console.error('创建病例错误:', error);
    res.status(500).json({
      success: false,
      message: '创建病例失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/studies/:id/images
 * 上传影像文件
 */
router.post('/:id/images', authenticate, uploadImages.array('images', 10), async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      // 清理已上传的文件
      if (req.files) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 验证权限
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      // 清理已上传的文件
      if (req.files) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(403).json({
        success: false,
        message: '无权上传影像',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请上传影像文件',
      });
    }

    // 保存影像信息到数据库
    const images = [];
    for (const file of req.files) {
      const image = await StudyImage.create({
        study_id: study.id,
        file_path: `/uploads/studies/${file.filename}`,
        original_filename: file.originalname,
        stored_filename: file.filename,
        file_size: file.size,
        mime_type: file.mimetype,
        file_format: 'JPEG', // 默认格式
      });
      images.push(image);
    }

    res.json({
      success: true,
      message: `成功上传 ${images.length} 个影像文件`,
      data: { images },
    });
  } catch (error) {
    console.error('上传影像错误:', error);
    // 清理已上传的文件
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: '上传影像失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/studies
 * 获取病例列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📡 [GET /api/studies] 接收到请求');
    console.log('👤 [GET /api/studies] 用户信息:', { id: req.user.id, role: req.user.role });

    const { page = 1, limit = 10, patient_id, status, study_type, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('🔍 [GET /api/studies] 查询参数:', {
      page,
      limit,
      patient_id,
      status,
      study_type,
      search,
    });

    const where = {};

    // 筛选条件
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (study_type) where.study_type = study_type;

    if (search) {
      where[Op.or] = [
        { study_id: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { clinical_diagnosis: { [Op.like]: `%${search}%` } },
      ];
    }

    // 非管理员只能看到自己创建的病例
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
      console.log('🔒 [GET /api/studies] 非管理员，只查询自己的病例');
    } else {
      console.log('🔓 [GET /api/studies] 管理员，查询所有病例');
    }

    console.log('📊 [GET /api/studies] WHERE 条件:', where);

    const { count, rows } = await Study.findAndCountAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patient_id', 'name', 'gender', 'birth_date'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: StudyImage,
          as: 'images',
          attributes: ['id', 'file_path', 'original_filename', 'created_at'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['study_date', 'DESC']],
    });

    console.log('✅ [GET /api/studies] 查询结果: 总数 =', count, ', 返回 =', rows.length);
    console.log(
      '📊 [GET /api/studies] 病例数据:',
      rows.map((r) => ({ id: r.id, study_id: r.study_id, status: r.status })),
    );

    res.json({
      success: true,
      data: {
        studies: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('❌ [GET /api/studies] 获取病例列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取病例列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/studies/:id
 * 获取病例详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: StudyImage,
          as: 'images',
        },
        {
          model: AnalysisTask,
          as: 'analysis_tasks',
        },
      ],
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能查看自己创建的病例
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该病例',
      });
    }

    res.json({
      success: true,
      data: { study },
    });
  } catch (error) {
    console.error('获取病例详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取病例详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/studies/:id
 * 更新病例信息
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能更新自己创建的病例
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该病例',
      });
    }

    const {
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
      status,
    } = req.body;

    const updateData = {};
    if (study_date !== undefined) updateData.study_date = study_date;
    if (study_type !== undefined) updateData.study_type = study_type;
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
    if (clinical_diagnosis !== undefined) updateData.clinical_diagnosis = clinical_diagnosis;
    if (symptoms !== undefined) updateData.symptoms = symptoms;
    if (status !== undefined) updateData.status = status;

    await study.update(updateData);

    const updatedStudy = await Study.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.json({
      success: true,
      message: '更新成功',
      data: { study: updatedStudy },
    });
  } catch (error) {
    console.error('更新病例错误:', error);
    res.status(500).json({
      success: false,
      message: '更新病例失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/studies/:id
 * 删除病例（软删除）
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能删除自己创建的病例
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该病例',
      });
    }

    // 软删除
    await study.destroy();

    res.json({
      success: true,
      message: '病例已删除',
    });
  } catch (error) {
    console.error('删除病例错误:', error);
    res.status(500).json({
      success: false,
      message: '删除病例失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/studies/:id/images/:imageId
 * 删除病例影像
 */
router.delete('/:id/images/:imageId', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 验证权限
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除影像',
      });
    }

    const image = await StudyImage.findByPk(req.params.imageId);

    if (!image || image.study_id !== study.id) {
      return res.status(404).json({
        success: false,
        message: '影像不存在',
      });
    }

    // 删除文件
    const filePath = path.join(__dirname, '..', image.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await image.destroy();

    res.json({
      success: true,
      message: '影像已删除',
    });
  } catch (error) {
    console.error('删除影像错误:', error);
    res.status(500).json({
      success: false,
      message: '删除影像失败',
      error: error.message,
    });
  }
});

module.exports = router;
