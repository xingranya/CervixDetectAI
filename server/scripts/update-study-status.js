/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateStudyStatus() {
  let connection;
  try {
    console.log('🚀 开始更新病例状态...\n');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cervix_detect_ai',
    });

    console.log('✅ 数据库连接成功!\n');

    // 更新 status 值
    console.log('🔄 更新病例状态值...');
    const [result] = await connection.query(`
      UPDATE studies
      SET status = 'pending'
      WHERE status = 'uploaded'
    `);
    console.log(`✅ 病例状态更新完成! 更新了 ${result.affectedRows} 条记录\n`);

    console.log('🎉 更新完成!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失败:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

// 执行更新
updateStudyStatus();
