/* eslint-disable @typescript-eslint/no-require-imports */
const { Sequelize } = require('sequelize');
const config = require('./database');
// 延迟导入 dbMonitorService 以避免循环依赖
let dbMonitorService;

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 自定义日志函数
const customLogger = (sql, timing) => {
  if (!dbMonitorService) {
    try {
      dbMonitorService = require('../services/dbMonitorService');
    } catch {
      // 忽略初始化时的错误
    }
  }

  if (dbMonitorService && typeof timing === 'number') {
    dbMonitorService.recordQuery(sql, timing);
  }

  // 仅在开发环境或出错时打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Sequelize] ${sql} (${timing}ms)`);
  }
};

// 创建Sequelize实例
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  timezone: dbConfig.timezone,
  dialectOptions: dbConfig.dialectOptions,
  define: dbConfig.define,
  pool: dbConfig.pool,
  logging: customLogger,
  benchmark: true, // 启用基准测试以获取精确时间
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库（开发环境）
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ 数据库同步完成!');
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
};
