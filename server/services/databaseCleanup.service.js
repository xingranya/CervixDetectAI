/**
 * 数据库清理服务
 * 定期清理过期数据，防止数据库过大
 */

const { Op } = require('sequelize');
const { EmailCode, SmsCode, AnalysisTask } = require('../models');

/**
 * 清理配置
 */
const CLEANUP_CONFIG = {
  // 验证码保留天数
  codeRetentionDays: parseInt(process.env.CODE_RETENTION_DAYS || '7'),

  // 分析任务保留天数
  taskRetentionDays: parseInt(process.env.TASK_RETENTION_DAYS || '30'),

  // 每次清理的批次大小（防止一次性删除过多数据锁表）
  batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE || '1000'),
};

/**
 * 数据库清理服务
 */
class DatabaseCleanupService {
  /**
   * 清理过期的验证码记录（邮箱 + 短信）
   */
  async cleanupCodes() {
    try {
      const cutoffDate = new Date(Date.now() - CLEANUP_CONFIG.codeRetentionDays * 24 * 60 * 60 * 1000);

      // 清理邮箱验证码
      const emailDeleted = await EmailCode.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
        limit: CLEANUP_CONFIG.batchSize,
      });

      // 清理短信验证码
      const smsDeleted = await SmsCode.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
        limit: CLEANUP_CONFIG.batchSize,
      });

      const totalDeleted = emailDeleted + smsDeleted;

      if (totalDeleted > 0) {
        console.log(`[DatabaseCleanup] 清理验证码记录: 邮箱 ${emailDeleted} 条, 短信 ${smsDeleted} 条`);
      }

      return { emailDeleted, smsDeleted, total: totalDeleted };
    } catch (error) {
      console.error('[DatabaseCleanup] 清理验证码失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理旧的分析任务（仅已完成或失败的）
   */
  async cleanupOldTasks() {
    try {
      const cutoffDate = new Date(Date.now() - CLEANUP_CONFIG.taskRetentionDays * 24 * 60 * 60 * 1000);

      const deleted = await AnalysisTask.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate,
          },
          status: ['completed', 'failed'], // 仅清理已完成或失败的任务
        },
        limit: CLEANUP_CONFIG.batchSize,
      });

      if (deleted > 0) {
        console.log(`[DatabaseCleanup] 清理旧分析任务: ${deleted} 条`);
      }

      return { deleted };
    } catch (error) {
      console.error('[DatabaseCleanup] 清理分析任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库表大小信息（MySQL）
   */
  async getTableSizes() {
    try {
      const { sequelize } = require('../config/sequelize');

      const [results] = await sequelize.query(`
        SELECT
          TABLE_NAME as table_name,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb,
          TABLE_ROWS as table_rows
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('email_codes', 'sms_codes', 'analysis_tasks', 'users', 'patients', 'studies')
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      `);

      return results;
    } catch (error) {
      console.error('[DatabaseCleanup] 获取表大小失败:', error.message);
      return [];
    }
  }

  /**
   * 执行完整的数据库清理
   */
  async performCleanup() {
    console.log('[DatabaseCleanup] 开始数据库清理...');
    const startTime = Date.now();

    try {
      // 1. 清理验证码
      const codesResult = await this.cleanupCodes();

      // 2. 清理旧任务
      const tasksResult = await this.cleanupOldTasks();

      // 3. 获取表大小信息
      const tableSizes = await this.getTableSizes();

      const duration = Date.now() - startTime;

      const summary = {
        codes: codesResult,
        tasks: tasksResult,
        tableSizes,
        duration,
        timestamp: new Date().toISOString(),
      };

      console.log(`[DatabaseCleanup] 清理完成，耗时 ${duration}ms`);
      console.log(`[DatabaseCleanup] 总计清理: ${codesResult.total + tasksResult.deleted} 条记录`);

      return summary;
    } catch (error) {
      console.error('[DatabaseCleanup] 清理过程出错:', error.message);
      throw error;
    }
  }

  /**
   * 生成清理报告
   */
  generateReport(summary) {
    const lines = [
      '=== 数据库清理报告 ===',
      `时间: ${summary.timestamp}`,
      `耗时: ${summary.duration}ms`,
      '',
      '清理统计:',
      `- 邮箱验证码: ${summary.codes.emailDeleted} 条`,
      `- 短信验证码: ${summary.codes.smsDeleted} 条`,
      `- 分析任务: ${summary.tasks.deleted} 条`,
      '',
      '数据库表大小:',
    ];

    summary.tableSizes.forEach((table) => {
      lines.push(`- ${table.table_name}: ${table.size_mb} MB (${table.table_rows} 行)`);
    });

    lines.push('====================');

    return lines.join('\n');
  }
}

module.exports = new DatabaseCleanupService();
