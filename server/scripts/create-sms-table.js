/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 创建短信验证码表
 * 用于存储短信验证码记录
 */
require('dotenv').config();
const SmsCode = require('../models/SmsCode');

async function createSmsCodeTable() {
  try {
    console.log('📋 开始创建短信验证码表...');

    // 同步SmsCode模型（创建表）
    await SmsCode.sync({ force: false });

    console.log('✅ 短信验证码表创建成功！');
    console.log('表名: sms_codes');
    console.log('字段:');
    console.log('  - id: 主键');
    console.log('  - phone: 手机号');
    console.log('  - code: 验证码');
    console.log('  - biz_id: 阿里云短信业务ID');
    console.log('  - type: 验证码类型(login/register/reset_password)');
    console.log('  - status: 状态(pending/used/expired)');
    console.log('  - expires_at: 过期时间');
    console.log('  - ip_address: 请求IP地址');
    console.log('  - created_at: 创建时间');
    console.log('  - updated_at: 更新时间');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建短信验证码表失败:', error);
    process.exit(1);
  }
}

createSmsCodeTable();
