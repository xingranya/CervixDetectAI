/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
// 尝试加载根目录的 .env 文件
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
  }
);

async function fixSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 1. 修复 patients 表 created_by 字段
    console.log('🔧 正在修复 patients.created_by ...');
    try {
      await sequelize.query("ALTER TABLE `patients` DROP FOREIGN KEY `patients_ibfk_1`;");
    } catch {
      console.log('ℹ️ 外键可能不存在,跳过删除');
    }
    await sequelize.query("ALTER TABLE `patients` MODIFY COLUMN `created_by` BIGINT NULL;");
    await sequelize.query("ALTER TABLE `patients` ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;");
    console.log('✅ patients.created_by 修复完成');

    // 2. 修复 studies 表 user_id 字段
    console.log('🔧 正在修复 studies.user_id ...');
    try {
      await sequelize.query("ALTER TABLE `studies` DROP FOREIGN KEY `studies_ibfk_2`;");
    } catch {
       // ignore
    }
    await sequelize.query("ALTER TABLE `studies` MODIFY COLUMN `user_id` BIGINT NULL;");
    console.log('✅ studies.user_id 修复完成');

    // 3. 修复 analysis_tasks 表 user_id 字段
    console.log('🔧 正在修复 analysis_tasks.user_id ...');
    await sequelize.query("ALTER TABLE `analysis_tasks` MODIFY COLUMN `user_id` BIGINT NULL;");
    console.log('✅ analysis_tasks.user_id 修复完成');

    console.log('🎉 数据库结构修复完成！请重启后端服务。');
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

fixSchema();
