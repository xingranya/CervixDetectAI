/* eslint-disable @typescript-eslint/no-require-imports */
const { AuditLog } = require('../models');

/**
 * 记录审计日志
 * @param {object} params
 * @param {number|null} params.userId - 操作用户ID
 * @param {string} params.action - 操作类型
 * @param {string} params.resourceType - 资源类型
 * @param {number|null} params.resourceId - 资源ID
 * @param {object|null} params.details - 操作详情
 * @param {object} params.req - Express请求对象（用于提取IP和UA）
 */
async function logAudit({
  userId,
  action,
  resourceType,
  resourceId = null,
  details = null,
  req = null,
}) {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: req?.ip || null,
      user_agent: req?.get('user-agent') || null,
    });
  } catch (error) {
    // 审计日志写入失败不应影响业务流程，仅记录错误
    console.error('[AuditLog] 写入审计日志失败:', error.message);
  }
}

module.exports = { logAudit };
