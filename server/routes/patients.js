/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Op } = require('sequelize');
const { Patient, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/patients
 * 创建患者
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      gender,
      birth_date,
      id_card,
      phone,
      address,
      emergency_contact,
      emergency_phone,
      medical_history,
      allergies,
    } = req.body;

    // 验证必填字段
    if (!name || !gender) {
      return res.status(400).json({
        success: false,
        message: '姓名和性别为必填项',
      });
    }

    // 检查身份证号是否已存在
    if (id_card) {
      const existingPatient = await Patient.findOne({ where: { id_card } });
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: '该身份证号已存在',
        });
      }
    }

    // 创建患者（patient_id会在beforeCreate hook中自动生成）
    const patient = await Patient.create({
      name,
      gender,
      birth_date,
      id_card,
      phone,
      address,
      emergency_contact,
      emergency_phone,
      medical_history,
      allergies,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: '患者创建成功',
      data: { patient },
    });
  } catch (error) {
    console.error('创建患者错误:', error);
    res.status(500).json({
      success: false,
      message: '创建患者失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/patients
 * 获取患者列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, gender } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { patient_id: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { id_card: { [Op.like]: `%${search}%` } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    // 非管理员只能看到自己创建的患者
    if (req.user.role !== 'admin') {
      where.created_by = req.user.id;
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        patients: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取患者列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取患者列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/patients/:id
 * 获取患者详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能查看自己创建的患者
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该患者信息',
      });
    }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    console.error('获取患者详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取患者详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/patients/:id
 * 更新患者信息
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能更新自己创建的患者
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该患者信息',
      });
    }

    const {
      name,
      gender,
      birth_date,
      id_card,
      phone,
      address,
      emergency_contact,
      emergency_phone,
      medical_history,
      allergies,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (id_card !== undefined) updateData.id_card = id_card;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
    if (emergency_phone !== undefined) updateData.emergency_phone = emergency_phone;
    if (medical_history !== undefined) updateData.medical_history = medical_history;
    if (allergies !== undefined) updateData.allergies = allergies;

    // 如果更新身份证号,检查是否重复
    if (id_card && id_card !== patient.id_card) {
      const existingPatient = await Patient.findOne({ where: { id_card } });
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: '该身份证号已存在',
        });
      }
    }

    await patient.update(updateData);

    const updatedPatient = await Patient.findByPk(req.params.id, {
      include: [
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
      data: { patient: updatedPatient },
    });
  } catch (error) {
    console.error('更新患者信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新患者信息失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/patients/:id
 * 删除患者（软删除）
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能删除自己创建的患者
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该患者',
      });
    }

    // 软删除
    await patient.destroy();

    res.json({
      success: true,
      message: '患者已删除',
    });
  } catch (error) {
    console.error('删除患者错误:', error);
    res.status(500).json({
      success: false,
      message: '删除患者失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/patients/:id/studies
 * 获取患者的所有病例
 */
router.get('/:id/studies', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能查看自己创建的患者
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该患者信息',
      });
    }

    const { Study } = require('../models');
    const studies = await Study.findAll({
      where: { patient_id: patient.id },
      order: [['study_date', 'DESC']],
    });

    res.json({
      success: true,
      data: { studies },
    });
  } catch (error) {
    console.error('获取患者病例错误:', error);
    res.status(500).json({
      success: false,
      message: '获取患者病例失败',
      error: error.message,
    });
  }
});

module.exports = router;
