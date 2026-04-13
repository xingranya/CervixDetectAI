/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 请求日志中间件
 * 记录每个请求的方法、路径、状态码、耗时和用户信息
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || '-',
      ip: req.ip,
    };

    // 慢请求（>3秒）用 warn 级别
    if (duration > 3000) {
      console.warn(`[Request] 慢请求 ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
    } else if (res.statusCode >= 400) {
      console.error(`[Request] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
    }
    // 正常请求不打日志，减少输出量（只记录异常）
  });

  next();
}

module.exports = requestLogger;
