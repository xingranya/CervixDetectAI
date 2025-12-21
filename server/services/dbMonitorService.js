/* eslint-disable @typescript-eslint/no-require-imports */
const { sequelize } = require('../config/sequelize');

class DbMonitorService {
  constructor() {
    this.metrics = {
      queryTimes: [], // Circular buffer for recent query times
      slowQueries: [],
      totalQueries: 0,
      errors: 0,
      startTime: Date.now(),
    };
    this.maxBufferSize = 1000;
    this.slowQueryThreshold = 100; // ms
  }

  /**
   * 记录查询性能
   * @param {string} sql - SQL语句
   * @param {number} duration - 执行时间(ms)
   * @param {boolean} isError - 是否出错
   */
  recordQuery(sql, duration, isError = false) {
    this.metrics.totalQueries++;
    if (isError) this.metrics.errors++;

    // 记录查询时间
    this.metrics.queryTimes.push({
      timestamp: Date.now(),
      duration,
    });

    // 维护缓冲区大小
    if (this.metrics.queryTimes.length > this.maxBufferSize) {
      this.metrics.queryTimes.shift();
    }

    // 记录慢查询
    if (duration > this.slowQueryThreshold) {
      this.metrics.slowQueries.push({
        sql: sql.substring(0, 200), // 截断过长的SQL
        duration,
        timestamp: Date.now(),
      });

      // 限制慢查询记录数
      if (this.metrics.slowQueries.length > 50) {
        this.metrics.slowQueries.shift();
      }
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics() {
    const now = Date.now();
    const uptime = (now - this.metrics.startTime) / 1000; // seconds

    // 计算平均响应时间
    const recentQueries = this.metrics.queryTimes;
    const avgResponseTime =
      recentQueries.length > 0
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
        : 0;

    // 计算QPS
    const qps = this.metrics.totalQueries / (uptime || 1);

    // 获取连接池状态
    // 注意：sequelize.connectionManager.pool 是 generic-pool 的实例
    const pool = sequelize.connectionManager.pool;
    const poolStats = {
      size: pool.size,
      available: pool.available,
      borrowed: pool.borrowed,
      pending: pool.pending,
    };

    // 计算健康评分 (0-100)
    let healthScore = 100;
    if (avgResponseTime > 200) healthScore -= 20;
    if (avgResponseTime > 500) healthScore -= 30;
    if (this.metrics.errors / this.metrics.totalQueries > 0.01) healthScore -= 20;
    if (poolStats.pending > 5) healthScore -= 10;

    return {
      uptime,
      totalQueries: this.metrics.totalQueries,
      qps: parseFloat(qps.toFixed(2)),
      avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      errorRate: parseFloat(
        ((this.metrics.errors / (this.metrics.totalQueries || 1)) * 100).toFixed(2),
      ),
      poolStats,
      slowQueries: this.metrics.slowQueries.reverse().slice(0, 10), // 最近10条慢查询
      healthScore: Math.max(0, healthScore),
      queryTimeHistory: this.aggregateQueryHistory(),
    };
  }

  /**
   * 聚合查询历史用于图表展示 (最近1小时，每分钟平均值)
   */
  aggregateQueryHistory() {
    // 简单实现：返回最近的原始数据点，前端可以降采样
    // 实际生产中应该使用时序数据库或定期聚合
    return this.metrics.queryTimes.slice(-50).map((q) => ({
      time: new Date(q.timestamp).toLocaleTimeString(),
      duration: q.duration,
    }));
  }
}

module.exports = new DbMonitorService();
