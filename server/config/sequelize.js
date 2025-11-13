/* eslint-disable @typescript-eslint/no-require-imports */
const { Sequelize } = require('sequelize');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    timezone: dbConfig.timezone,
    dialectOptions: dbConfig.dialectOptions,
    define: dbConfig.define,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
  }
);

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
