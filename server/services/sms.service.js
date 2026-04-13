/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 阿里云短信服务工具类
 * 封装阿里云短信API调用
 */

const crypto = require('crypto');
const Dypnsapi20170525 = require('@alicloud/dypnsapi20170525');
const OpenApi = require('@alicloud/openapi-client');

class AliyunSmsService {
  constructor() {
    this.client = null;
  }

  /**
   * 创建阿里云短信客户端
   * @returns {Dypnsapi20170525}
   */
  createClient() {
    if (this.client) {
      return this.client;
    }

    // 使用环境变量中的AccessKey凭据配置
    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dypnsapi.aliyuncs.com',
    });

    this.client = new Dypnsapi20170525.default(config);
    return this.client;
  }

  /**
   * 生成6位数字验证码
   * @returns {string}
   */
  generateCode() {
    const randomBytes = crypto.randomBytes(3);
    const randomValue = randomBytes.readUIntBE(0, 3);
    const code = 100000 + (randomValue % 900000);
    return code.toString();
  }

  /**
   * 发送短信验证码（自己生成验证码）
   * @param {string} phoneNumber - 手机号
   * @param {number} expireMinutes - 过期时间（分钟）
   * @returns {Promise<{success: boolean, code?: string, bizId?: string, message?: string, error?: string}>}
   */
  async sendVerifyCode(phoneNumber, expireMinutes = 5) {
    try {
      const client = this.createClient();

      // 自己生成验证码
      const verifyCode = this.generateCode();

      // 构建请求参数 - 使用实际验证码而不是占位符
      const request = new Dypnsapi20170525.SendSmsVerifyCodeRequest({
        signName: process.env.ALIYUN_SMS_SIGN_NAME || '速通互联验证码',
        templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '100001', // 注意：只需要模板CODE，不需要SMS_前缀
        phoneNumber: phoneNumber,
        templateParam: JSON.stringify({
          code: verifyCode, // 使用我们生成的验证码
          min: expireMinutes.toString(),
        }),
      });

      // 发送短信
      const response = await client.sendSmsVerifyCode(request);

      // 打印完整响应以调试
      console.log('📱 [阿里云短信] 完整响应:', JSON.stringify(response, null, 2));

      // 解析响应 - 响应结构: { statusCode, body: { code, message, model: {...}, success } }
      const body = response.body || response;
      const code = body.code || body.Code;
      const success = body.success !== undefined ? body.success : body.Success;
      const message = body.message || body.Message;
      const model = body.model || body.Model;

      console.log('📱 [阿里云短信] 解析结果:', {
        phone: phoneNumber,
        code: code,
        success: success,
        message: message,
        verifyCode: verifyCode, // 我们自己生成的验证码
        bizId: model?.bizId || model?.BizId,
      });

      if (success && code === 'OK') {
        return {
          success: true,
          code: verifyCode, // 返回我们生成的验证码
          bizId: model?.bizId || model?.BizId,
          message: message || '发送成功',
        };
      } else {
        return {
          success: false,
          error: message || '发送失败',
        };
      }
    } catch (error) {
      console.error('❌ [阿里云短信] 发送失败:', error);
      console.error('❌ [阿里云短信] 错误详情:', error.message);
      if (error.data) {
        console.error('❌ [阿里云短信] 错误数据:', JSON.stringify(error.data, null, 2));
      }
      return {
        success: false,
        error: error.message || '短信发送异常',
      };
    }
  }

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   * @returns {boolean}
   */
  validatePhoneNumber(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}

// 导出单例
module.exports = new AliyunSmsService();
