/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 统一错误处理工具
 * 提供 ApiError 类和统一的路由错误处理函数
 */

class ApiError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {string} code - 错误代码（用于前端判断）
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * 统一路由错误处理
 * @param {object} res - Express response 对象
 * @param {Error} error - 捕获的错误
 * @param {object} context - 上下文信息 { service, endpoint }
 */
function handleRouteError(res, error, context = {}) {
  const { service = 'API', endpoint = '' } = context;

  // Sequelize 唯一约束冲突
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors?.[0]?.path || '字段';
    console.error(`[${service}] ${endpoint} 唯一约束冲突:`, { field, message: error.message });
    return res.status(409).json({
      success: false,
      message: `${field} 已存在`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Sequelize 数据验证错误
  if (error.name === 'SequelizeValidationError') {
    const details = error.errors?.map((e) => e.message).join('; ') || error.message;
    console.error(`[${service}] ${endpoint} 数据验证失败:`, { details });
    return res.status(400).json({
      success: false,
      message: details,
      code: 'VALIDATION_ERROR',
    });
  }

  // Sequelize 外键约束错误
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    console.error(`[${service}] ${endpoint} 外键约束错误:`, { message: error.message });
    return res.status(400).json({
      success: false,
      message: '关联数据不存在或无法删除',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // 自定义 ApiError
  if (error instanceof ApiError) {
    console.error(`[${service}] ${endpoint} 业务错误:`, {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    });
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  // 通用错误
  console.error(`[${service}] ${endpoint} 服务器错误:`, error);

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    ...(isDev && { error: error.message }),
  });
}

module.exports = { ApiError, handleRouteError };
