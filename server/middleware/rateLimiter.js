/* eslint-disable @typescript-eslint/no-require-imports */
const rateLimit = require('express-rate-limit');

/**
 * 认证接口限流（登录/注册）
 * 15分钟内最多30次请求
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: '请求过于频繁，请15分钟后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 验证码发送限流
 * 1分钟内最多5次请求
 */
const codeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: '验证码发送过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 通用API限流
 * 1分钟内最多100次请求
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, codeLimiter, apiLimiter };
