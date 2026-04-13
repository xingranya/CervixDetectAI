/* eslint-disable @typescript-eslint/no-require-imports */
const cron = require('node-cron');
const { Op } = require('sequelize');
const { FollowUp, Notification, Patient } = require('../models');
const { batchComplianceScan } = require('./followupCompliance.service');

let scheduledTask = null;
let complianceTask = null;
let ensureInfrastructurePromise = null;

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isHighAttention(followUp) {
  return !!(followUp.ai_flagged_high_attention || followUp.doctor_marked_high_attention);
}

function buildReminderPayload(followUp, patientName, todayStr) {
  const plannedDate = followUp.planned_date;
  const overdue = plannedDate < todayStr;
  const highAttention = isHighAttention(followUp);

  let type = 'followup_due';
  let title = '复查提醒';

  if (highAttention) {
    type = 'followup_high_attention';
    title = overdue ? '重点关注患者复查已超期' : '重点关注患者复查提醒';
  } else if (overdue) {
    type = 'followup_overdue';
    title = '复查超期提醒';
  }

  const content = overdue
    ? `患者【${patientName}】随访计划（${followUp.follow_up_id}）已超期，计划复查日期：${plannedDate}，请尽快处理。`
    : `患者【${patientName}】随访计划（${followUp.follow_up_id}）今日到期，计划复查日期：${plannedDate}。`;

  return { type, title, content };
}

async function createFollowUpNotification({
  userId,
  followUp,
  patientName,
  reminderPayload,
  updateReminderAt = true,
}) {
  if (!userId || !followUp) {
    return null;
  }

  const payload =
    reminderPayload ||
    buildReminderPayload(followUp, patientName || '未知患者', formatDateOnly(new Date()));

  const notification = await Notification.create({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    related_type: 'followup',
    related_id: followUp.id,
    is_read: false,
  });

  if (updateReminderAt) {
    await followUp.update({ last_reminded_at: new Date() });
  }

  return notification;
}

async function ensureFollowUpInfrastructure() {
  if (!ensureInfrastructurePromise) {
    ensureInfrastructurePromise = (async () => {
      // 独立确保随访模块依赖表存在，避免 DB_SYNC=false 时新功能表缺失
      await Notification.sync();
      await FollowUp.sync();
      console.log('[FollowUpScheduler] 随访基础表检查完成');
    })().catch((error) => {
      ensureInfrastructurePromise = null;
      throw error;
    });
  }

  return ensureInfrastructurePromise;
}

async function runFollowUpReminderJob() {
  await ensureFollowUpInfrastructure();

  const todayStr = formatDateOnly(new Date());
  const result = {
    scanned: 0,
    reminded: 0,
    skipped: 0,
    markedOverdue: 0,
  };

  const followUps = await FollowUp.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'overdue'],
      },
      planned_date: {
        [Op.lte]: todayStr,
      },
    },
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'name', 'patient_id'],
      },
    ],
    order: [['planned_date', 'ASC']],
  });

  result.scanned = followUps.length;

  for (const followUp of followUps) {
    const receiverId = followUp.assigned_doctor_id || followUp.created_by;
    if (!receiverId) {
      result.skipped += 1;
      continue;
    }

    const lastRemindedDate = followUp.last_reminded_at
      ? formatDateOnly(new Date(followUp.last_reminded_at))
      : null;
    if (lastRemindedDate === todayStr) {
      result.skipped += 1;
      continue;
    }

    if (followUp.planned_date < todayStr && followUp.status === 'pending') {
      await followUp.update({ status: 'overdue' });
      result.markedOverdue += 1;
    }

    const patientName = followUp.patient?.name || '未知患者';
    const reminderPayload = buildReminderPayload(followUp, patientName, todayStr);

    await createFollowUpNotification({
      userId: receiverId,
      followUp,
      patientName,
      reminderPayload,
      updateReminderAt: true,
    });
    result.reminded += 1;
  }

  return result;
}

function startFollowUpScheduler() {
  if (process.env.FOLLOWUP_REMINDER_ENABLED === 'false') {
    console.log('⏸️ 随访提醒定时任务已禁用（FOLLOWUP_REMINDER_ENABLED=false）');
    return null;
  }

  if (scheduledTask) {
    return scheduledTask;
  }

  const cronExpression = process.env.FOLLOWUP_REMINDER_CRON || '0 9 * * *';
  const timezone = process.env.FOLLOWUP_REMINDER_TIMEZONE || 'Asia/Shanghai';

  scheduledTask = cron.schedule(
    cronExpression,
    async () => {
      try {
        const summary = await runFollowUpReminderJob();
        console.log(
          `[FollowUpScheduler] 巡检完成: 扫描 ${summary.scanned}, 提醒 ${summary.reminded}, 跳过 ${summary.skipped}, 标记超期 ${summary.markedOverdue}`,
        );
      } catch (error) {
        console.error('[FollowUpScheduler] 巡检失败:', error.message);
      }
    },
    { timezone },
  );

  console.log(`[FollowUpScheduler] 已启动，Cron=${cronExpression}, 时区=${timezone}`);

  // 合规性扫描定时任务（每天凌晨2点执行）
  if (!complianceTask) {
    const complianceCron = process.env.FOLLOWUP_COMPLIANCE_CRON || '0 2 * * *';
    complianceTask = cron.schedule(
      complianceCron,
      async () => {
        try {
          const scanResult = await batchComplianceScan();
          console.log(
            `[FollowUpScheduler] 合规扫描完成: 扫描 ${scanResult.scanned}, 标记超期 ${scanResult.markedOverdue}, 通知 ${scanResult.notified}`,
          );
        } catch (error) {
          console.error('[FollowUpScheduler] 合规扫描失败:', error.message);
        }
      },
      { timezone },
    );
    console.log(`[FollowUpScheduler] 合规扫描已启动，Cron=${complianceCron}, 时区=${timezone}`);
  }

  return scheduledTask;
}

module.exports = {
  createFollowUpNotification,
  ensureFollowUpInfrastructure,
  runFollowUpReminderJob,
  startFollowUpScheduler,
  batchComplianceScan,
};
