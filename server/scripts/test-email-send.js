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
  const scene = process.env.TEST_EMAIL_SCENE || 'register';
  const templateIdMap = {
    register: parseInt(process.env.TEMPLATE_ID_REGISTER || '0'),
    reset_password: parseInt(process.env.TEMPLATE_ID_RESET_PASSWORD || '0'),
    change_email: parseInt(process.env.TEMPLATE_ID_CHANGE_EMAIL || '0'),
    report_ready: parseInt(process.env.TEMPLATE_ID_REPORT_READY || '0'),
    register_success: parseInt(process.env.TEMPLATE_ID_REGISTER_SUCCESS || '0'),
  };

  const templateDataMap = {
    register: { code: '888888' },
    reset_password: { code: '888888' },
    change_email: { code: '888888' },
    report_ready: {
      study_id: 'study_demo_001',
      diagnosis: 'NILM',
      risk_level: 'low',
      completed_at: new Date().toLocaleString('zh-CN'),
    },
    register_success: { username: '测试用户' },
  };

  const subjectMap = {
    register: '测试邮件 - 注册验证码',
    reset_password: '测试邮件 - 重置密码验证码',
    change_email: '测试邮件 - 更换邮箱验证码',
    report_ready: '测试邮件 - 报告生成完成',
    register_success: '测试邮件 - 注册成功欢迎',
  };

  const templateId = templateIdMap[scene];
  if (!templateId) {
    console.log(`\n❌ 测试场景 ${scene} 未配置有效模板ID，请检查环境变量`);
    return;
  }

  const params = {
    FromEmailAddress: `CervixDetectAI <${process.env.TENCENT_SES_FROM_EMAIL}>`,
    Destination: [testEmail],
    Template: {
      TemplateID: templateId,
      TemplateData: JSON.stringify(templateDataMap[scene] || { code: '888888' }),
    },
    Subject: subjectMap[scene] || '测试邮件',
    TriggerType: 1,
  };

  console.log('发送测试邮件到:', testEmail);
  console.log('测试场景:', scene);
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
