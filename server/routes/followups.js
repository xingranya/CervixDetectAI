/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Op } = require('sequelize');
const { FollowUp, Patient, Study, User, AnalysisResult } = require('../models');
const { authenticate } = require('../middleware/auth');
const {
  createFollowUpNotification,
  ensureFollowUpInfrastructure,
} = require('../services/followupScheduler.service');

const router = express.Router();

function getRecommendedIntervalMonths(riskLevel) {
  if (riskLevel === 'low') return 6;
  if (riskLevel === 'high' || riskLevel === 'critical') return 1;
  return 3;
}

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonthsFromToday(months) {
  const now = new Date();
  const target = new Date(now);
  target.setMonth(target.getMonth() + months);
  return toDateOnlyString(target);
}

function normalizeDateOnly(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return toDateOnlyString(date);
}

function mapFollowUpItem(followUp) {
  const raw = followUp.toJSON();
  raw.is_high_attention = !!(
    raw.ai_flagged_high_attention || raw.doctor_marked_high_attention
  );
  return raw;
}

async function getLatestRiskLevel({ studyId, patientId }) {
  if (studyId) {
    const latest = await AnalysisResult.findOne({
      where: { study_id: studyId },
      order: [['created_at', 'DESC']],
      attributes: ['risk_level'],
    });
    return latest?.risk_level || null;
  }

  if (!patientId) return null;

  const latest = await AnalysisResult.findOne({
    include: [
      {
        model: Study,
        as: 'study',
        required: true,
        attributes: ['id'],
        where: { patient_id: patientId },
      },
    ],
    order: [['created_at', 'DESC']],
    attributes: ['risk_level'],
  });

  return latest?.risk_level || null;
}

function validateStatus(status) {
  return ['pending', 'overdue', 'completed', 'cancelled'].includes(status);
}

/**
 * POST /api/followups
 * 创建随访计划
 */
