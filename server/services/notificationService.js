/* eslint-disable @typescript-eslint/no-require-imports */
const { Notification } = require('../models');

/**
 * 将风险等级转换为中文标签
 * @param {string | undefined} riskLevel 风险等级
 * @returns {string}
 */
function getRiskLevelLabel(riskLevel) {
  if (riskLevel === 'critical') return '极高风险';
  if (riskLevel === 'high') return '高风险';
  if (riskLevel === 'medium') return '中风险';
  if (riskLevel === 'low') return '低风险';
  return '未评估';
}

/**
 * 格式化置信度
 * @param {unknown} value 置信度值
 * @returns {string}
 */
function formatConfidence(value) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return '未知';

  const normalized = num > 1 && num <= 100 ? num / 100 : num;
  if (normalized < 0 || normalized > 1) return '未知';

  return `${Math.round(normalized * 100)}%`;
}

/**
 * 幂等创建通知（同一未读通知存在时不重复创建）
 * @param {object} payload 通知参数
 * @returns {Promise<import('../models/Notification') | null>}
 */
async function createNotificationOnce(payload) {
  const {
    user_id,
    type,
    title,
    content,
    related_type = 'study',
    related_id = null,
  } = payload || {};

  if (!user_id || !title || !content || !type) {
    return null;
  }

  const existed = await Notification.findOne({
    where: {
      user_id,
      type,
      title,
      related_type,
      related_id,
      is_read: false,
    },
  });

  if (existed) {
    return existed;
  }

  return Notification.create({
    user_id,
    type,
    title,
    content,
    related_type,
    related_id,
    is_read: false,
  });
}

/**
 * 为分析完成创建站内通知
 * - 总是创建“分析完成”
 * - high/critical 额外创建“高风险预警”
 * @param {object} params 参数
 * @returns {Promise<void>}
 */
async function createAnalysisNotifications(params) {
  const { userId, studyId, studyCode, diagnosis, riskLevel, confidence } = params || {};
  if (!userId || !studyId) return;

  const studyText = studyCode ? `【${studyCode}】` : `#${studyId}`;
  const diagnosisText = diagnosis || '未提供';
  const confidenceText = formatConfidence(confidence);
  const riskLabel = getRiskLevelLabel(riskLevel);

  await createNotificationOnce({
    user_id: userId,
    type: 'system',
    title: '报告分析完成',
    content: `病例${studyText}分析已完成，诊断：${diagnosisText}，置信度：${confidenceText}。`,
    related_type: 'study',
    related_id: studyId,
  });

  if (riskLevel === 'high' || riskLevel === 'critical') {
    await createNotificationOnce({
      user_id: userId,
      type: 'followup_high_attention',
      title: '高风险病变预警',
      content: `病例${studyText}评估为${riskLabel}，诊断：${diagnosisText}，请优先复核并处理。`,
      related_type: 'study',
      related_id: studyId,
    });
  }
}

module.exports = {
  createAnalysisNotifications,
};

