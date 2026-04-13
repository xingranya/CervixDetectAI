/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Op } = require('sequelize');
const { Patient, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');
const { logAudit } = require('../middleware/auditLogger');

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
      phone,
      sexual_history,
      id_card,
      medical_card_no,
      address,
      emergency_contact,
      emergency_phone,
      emergency_relation,
      allergy_history,
      medical_history,
      family_history,
      notes,
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
      phone,
      sexual_history: sexual_history || 'none',
      id_card,
      medical_card_no,
      address,
      emergency_contact,
      emergency_phone,
      emergency_relation,
      allergy_history,
      medical_history,
      family_history,
      notes,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: '患者创建成功',
      data: { patient },
    });

    // 记录创建患者审计日志
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_PATIENT',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { name: patient.name },
      req,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Patients', endpoint: 'POST /' });
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

    // 权限调整：允许所有用户查看所有患者
    // if (req.user.role !== 'admin') {
    //   where.created_by = req.user.id;
    // }

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
    handleRouteError(res, error, { service: 'Patients', endpoint: 'GET /' });
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

    // 权限调整：允许所有用户查看所有患者
    // if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: '无权访问该患者信息',
    //   });
    // }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Patients', endpoint: 'GET /:id' });
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
      phone,
      sexual_history,
      id_card,
      medical_card_no,
      address,
      emergency_contact,
      emergency_phone,
      emergency_relation,
      allergy_history,
      medical_history,
      family_history,
      notes,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (phone !== undefined) updateData.phone = phone;
    if (sexual_history !== undefined) updateData.sexual_history = sexual_history;
    if (id_card !== undefined) updateData.id_card = id_card;
    if (medical_card_no !== undefined) updateData.medical_card_no = medical_card_no;
    if (address !== undefined) updateData.address = address;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
    if (emergency_phone !== undefined) updateData.emergency_phone = emergency_phone;
    if (emergency_relation !== undefined) updateData.emergency_relation = emergency_relation;
    if (allergy_history !== undefined) updateData.allergy_history = allergy_history;
    if (medical_history !== undefined) updateData.medical_history = medical_history;
    if (family_history !== undefined) updateData.family_history = family_history;
    if (notes !== undefined) updateData.notes = notes;

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

    // 记录更新患者审计日志
    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_PATIENT',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { updatedFields: Object.keys(updateData) },
      req,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Patients', endpoint: 'PUT /:id' });
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

    // 记录删除患者审计日志
    await logAudit({
      userId: req.user.id,
      action: 'DELETE_PATIENT',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { name: patient.name },
      req,
    });

    res.json({
      success: true,
      message: '患者已删除',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Patients', endpoint: 'DELETE /:id' });
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

    // 权限调整：允许所有用户查看所有患者
    // if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: '无权访问该患者信息',
    //   });
    // }

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
    handleRouteError(res, error, { service: 'Patients', endpoint: 'GET /:id/studies' });
  }
});

module.exports = router;
