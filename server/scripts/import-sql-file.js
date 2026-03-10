/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('../config/loadEnv');

function printUsage() {
  console.log('用法: node scripts/import-sql-file.js <sql文件路径>');
  console.log('示例: node scripts/import-sql-file.js ./backup/cervix_detect_ai.sql');
}

function resolveSqlFilePath(rawFilePath) {
  if (!rawFilePath || typeof rawFilePath !== 'string') {
    return null;
  }

  return path.isAbsolute(rawFilePath)
    ? path.normalize(rawFilePath)
    : path.resolve(process.cwd(), rawFilePath);
}

async function main() {
  const rawFilePath = process.argv[2];

  if (!rawFilePath) {
    console.error('❌ 缺少 SQL 文件路径');
    printUsage();
    process.exitCode = 1;
    return;
  }

  const sqlFilePath = resolveSqlFilePath(rawFilePath);

  if (!sqlFilePath || !fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL 文件不存在: ${sqlFilePath || rawFilePath}`);
    process.exitCode = 1;
    return;
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8').replace(/^\uFEFF/, '').trim();

  if (!sqlContent) {
    console.error('❌ SQL 文件内容为空，已停止导入');
    process.exitCode = 1;
    return;
  }

  const database = process.env.DB_NAME;
  if (!database) {
    console.error('❌ 未读取到 DB_NAME，无法确定目标数据库');
    process.exitCode = 1;
    return;
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    const sqlFileStat = fs.statSync(sqlFilePath);

    console.log(`📄 准备导入 SQL 文件: ${sqlFilePath}`);
    console.log(`🗄️ 目标数据库: ${database}`);
    console.log(`📦 文件大小: ${(sqlFileStat.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('⚠️ 当前 SQL 文件包含 DROP TABLE / CREATE TABLE / INSERT INTO 时，将直接修改现有数据');
    console.log('🔄 开始执行 SQL 文件，请勿中途中断...');

    await connection.query(sqlContent);

    console.log('✅ SQL 文件执行完成');
  } catch (error) {
    console.error('❌ SQL 文件执行失败:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('❌ 导入脚本异常退出:', error.message);
  process.exitCode = 1;
});
