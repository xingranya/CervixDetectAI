/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 公共验证工具函数
 * 统一管理邮箱、手机号、身份证等格式校验
 */

/** 邮箱正则（与 email.service.js / sms-auth.js / users.js 保持一致） */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 中国大陆手机号正则（与 sms.service.js 保持一致） */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 身份证号正则（18位，最后一位可为X） */
const ID_CARD_REGEX = /^\d{17}[\dXx]$/;

/**
 * 邮箱格式验证
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * 手机号格式验证
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
  return PHONE_REGEX.test(phone);
}

/**
 * 身份证号验证
 * @param {string} idCard 身份证号
 * @returns {boolean} 是否有效
 */
function validateIdCard(idCard) {
  return ID_CARD_REGEX.test(idCard);
}

/**
 * 通用必填字段验证
 * @param {*} value 字段值
 * @param {string} fieldName 字段名称（用于错误提示）
 * @returns {{ valid: boolean, message?: string }}
 */
function validateRequired(value, fieldName) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true };
}

module.exports = {
  validateEmail,
  validatePhone,
  validateIdCard,
  validateRequired,
};
