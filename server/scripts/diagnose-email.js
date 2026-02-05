/**
 * 邮件服务诊断脚本
 * 用于排查邮箱验证码发送问题
 */

require('dotenv').config();
const tencentcloud = require('tencentcloud-sdk-nodejs');

console.log('====================================');
console.log('腾讯云 SES 邮件服务诊断');
console.log('====================================\n');

// 1. 检查环境变量
console.log('1️⃣ 环境变量检查：');
console.log('TENCENT_SECRET_ID:', process.env.TENCENT_SECRET_ID ? '✅ 已配置' : '❌ 未配置');
console.log('TENCENT_SECRET_KEY:', process.env.TENCENT_SECRET_KEY ? '✅ 已配置' : '❌ 未配置');
console.log('TENCENT_SES_REGION:', process.env.TENCENT_SES_REGION || '❌ 未配置');
console.log('TENCENT_SES_FROM_EMAIL:', process.env.TENCENT_SES_FROM_EMAIL || '❌ 未配置');
console.log('TEMPLATE_ID_REGISTER:', process.env.TEMPLATE_ID_REGISTER || '❌ 未配置');
console.log('TEMPLATE_ID_RESET_PASSWORD:', process.env.TEMPLATE_ID_RESET_PASSWORD || '❌ 未配置');
console.log('');

// 2. 验证模板ID
const templateIdRegister = parseInt(process.env.TEMPLATE_ID_REGISTER || '0');
const templateIdReset = parseInt(process.env.TEMPLATE_ID_RESET_PASSWORD || '0');

console.log('2️⃣ 模板ID验证：');
console.log('注册模板ID:', templateIdRegister, templateIdRegister > 0 ? '✅ 已配置' : '❌ 未配置');
console.log('重置密码模板ID:', templateIdReset, templateIdReset > 0 ? '✅ 已配置' : '❌ 未配置');
console.log('');

// 3. 测试腾讯云SDK连接
console.log('3️⃣ 腾讯云SDK连接测试：');

const SESClient = tencentcloud.ses.v20201002.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: process.env.TENCENT_SES_REGION || 'ap-guangzhou',
  profile: {
    httpProfile: {
      endpoint: 'ses.tencentcloudapi.com',
    },
  },
};

console.log('客户端配置：');
console.log('- Region:', clientConfig.region);
console.log('- Endpoint:', clientConfig.profile.httpProfile.endpoint);
console.log('');

try {
  const sesClient = new SESClient(clientConfig);
  console.log('✅ SES客户端创建成功');
  console.log('');

  // 4. 测试发送邮件（如果环境变量都正确）
  if (process.env.TENCENT_SECRET_ID && templateIdRegister > 0) {
    console.log('4️⃣ 发送测试邮件：');
    console.log('⚠️  注意：这会向你的邮箱发送一封测试邮件');

    const testEmail = 'feilin095@163.com'; // 替换为你的测试邮箱

    const params = {
      FromEmailAddress: `CervixDetectAI <${process.env.TENCENT_SES_FROM_EMAIL}>`,
      Destination: [testEmail],
      Template: {
        TemplateID: templateIdRegister,
        TemplateData: JSON.stringify({ code: '123456' }),
      },
      Subject: '测试邮件 - 注册验证码',
      TriggerType: 1,
    };

    console.log('发送参数：');
    console.log('- 发件人:', params.FromEmailAddress);
    console.log('- 收件人:', testEmail);
    console.log('- 模板ID:', params.Template.TemplateID);
    console.log('- 验证码:', '123456');
    console.log('');

    sesClient.SendEmail(params).then((response) => {
      console.log('✅ 测试邮件发送成功！');
      console.log('RequestId:', response.RequestId);
      console.log('');
      console.log('🎉 诊断完成！邮件服务配置正确。');
    }).catch((error) => {
      console.log('❌ 测试邮件发送失败！');
      console.log('错误代码:', error.code);
      console.log('错误消息:', error.message);
      console.log('');

      // 分析错误
      console.log('🔍 错误分析：');
      if (error.code === 'FailedOperation.InvalidTemplateID') {
        console.log('❌ 模板ID无效或未审核通过');
        console.log('   请检查：');
        console.log('   1. 模板ID是否正确');
        console.log('   2. 模板是否已在腾讯云控制台审核通过');
        console.log('   3. 访问：https://console.cloud.tencent.com/ses');
      } else if (error.code === 'AuthFailure') {
        console.log('❌ 认证失败');
        console.log('   请检查：');
        console.log('   1. SecretId 和 SecretKey 是否正确');
        console.log('   2. 密钥是否已激活或有权限访问SES服务');
      } else if (error.code === 'FailedOperation.NotAuthenticatedSender') {
        console.log('❌ 发信地址未认证');
        console.log('   请检查：');
        console.log('   1. 发信地址 no-reply@hpvsc.icu 是否已在腾讯云控制台配置');
        console.log('   2. 域名 hpvsc.icu 是否已验证');
      } else {
        console.log('❌ 未知错误');
        console.log('   错误代码:', error.code);
        console.log('   完整错误:', error);
      }
    });
  } else {
    console.log('4️⃣ 发送测试邮件：');
    console.log('⚠️  环境变量未正确配置，跳过发送测试');
    console.log('');
    console.log('请先配置环境变量：');
    console.log('1. TENCENT_SECRET_ID - 腾讯云SecretId');
    console.log('2. TENCENT_SECRET_KEY - 腾讯云SecretKey');
    console.log('3. TEMPLATE_ID_REGISTER - 注册模板ID');
    console.log('4. TEMPLATE_ID_RESET_PASSWORD - 重置密码模板ID');
  }
} catch (error) {
  console.log('❌ SES客户端创建失败：', error.message);
}

console.log('');
console.log('====================================');
console.log('诊断完成');
console.log('====================================');