router.post('/', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const {
      patient_id,
      study_id,
      planned_date,
      assigned_doctor_id,
      reason,
      notes,
      doctor_marked_high_attention,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'patient_id 为必填项',
      });
    }

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    let study = null;
    if (study_id) {
      study = await Study.findByPk(study_id);
      if (!study) {
        return res.status(404).json({
          success: false,
          message: '关联病例不存在',
        });
      }

      if (study.patient_id !== Number(patient_id)) {
        return res.status(400).json({
          success: false,
          message: '病例与患者不匹配',
        });
      }
    }

    if (assigned_doctor_id) {
      const assignedDoctor = await User.findByPk(assigned_doctor_id);
      if (!assignedDoctor) {
        return res.status(404).json({
          success: false,
          message: '指定医生不存在',
        });
      }
    }

    const riskLevel = await getLatestRiskLevel({
      studyId: study_id ? Number(study_id) : null,
      patientId: Number(patient_id),
    });
    const normalizedRiskLevel = riskLevel || 'medium';
    const recommendedIntervalMonths = getRecommendedIntervalMonths(normalizedRiskLevel);
    const autoPlannedDate = addMonthsFromToday(recommendedIntervalMonths);
    const normalizedPlannedDate = normalizeDateOnly(planned_date) || autoPlannedDate;
    const aiFlaggedHighAttention = ['high', 'critical'].includes(normalizedRiskLevel);

    const followUp = await FollowUp.create({
      patient_id: Number(patient_id),
      study_id: study_id ? Number(study_id) : null,
      created_by: req.user.id,
      assigned_doctor_id: assigned_doctor_id ? Number(assigned_doctor_id) : null,
      planned_date: normalizedPlannedDate,
      recommended_interval_months: recommendedIntervalMonths,
      risk_level_snapshot: normalizedRiskLevel,
      ai_flagged_high_attention: aiFlaggedHighAttention,
      doctor_marked_high_attention: !!doctor_marked_high_attention,
      status: normalizedPlannedDate < toDateOnlyString(new Date()) ? 'overdue' : 'pending',
      reason,
      notes,
    });

    const created = await FollowUp.findByPk(followUp.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'name'] },
        { model: Study, as: 'study', attributes: ['id', 'study_id', 'study_type', 'study_date'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] },
        { model: User, as: 'assigned_doctor', attributes: ['id', 'username', 'real_name'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: '随访计划创建成功',
      data: { followup: mapFollowUpItem(created) },
    });
  } catch (error) {
    console.error('创建随访计划失败:', error);
    res.status(500).json({
      success: false,
      message: '创建随访计划失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/followups
 * 获取随访计划列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const {
      page = 1,
      limit = 10,
      status,
      patient_id,
      assigned_doctor_id,
      high_attention,
      date_from,
      date_to,
      keyword,
    } = req.query;

    const where = {};
    if (status && validateStatus(status)) {
      where.status = status;
    }
    if (patient_id) {
      where.patient_id = Number(patient_id);
    }
    if (assigned_doctor_id) {
      where.assigned_doctor_id = Number(assigned_doctor_id);
    }
    if (date_from || date_to) {
      const normalizedDateFrom = date_from ? normalizeDateOnly(date_from) : null;
      const normalizedDateTo = date_to ? normalizeDateOnly(date_to) : null;

      if ((date_from && !normalizedDateFrom) || (date_to && !normalizedDateTo)) {
        return res.status(400).json({
          success: false,
          message: '日期筛选参数格式不正确',
        });
      }

      where.planned_date = {};
      if (normalizedDateFrom) where.planned_date[Op.gte] = normalizedDateFrom;
      if (normalizedDateTo) where.planned_date[Op.lte] = normalizedDateTo;
    }

    const andConditions = [];
    if (high_attention === 'true') {
      andConditions.push({
        [Op.or]: [{ ai_flagged_high_attention: true }, { doctor_marked_high_attention: true }],
      });
    } else if (high_attention === 'false') {
      andConditions.push({
        ai_flagged_high_attention: false,
        doctor_marked_high_attention: false,
      });
    }

    if (keyword) {
      const keywordLike = `%${keyword}%`;
      andConditions.push({
        [Op.or]: [
          { follow_up_id: { [Op.like]: keywordLike } },
          { reason: { [Op.like]: keywordLike } },
          { notes: { [Op.like]: keywordLike } },
          { '$patient.name$': { [Op.like]: keywordLike } },
          { '$patient.patient_id$': { [Op.like]: keywordLike } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
    }

    const { count, rows } = await FollowUp.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'name'] },
        { model: Study, as: 'study', attributes: ['id', 'study_id', 'study_type', 'study_date'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] },
        { model: User, as: 'assigned_doctor', attributes: ['id', 'username', 'real_name'] },
      ],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [
        ['planned_date', 'ASC'],
        ['created_at', 'DESC'],
      ],
      distinct: true,
      subQuery: false,
    });

    res.json({
      success: true,
      data: {
        followups: rows.map(mapFollowUpItem),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('获取随访列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取随访列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/followups/:id
 * 获取随访详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'name'] },
        { model: Study, as: 'study', attributes: ['id', 'study_id', 'study_type', 'study_date'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] },
        { model: User, as: 'assigned_doctor', attributes: ['id', 'username', 'real_name'] },
      ],
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    res.json({
      success: true,
      data: { followup: mapFollowUpItem(followUp) },
    });
  } catch (error) {
    console.error('获取随访详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取随访详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/followups/:id
 * 更新随访计划
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    const {
      planned_date,
      assigned_doctor_id,
      reason,
      notes,
      study_id,
      doctor_marked_high_attention,
    } = req.body;

    const updateData = {};

    if (study_id !== undefined) {
      if (study_id === null || study_id === '') {
        updateData.study_id = null;
      } else {
        const study = await Study.findByPk(study_id);
        if (!study) {
          return res.status(404).json({
            success: false,
            message: '关联病例不存在',
          });
        }
        if (study.patient_id !== followUp.patient_id) {
          return res.status(400).json({
            success: false,
            message: '病例与随访患者不匹配',
          });
        }
        updateData.study_id = Number(study_id);
      }
    }

    if (assigned_doctor_id !== undefined) {
      if (assigned_doctor_id === null || assigned_doctor_id === '') {
        updateData.assigned_doctor_id = null;
      } else {
        const assignedDoctor = await User.findByPk(assigned_doctor_id);
        if (!assignedDoctor) {
          return res.status(404).json({
            success: false,
            message: '指定医生不存在',
          });
        }
        updateData.assigned_doctor_id = Number(assigned_doctor_id);
      }
    }

    if (planned_date !== undefined) {
      const normalizedPlannedDate = normalizeDateOnly(planned_date);
      if (!normalizedPlannedDate) {
        return res.status(400).json({
          success: false,
          message: 'planned_date 格式不正确',
        });
      }
      updateData.planned_date = normalizedPlannedDate;

      if (followUp.status === 'pending' || followUp.status === 'overdue') {
        const today = toDateOnlyString(new Date());
        updateData.status = normalizedPlannedDate < today ? 'overdue' : 'pending';
      }
    }

    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (doctor_marked_high_attention !== undefined) {
      updateData.doctor_marked_high_attention = !!doctor_marked_high_attention;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '未检测到可更新字段',
      });
    }

    await followUp.update(updateData);

    const updated = await FollowUp.findByPk(followUp.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'name'] },
        { model: Study, as: 'study', attributes: ['id', 'study_id', 'study_type', 'study_date'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'real_name'] },
        { model: User, as: 'assigned_doctor', attributes: ['id', 'username', 'real_name'] },
      ],
    });

    res.json({
      success: true,
      message: '随访计划更新成功',
      data: { followup: mapFollowUpItem(updated) },
    });
  } catch (error) {
    console.error('更新随访计划失败:', error);
    res.status(500).json({
      success: false,
      message: '更新随访计划失败',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/followups/:id/complete
 * 完成随访
 */
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    if (followUp.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '已取消的随访计划无法完成',
      });
    }

    if (followUp.status === 'completed') {
      return res.json({
        success: true,
        message: '该随访计划已是完成状态',
        data: { followup: mapFollowUpItem(followUp) },
      });
    }

    await followUp.update({
      status: 'completed',
      completed_at: new Date(),
    });

    res.json({
      success: true,
      message: '已标记为完成',
      data: { followup: mapFollowUpItem(followUp) },
    });
  } catch (error) {
    console.error('完成随访失败:', error);
    res.status(500).json({
      success: false,
      message: '完成随访失败',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/followups/:id/cancel
 * 取消随访
 */
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    if (followUp.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '已完成的随访计划无法取消',
      });
    }

    if (followUp.status === 'cancelled') {
      return res.json({
        success: true,
        message: '该随访计划已是取消状态',
        data: { followup: mapFollowUpItem(followUp) },
      });
    }

    await followUp.update({
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    res.json({
      success: true,
      message: '随访计划已取消',
      data: { followup: mapFollowUpItem(followUp) },
    });
  } catch (error) {
    console.error('取消随访失败:', error);
    res.status(500).json({
      success: false,
      message: '取消随访失败',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/followups/:id/high-attention
 * 医生手动切换重点关注
 */
router.patch('/:id/high-attention', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    const { marked } = req.body;
    if (typeof marked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'marked 必须为布尔值',
      });
    }

    await followUp.update({
      doctor_marked_high_attention: marked,
    });

    res.json({
      success: true,
      message: marked ? '已标记为重点关注' : '已取消重点关注',
      data: { followup: mapFollowUpItem(followUp) },
    });
  } catch (error) {
    console.error('更新重点关注状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新重点关注状态失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/followups/:id/remind
 * 手动发送站内提醒
 */
router.post('/:id/remind', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    const followUp = await FollowUp.findByPk(req.params.id, {
      include: [{ model: Patient, as: 'patient', attributes: ['id', 'name', 'patient_id'] }],
    });
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: '随访计划不存在',
      });
    }

    const receiverId = followUp.assigned_doctor_id || followUp.created_by;
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: '随访计划未配置接收提醒的用户',
      });
    }

    const notification = await createFollowUpNotification({
      userId: receiverId,
      followUp,
      patientName: followUp.patient?.name || '未知患者',
      updateReminderAt: true,
    });

    res.json({
      success: true,
      message: '站内提醒已发送',
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error('手动发送提醒失败:', error);
    res.status(500).json({
      success: false,
      message: '手动发送提醒失败',
      error: error.message,
    });
  }
});

module.exports = router;
