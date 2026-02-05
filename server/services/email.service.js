const tencentcloud = require('tencentcloud-sdk-nodejs');
const crypto = require('crypto');
const SESClient = tencentcloud.ses.v20201002.Client;

// 配置客户端
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

// 模板ID映射（移除默认值，强制配置）
const TEMPLATE_IDS = {
  register: process.env.TEMPLATE_ID_REGISTER ? parseInt(process.env.TEMPLATE_ID_REGISTER) : null,
  reset_password: process.env.TEMPLATE_ID_RESET_PASSWORD ? parseInt(process.env.TEMPLATE_ID_RESET_PASSWORD) : null,
};

/**
 * 腾讯云邮件发送服务
 */
class TencentEmailService {
  /**
   * 生成6位数字验证码（使用密码学安全的随机数）
   * @returns {string} 6位验证码
   */
  generateCode() {
    // 使用 crypto.randomBytes 生成密码学安全的随机数
    const randomBytes = crypto.randomBytes(3); // 3字节 = 24位，足够生成0-999999
    const max = 1000000; // 6位数字最大值
    const randomValue = randomBytes.readUIntBE(0, 3);
    const code = 100000 + (randomValue % 900000); // 100000-999999
    return code.toString();
  }

  /**
   * 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 发送验证码邮件
   * @param {string} email 收件人邮箱
   * @param {string} code 6位验证码
   * @param {string} type 验证码类型：register/reset_password
   * @returns {Promise<{success: boolean, bizId?: string, message?: string}>}
   */
  async sendVerifyCode(email, code, type = 'register') {
    try {
      // 验证邮箱格式
      if (!this.validateEmail(email)) {
        return {
          success: false,
          message: '邮箱格式不正确',
        };
      }

      // 获取模板ID
      const templateId = TEMPLATE_IDS[type];
      if (!templateId) {
        return {
          success: false,
          message: '不支持的验证码类型',
        };
      }

      // 构建请求数据
      const params = {
        FromEmailAddress: `CervixDetectAI <${process.env.TENCENT_SES_FROM_EMAIL || 'no-reply@hpvsc.icu'}>`,
        Destination: [email],
        Template: {
          TemplateID: templateId,
          TemplateData: JSON.stringify({ code }),
        },
        Subject: type === 'register' ? '注册邮箱验证码' : '重置密码验证码',
        TriggerType: 1, // 1=触发类（验证码）
      };

      // 发送邮件
      const response = await sesClient.SendEmail(params);

      // 返回结果
      return {
        success: true,
        bizId: response.RequestId,
        message: '验证码发送成功',
      };
    } catch (error) {
      console.error('[TencentEmailService] 发送邮件失败:', error);

      // 处理常见错误
      let errorMessage = '发送失败，请稍后重试';

      if (error.code === 'FailedOperation.InvalidTemplateID') {
        errorMessage = '邮件模板未配置或审核未通过';
      } else if (error.code === 'FailedOperation.FrequencyLimit') {
        errorMessage = '发送过于频繁，请稍后再试';
      } else if (error.code === 'FailedOperation.ExceedSendLimit') {
        errorMessage = '超出今日发送上限';
      } else if (error.code === 'FailedOperation.EmailAddrInBlacklist') {
        errorMessage = '邮箱地址在黑名单中';
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 检查模板配置
   * @returns {boolean} 模板是否已配置
   */
  isTemplateConfigured() {
    return !!(TEMPLATE_IDS.register && TEMPLATE_IDS.reset_password);
  }
}

// 导出单例
module.exports = new TencentEmailService();
