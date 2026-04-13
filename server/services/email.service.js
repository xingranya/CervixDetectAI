/* eslint-disable @typescript-eslint/no-require-imports */
const tencentcloud = require('tencentcloud-sdk-nodejs');
const crypto = require('crypto');
const { validateEmail } = require('../utils/validators');
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

function parseTemplateId(value) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// 模板ID映射（移除默认值，强制配置）
const TEMPLATE_IDS = {
  register: parseTemplateId(process.env.TEMPLATE_ID_REGISTER),
  reset_password: parseTemplateId(process.env.TEMPLATE_ID_RESET_PASSWORD),
  change_email: parseTemplateId(process.env.TEMPLATE_ID_CHANGE_EMAIL),
  register_success: parseTemplateId(process.env.TEMPLATE_ID_REGISTER_SUCCESS),
  report_ready: parseTemplateId(process.env.TEMPLATE_ID_REPORT_READY),
};

const DEFAULT_SUBJECTS = {
  register: '注册邮箱验证码',
  reset_password: '重置密码验证码',
  change_email: '更换邮箱验证码',
  register_success: '欢迎加入 CervixDetectAI',
  report_ready: '报告生成完成提醒',
};

const VERIFY_CODE_TYPES = new Set(['register', 'reset_password', 'change_email']);

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
    return validateEmail(email);
  }

  /**
   * 发送模板邮件
   * @param {string} email 收件人邮箱
   * @param {string} templateType 模板类型
   * @param {Record<string, unknown>} templateData 模板数据
   * @param {{ subject?: string, triggerType?: number }} options 发送选项
   * @returns {Promise<{success: boolean, bizId?: string, message?: string}>}
   */
  async sendTemplateEmail(email, templateType, templateData = {}, options = {}) {
    try {
      // 验证邮箱格式
      if (!this.validateEmail(email)) {
        return {
          success: false,
          message: '邮箱格式不正确',
        };
      }

      // 获取模板ID
      const templateId = TEMPLATE_IDS[templateType];
      if (!templateId) {
        return {
          success: false,
          message: `邮件模板未配置：${templateType}`,
        };
      }

      // 构建请求数据
      const params = {
        FromEmailAddress: `CervixDetectAI <${process.env.TENCENT_SES_FROM_EMAIL || 'no-reply@hpvsc.icu'}>`,
        Destination: [email],
        Template: {
          TemplateID: templateId,
          TemplateData: JSON.stringify(templateData || {}),
        },
        Subject: options.subject || DEFAULT_SUBJECTS[templateType] || '系统通知',
        TriggerType: options.triggerType ?? 1,
      };

      // 发送邮件
      const response = await sesClient.SendEmail(params);

      // 返回结果
      return {
        success: true,
        bizId: response.RequestId,
        message: '邮件发送成功',
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
   * 发送验证码邮件
   * @param {string} email 收件人邮箱
   * @param {string} code 6位验证码
   * @param {string} type 验证码类型：register/reset_password/change_email
   * @returns {Promise<{success: boolean, bizId?: string, message?: string}>}
   */
  async sendVerifyCode(email, code, type = 'register') {
    if (!VERIFY_CODE_TYPES.has(type)) {
      return {
        success: false,
        message: '不支持的验证码类型',
      };
    }

    return this.sendTemplateEmail(email, type, { code }, { subject: DEFAULT_SUBJECTS[type] });
  }

  /**
   * 发送注册成功欢迎邮件
   * @param {string} email 收件人邮箱
   * @param {{ username?: string }} payload 模板参数
   * @returns {Promise<{success: boolean, bizId?: string, message?: string}>}
   */
  async sendRegisterSuccessEmail(email, payload = {}) {
    return this.sendTemplateEmail(
      email,
      'register_success',
      {
        username: payload.username || '用户',
      },
      {
        subject: DEFAULT_SUBJECTS.register_success,
      },
    );
  }

  /**
   * 发送报告生成完成通知邮件
   * @param {string} email 收件人邮箱
   * @param {{ studyId?: string, diagnosis?: string, riskLevel?: string, completedAt?: string }} payload 模板参数
   * @returns {Promise<{success: boolean, bizId?: string, message?: string}>}
   */
  async sendReportReadyEmail(email, payload = {}) {
    return this.sendTemplateEmail(
      email,
      'report_ready',
      {
        study_id: payload.studyId || '-',
        diagnosis: payload.diagnosis || '-',
        risk_level: payload.riskLevel || '-',
        completed_at: payload.completedAt || new Date().toLocaleString('zh-CN'),
      },
      {
        subject: DEFAULT_SUBJECTS.report_ready,
      },
    );
  }

  /**
   * 检查模板配置
   * @returns {boolean} 模板是否已配置
   */
  isTemplateConfigured() {
    return !!(TEMPLATE_IDS.register && TEMPLATE_IDS.reset_password && TEMPLATE_IDS.change_email);
  }
}

// 导出单例
module.exports = new TencentEmailService();
