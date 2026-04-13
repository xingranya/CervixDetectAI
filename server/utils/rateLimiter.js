/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 验证码发送频率限制工具
 * 统一管理邮箱/短信验证码的发送间隔与每日上限检查
 */
const { Op } = require('sequelize');

/**
 * 检查发送间隔限制
 * @param {import('sequelize').Model} model - Sequelize模型 (EmailCode/SmsCode)
 * @param {string} field - 查询字段名 ('email'/'phone')
 * @param {string} value - 字段值
 * @param {number} intervalSeconds - 间隔秒数
 * @param {object} [extraWhere] - 额外的查询条件（如 type 过滤）
 * @returns {Promise<{allowed: boolean, remainingSeconds?: number}>}
 */
async function checkSendInterval(model, field, value, intervalSeconds, extraWhere = {}) {
  const cutoff = new Date(Date.now() - intervalSeconds * 1000);
  const recentCode = await model.findOne({
    where: {
      [field]: value,
      created_at: { [Op.gte]: cutoff },
      ...extraWhere,
    },
    order: [['created_at', 'DESC']],
  });

  if (!recentCode) {
    return { allowed: true };
  }

  const remainingSeconds = Math.ceil(
    (new Date(recentCode.created_at).getTime() + intervalSeconds * 1000 - Date.now()) / 1000,
  );

  return { allowed: false, remainingSeconds: Math.max(remainingSeconds, 1) };
}

/**
 * 检查每日发送上限
 * @param {import('sequelize').Model} model - Sequelize模型
 * @param {string} field - 查询字段名
 * @param {string} value - 字段值
 * @param {number} maxCount - 每日最大次数
 * @param {object} [extraWhere] - 额外的查询条件
 * @returns {Promise<{allowed: boolean, todayCount?: number}>}
 */
async function checkDailyLimit(model, field, value, maxCount, extraWhere = {}) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await model.count({
    where: {
      [field]: value,
      created_at: { [Op.gte]: todayStart },
      ...extraWhere,
    },
  });

  if (todayCount >= maxCount) {
    return { allowed: false, todayCount };
  }

  return { allowed: true, todayCount };
}

module.exports = { checkSendInterval, checkDailyLimit };
