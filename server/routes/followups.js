/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { FollowUp, Patient, Study, User, AnalysisResult } = require('../models');
const { authenticate } = require('../middleware/auth');
const {
  createFollowUpNotification,
  ensureFollowUpInfrastructure,
} = require('../services/followupScheduler.service');
const { handleRouteError } = require('../utils/errorHandler');
const { logAudit } = require('../middleware/auditLogger');
const { recommendTemplate, getTemplateById } = require('../services/followupTemplate.service');
const { checkCompliance } = require('../services/followupCompliance.service');

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
  raw.is_high_attention = !!(raw.ai_flagged_high_attention || raw.doctor_marked_high_attention);
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
 * GET /api/followups/templates/recommend
 * 根据病例分析结果推荐随访模板
 */
router.get('/templates/recommend', authenticate, async (req, res) => {
  try {
    const { study_id } = req.query;
    if (!study_id) {
      return res.status(400).json({ success: false, message: 'study_id 为必填参数' });
    }

    // 获取最新分析结果
    const analysisResult = await AnalysisResult.findOne({
      where: { study_id: Number(study_id) },
      order: [['created_at', 'DESC']],
      attributes: ['diagnosis', 'risk_level'],
    });

    const diagnosisText = analysisResult?.diagnosis || '';
    const riskLevel = analysisResult?.risk_level || 'medium';

    const result = recommendTemplate(diagnosisText, riskLevel);
    res.json({
      success: true,
      data: {
        recommended: result.recommended,
        alternatives: result.alternatives,
        source: { diagnosis: diagnosisText, risk_level: riskLevel },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'GET /templates/recommend' });
  }
});

/**
 * GET /api/followups/compliance/:patientId
 * 获取患者随访合规性评分
 */
router.get('/compliance/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: '患者不存在' });
    }

    const result = await checkCompliance(Number(patientId));
    res.json({ success: true, data: result });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'GET /compliance/:patientId' });
  }
});

