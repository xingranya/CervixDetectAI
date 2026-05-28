/* eslint-disable @typescript-eslint/no-require-imports */
const jwt = require('jsonwebtoken');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * 生成访问令牌
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: 'admin',
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION,
  });
}

/**
 * 生成刷新令牌
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });
}

/**
 * 验证令牌
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * 从请求头中提取令牌
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractToken,
  JWT_SECRET,
};
