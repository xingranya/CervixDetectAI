/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...\n');

    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!\n');

    // 2. 同步数据库结构
    console.log('🔨 同步数据库结构...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 数据库结构同步完成!\n');

    // 3. 检查是否已存在管理员账号
    console.log('👤 检查管理员账号...');
    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (adminExists) {
      console.log('ℹ️  管理员账号已存在，跳过创建\n');
    } else {
      // 4. 创建默认管理员账号
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

    console.log('🎉 数据库初始化完成!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();