/**
 * GET /api/followups/statistics
 * 随访完成率统计报表
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    await ensureFollowUpInfrastructure();

    // 概览统计
    const statusCounts = await FollowUp.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const overview = { total: 0, completed: 0, overdue: 0, cancelled: 0, pending: 0 };
    for (const row of statusCounts) {
      const count = Number(row.count);
      overview[row.status] = count;
      overview.total += count;
    }

    // 完成率
    const completionDenominator = overview.completed + overview.overdue;
    const completionRate =
      completionDenominator > 0
        ? Math.round((overview.completed / completionDenominator) * 100)
        : 0;

    // 平均完成天数（从创建到完成）
    const avgResult = await FollowUp.findOne({
      attributes: [[fn('AVG', literal('DATEDIFF(completed_at, created_at)')), 'avg_days']],
      where: { status: 'completed', completed_at: { [Op.ne]: null } },
      raw: true,
    });
    const avgCompletionDays = avgResult?.avg_days ? Math.round(Number(avgResult.avg_days)) : 0;

    // 近12个月按月统计
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const monthStart = twelveMonthsAgo.toISOString().slice(0, 10);

    const monthlyRaw = await FollowUp.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('planned_date'), '%Y-%m'), 'month'],
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { planned_date: { [Op.gte]: monthStart } },
      group: [literal("DATE_FORMAT(planned_date, '%Y-%m')"), 'status'],
      raw: true,
    });

    // 按月聚合
    const monthMap = {};
    for (const row of monthlyRaw) {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, completed: 0, overdue: 0, total: 0 };
      }
      const count = Number(row.count);
      monthMap[row.month].total += count;
      if (row.status === 'completed') monthMap[row.month].completed += count;
      if (row.status === 'overdue') monthMap[row.month].overdue += count;
    }
    const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // 按风险等级统计
    const riskRaw = await FollowUp.findAll({
      attributes: ['risk_level_snapshot', 'status', [fn('COUNT', col('id')), 'count']],
      where: { risk_level_snapshot: { [Op.ne]: null } },
      group: ['risk_level_snapshot', 'status'],
      raw: true,
    });

    const riskMap = {};
    for (const row of riskRaw) {
      const risk = row.risk_level_snapshot;
      if (!riskMap[risk]) {
        riskMap[risk] = { risk, total: 0, completed: 0, overdue: 0 };
      }
      const count = Number(row.count);
      riskMap[risk].total += count;
      if (row.status === 'completed') riskMap[risk].completed += count;
      if (row.status === 'overdue') riskMap[risk].overdue += count;
    }
    const byRisk = Object.values(riskMap);

    // 按医生统计
    const doctorRaw = await FollowUp.findAll({
      attributes: ['assigned_doctor_id', 'status', [fn('COUNT', col('FollowUp.id')), 'count']],
      include: [
        { model: User, as: 'assigned_doctor', attributes: ['id', 'username', 'real_name'] },
      ],
      where: { assigned_doctor_id: { [Op.ne]: null } },
      group: ['assigned_doctor_id', 'status'],
      raw: true,
      nest: true,
    });

    const doctorMap = {};
    for (const row of doctorRaw) {
      const docId = row.assigned_doctor_id;
      if (!doctorMap[docId]) {
        doctorMap[docId] = {
          doctorId: docId,
          doctorName:
            row.assigned_doctor?.real_name || row.assigned_doctor?.username || `医生#${docId}`,
          total: 0,
          completed: 0,
        };
      }
      const count = Number(row.count);
      doctorMap[docId].total += count;
      if (row.status === 'completed') doctorMap[docId].completed += count;
    }
    const byDoctor = Object.values(doctorMap);

    res.json({
      success: true,
      data: {
        overview,
        completionRate,
        avgCompletionDays,
        byMonth,
        byRisk,
        byDoctor,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'GET /statistics' });
  }
});

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
      template_id,
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

    // 如果提供了模板ID，用模板数据自动填充
    let templateData = null;
    if (template_id) {
      templateData = getTemplateById(template_id);
    }

    const finalReason = reason || (templateData ? templateData.description : undefined);
    const finalNotes =
      notes || (templateData ? `检查清单：${templateData.checklist.join('、')}` : undefined);
    const finalIntervalMonths = templateData
      ? templateData.interval_months
      : recommendedIntervalMonths;
    const finalPlannedDate =
      normalizedPlannedDate ||
      (templateData ? addMonthsFromToday(templateData.interval_months) : normalizedPlannedDate);

    const followUp = await FollowUp.create({
      patient_id: Number(patient_id),
      study_id: study_id ? Number(study_id) : null,
      created_by: req.user.id,
      assigned_doctor_id: assigned_doctor_id ? Number(assigned_doctor_id) : null,
      planned_date: finalPlannedDate,
      recommended_interval_months: finalIntervalMonths,
      risk_level_snapshot: normalizedRiskLevel,
      ai_flagged_high_attention: aiFlaggedHighAttention,
      doctor_marked_high_attention: !!doctor_marked_high_attention,
      status: finalPlannedDate < toDateOnlyString(new Date()) ? 'overdue' : 'pending',
      reason: finalReason,
      notes: finalNotes,
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

    // 记录创建随访审计日志
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_FOLLOWUP',
      resourceType: 'followup',
      resourceId: followUp.id,
      details: { patient_id: Number(patient_id), planned_date: finalPlannedDate },
      req,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'POST /' });
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
    // 默认排除已取消的随访，除非明确筛选该状态
    if (!status) {
      where.status = { [Op.ne]: 'cancelled' };
    } else if (validateStatus(status)) {
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
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'GET /' });
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
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'GET /:id' });
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
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'PUT /:id' });
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

    // 记录完成随访审计日志
    await logAudit({
      userId: req.user.id,
      action: 'COMPLETE_FOLLOWUP',
      resourceType: 'followup',
      resourceId: followUp.id,
      req,
    });

    res.json({
      success: true,
      message: '已标记为完成',
      data: { followup: mapFollowUpItem(followUp) },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'PATCH /:id/complete' });
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

    // 所有状态都可取消（包括已完成）
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
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'PATCH /:id/cancel' });
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
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'PATCH /:id/high-attention' });
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

    const receiverIds = Array.from(
      new Set(
        [followUp.assigned_doctor_id, followUp.created_by, req.user.id]
          .filter((value) => Number.isFinite(Number(value)) && Number(value) > 0)
          .map((value) => Number(value)),
      ),
    );

    if (receiverIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '随访计划未配置接收提醒的用户',
      });
    }

    const notifications = [];
    for (const [index, receiverId] of receiverIds.entries()) {
      const notification = await createFollowUpNotification({
        userId: receiverId,
        followUp,
        patientName: followUp.patient?.name || '未知患者',
        updateReminderAt: index === 0,
      });

      if (notification) {
        notifications.push(notification);
      }
    }

    res.json({
      success: true,
      message: '站内提醒已发送',
      data: {
        notification: notifications[0] || null,
        notifications,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'FollowUps', endpoint: 'POST /:id/remind' });
  }
});

module.exports = router;
