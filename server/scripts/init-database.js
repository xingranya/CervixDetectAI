/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    console.log('\n🚀 开始初始化数据库...\n');

    // 1. 首先连接到MySQL服务器（不指定数据库）来创建数据库
    console.log('📡 连接到MySQL服务器...');
    const mysqlConnection = new Sequelize(
      null, // 不指定数据库
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      },
    );

    await mysqlConnection.authenticate();
    console.log('✅ MySQL服务器连接成功!\n');

    // 2. 创建数据库（如果不存在）
    console.log('🔨 创建数据库（如果不存在）...');
    const dbName = process.env.DB_NAME || 'cervix_detect_ai';
    try {
      await mysqlConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      console.log('✅ 数据库创建或已存在!\n');
    } catch (error) {
      console.error('❌ 创建数据库失败:', error.message);
      throw error;
    } finally {
      await mysqlConnection.close();
    }

    // 3. 现在连接到具体的数据库
    console.log('📡 连接到数据库...');
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!\n');

    // 2. 同步数据库结构（这会自动创建所有表）
    console.log('🔨 同步数据库结构（创建所有表）...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 数据库结构同步完成!\n');

    // 3. 添加 user_avatars 表缺失的字段（如果需要）
    console.log('🔧 检查并更新 user_avatars 表结构...');

    // 检查并添加 large_url 字段
    try {
      await sequelize.query(`
        ALTER TABLE user_avatars
        ADD COLUMN large_url VARCHAR(500) NULL AFTER thumbnail_url;
      `);
      console.log('✅ large_url 字段添加成功');
    } catch (error) {
      if (error.original && error.original.errno === 1060) {
        console.log('ℹ️  large_url 字段已存在，跳过');
      } else if (error.original && error.original.errno !== 1146) {
        // 忽略表不存在的错误（1146）
        console.warn('⚠️  添加 large_url 字段时出现警告:', error.message);
      }
    }

    // 检查并添加 small_url 字段
    try {
      await sequelize.query(`
        ALTER TABLE user_avatars
        ADD COLUMN small_url VARCHAR(500) NULL AFTER large_url;
      `);
      console.log('✅ small_url 字段添加成功');
    } catch (error) {
      if (error.original && error.original.errno === 1060) {
        console.log('ℹ️  small_url 字段已存在，跳过');
      } else if (error.original && error.original.errno !== 1146) {
        console.warn('⚠️  添加 small_url 字段时出现警告:', error.message);
      }
    }
    console.log('\n');

    // 4. 数据修复：更新旧的病例状态值
    console.log('🔄 检查并修复病例状态值...');
    try {
      const [result] = await sequelize.query(`
        UPDATE studies
        SET status = 'pending'
        WHERE status = 'uploaded'
      `);
      if (result.affectedRows > 0) {
        console.log(`✅ 病例状态修复完成! 更新了 ${result.affectedRows} 条记录`);
      } else {
        console.log('ℹ️  无需修复病例状态');
      }
    } catch (error) {
      // 如果表不存在，跳过
      if (error.original && error.original.errno === 1146) {
        console.log('ℹ️  studies 表尚未创建，跳过状态修复');
      } else {
        console.warn('⚠️  修复病例状态时出现警告:', error.message);
      }
    }
    console.log('\n');

    // 5. 导入模型（在数据库连接之后）
    const { User } = require('../models');

    // 6. 检查是否已存在管理员账号
    console.log('👤 检查管理员账号...');
    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (adminExists) {
      console.log('ℹ️  管理员账号已存在，跳过创建\n');
    } else {
      // 6. 创建默认管理员账号
      console.log('➕ 创建默认管理员账号...');
      const adminPassword = 'admin123456'; // 默认密码，生产环境请修改
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = await User.create({
        username: 'admin',
        email: 'admin@cervixdetectai.com',
        password_hash: hashedPassword,
        real_name: '系统管理员',
        role: 'admin',
        status: 'active',
      });
      console.log('✅ 管理员账号创建成功! ID:', admin.id);
      console.log('📋 登录信息:');
      console.log('   邮箱: admin@cervixdetectai.com');
      console.log('   密码: admin123456');
      console.log('   ⚠️  请尽快修改默认密码!\n');
    }

    // 7. 显示所有表
    console.log('📊 当前数据库表列表:');
    const [tables] = await sequelize.query('SHOW TABLES');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    console.log('\n🎉 数据库初始化完成!');
    console.log('\n💡 提示:');
    console.log('   - 所有数据表已创建');
    console.log('   - 管理员账号已就绪');
    console.log('   - 可以启动服务器: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();
