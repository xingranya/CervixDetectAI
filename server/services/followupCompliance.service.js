/* eslint-disable @typescript-eslint/no-require-imports */
const { Op } = require('sequelize');
const { FollowUp, Patient, Notification } = require('../models');

/**
 * 检查患者随访合规性
 * @param {number} patientId - 患者ID
 * @returns {Promise<{ score: number, total: number, completed: number, overdue: number, details: Array }>}
 */
async function checkCompliance(patientId) {
  // 获取该患者所有非取消的随访
  const followUps = await FollowUp.findAll({
    where: {
      patient_id: patientId,
      status: { [Op.ne]: 'cancelled' },
    },
    include: [{ model: Patient, as: 'patient', attributes: ['id', 'name', 'patient_id'] }],
    order: [['planned_date', 'ASC']],
  });

  const total = followUps.length;
  let completed = 0;
  let overdue = 0;
  let pending = 0;
  const details = [];

  for (const fu of followUps) {
    const item = {
      id: fu.id,
      follow_up_id: fu.follow_up_id,
      planned_date: fu.planned_date,
      status: fu.status,
      risk_level_snapshot: fu.risk_level_snapshot,
      completed_at: fu.completed_at,
    };

    if (fu.status === 'completed') {
      completed += 1;
      item.compliance = 'on_time';
    } else if (fu.status === 'overdue') {
      overdue += 1;
      item.compliance = 'overdue';
    } else {
      pending += 1;
      item.compliance = 'pending';
    }

    details.push(item);
  }

  // 合规评分：按时完成 / (按时完成 + 逾期) * 100
  const denominator = completed + overdue;
  const score =
    denominator > 0 ? Math.round((completed / denominator) * 100) : total === 0 ? 100 : 0;

  return { score, total, completed, overdue, pending, details };
}

/**
 * 批量合规性扫描（供定时任务调用）
 * 扫描所有 pending 且已过期的随访，自动标记为 overdue
 * 高风险逾期超30天推送通知
 * @returns {Promise<{ scanned: number, markedOverdue: number, notified: number }>}
 */
async function batchComplianceScan() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const result = { scanned: 0, markedOverdue: 0, notified: 0 };

  // 查找所有 status=pending 且 planned_date < now 的随访
  const overdueFollowUps = await FollowUp.findAll({
    where: {
      status: 'pending',
      planned_date: { [Op.lt]: todayStr },
    },
    include: [{ model: Patient, as: 'patient', attributes: ['id', 'name', 'patient_id'] }],
  });

  result.scanned = overdueFollowUps.length;

  for (const fu of overdueFollowUps) {
    // 自动更新 status 为 overdue
    await fu.update({ status: 'overdue' });
    result.markedOverdue += 1;

    // 高风险逾期超30天 → 推送通知
    if (['high', 'critical'].includes(fu.risk_level_snapshot)) {
      const plannedDate = new Date(fu.planned_date);
      const now = new Date();
      const diffDays = Math.floor((now - plannedDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= 30) {
        const receiverId = fu.assigned_doctor_id || fu.created_by;
        if (receiverId) {
          const patientName = fu.patient?.name || '未知患者';
          await Notification.create({
            user_id: receiverId,
            type: 'followup_overdue',
            title: '高风险患者随访严重逾期',
            content: `患者【${patientName}】随访计划（${fu.follow_up_id}）已逾期 ${diffDays} 天，风险等级：${fu.risk_level_snapshot}，请立即处理。`,
            related_type: 'followup',
            related_id: fu.id,
            is_read: false,
          });
          result.notified += 1;
        }
      }
    }
  }

  return result;
}

module.exports = { checkCompliance, batchComplianceScan };
