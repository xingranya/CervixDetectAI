/**
 * 快速测试邮件发送
 */

require('dotenv').config();
const tencentcloud = require('tencentcloud-sdk-nodejs');

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

const sesClient = new SESClient(clientConfig);

async function testSendEmail() {
  const testEmail = 'feilin095@163.com'; // 你的测试邮箱

  const params = {
    FromEmailAddress: `CervixDetectAI <${process.env.TENCENT_SES_FROM_EMAIL}>`,
    Destination: [testEmail],
    Template: {
      TemplateID: parseInt(process.env.TEMPLATE_ID_REGISTER),
      TemplateData: JSON.stringify({ code: '888888' }),
    },
    Subject: '测试邮件 - 注册验证码',
    TriggerType: 1,
  };

  console.log('发送测试邮件到:', testEmail);
  console.log('模板ID:', params.Template.TemplateID);

  try {
    const response = await sesClient.SendEmail(params);
    console.log('\n✅ 发送成功！');
    console.log('RequestId:', response.RequestId);
    console.log('\n请检查邮箱 ' + testEmail + ' 是否收到验证码邮件');
  } catch (error) {
    console.log('\n❌ 发送失败！');
    console.log('错误代码:', error.code);
    console.log('错误消息:', error.message);

    // 详细分析
    console.log('\n🔍 详细分析：');
    if (error.code === 'FailedOperation.InvalidTemplateID') {
      console.log('❌ 模板ID无效或未审核通过');
      console.log('   当前模板ID:', params.Template.TemplateID);
      console.log('   请登录腾讯云控制台检查模板状态：');
      console.log('   https://console.cloud.tencent.com/ses');
    } else if (error.code === 'FailedOperation.NotAuthenticatedSender') {
      console.log('❌ 发信地址未认证');
      console.log('   发信地址:', process.env.TENCENT_SES_FROM_EMAIL);
      console.log('   请在腾讯云控制台配置发信地址');
    } else if (error.code === 'AuthFailure') {
      console.log('❌ 密钥认证失败');
      console.log('   请检查 SecretId 和 SecretKey 是否正确');
    } else {
      console.log('❌ 其他错误');
      console.log('   完整错误对象:', JSON.stringify(error, null, 2));
    }
  }
}

testSendEmail();
