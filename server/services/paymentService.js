/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');
const axios = require('axios');
const { Order, User, sequelize } = require('../models');

// 套餐配置
const PLANS = {
  'test': { name: '测试套餐', price: 0.01, credits: 1, type: 'package' },
  'package-10': { name: '10次AI分析包', price: 158.00, credits: 10, type: 'package' },
  'package-30': { name: '30次AI分析包', price: 438.00, credits: 30, type: 'package' },
  'package-50': { name: '50次AI分析包', price: 649.00, credits: 50, type: 'package' },
  'monthly': { name: '月度订阅会员', price: 270.00, credits: 20, days: 30, type: 'subscription' },
  'yearly': { name: '年度订阅会员', price: 2700.00, credits: 300, days: 365, type: 'subscription' },
};

class PaymentService {
  constructor() {
    this.pid = process.env.EPAY_PID;
    this.key = process.env.EPAY_KEY;
    this.apiUrl = process.env.EPAY_API_URL;
    this.notifyUrl = process.env.EPAY_NOTIFY_URL;
    this.returnUrl = process.env.EPAY_RETURN_URL;
  }

  /**
   * 生成签名
   * @param {Object} params 待签名参数
   * @returns {string} 签名
   */
  generateSign(params) {
    const keys = Object.keys(params).sort();
    let signStr = '';

    for (const key of keys) {
      if (key !== 'sign' && key !== 'sign_type' && params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        signStr += `${key}=${params[key]}&`;
      }
    }

    signStr = signStr.slice(0, -1) + this.key;
    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 验证签名
   * @param {Object} params 回调参数
   * @returns {boolean} 是否验证通过
   */
  verifySign(params) {
    if (!params || !params.sign) return false;

    const sign = params.sign;
    const calculatedSign = this.generateSign(params);

    return sign === calculatedSign;
  }

  /**
   * 创建订单
   * @param {number} userId 用户ID
   * @param {string} planType 套餐类型
   * @param {string} paymentMethod 支付方式 (alipay/wxpay/bank)
   * @param {string} baseUrl 动态域名（从请求中获取）
   */
  async createOrder(userId, planType, paymentMethod, baseUrl) {
    const plan = PLANS[planType];
    if (!plan) {
      throw new Error('无效的套餐类型');
    }

    const outTradeNo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 回调URL生成逻辑：
    // 1. 如果 .env 完整配置了 URL，直接使用（单域名部署）
    // 2. 否则动态获取域名 + 可选配置端口（多域名/NAT 环境）
    let notifyUrl, returnUrl, frontendResultUrl;

    if (this.notifyUrl && this.returnUrl) {
      // 完整配置模式
      notifyUrl = this.notifyUrl;
      returnUrl = this.returnUrl;
      frontendResultUrl = process.env.FRONTEND_RESULT_URL || `${baseUrl}/#/payment/result`;
    } else {
      // 动态域名模式：从 baseUrl 提取域名，使用配置的端口
      const externalPort = process.env.EXTERNAL_PORT; // NAT 外网端口
      let callbackBase = baseUrl;

      if (externalPort) {
        // 替换或添加端口号
        const url = new URL(baseUrl);
        url.port = externalPort;
        callbackBase = url.origin;
      }

      notifyUrl = `${callbackBase}/api/payment/notify`;
      returnUrl = `${callbackBase}/api/payment/return`;
      frontendResultUrl = `${callbackBase}/#/payment/result`;
    }

    // 创建本地订单
    const order = await Order.create({
      user_id: userId,
      out_trade_no: outTradeNo,
      type: paymentMethod,
      name: plan.name,
      money: plan.price,
      plan_type: planType,
      credits: plan.credits,
      status: 'pending'
    });

    // 银行卡支付：模拟支付，直接成功
    if (paymentMethod === 'bank') {
      // 直接发放权益
      await this.fulfillBenefits(order, `BANK_${outTradeNo}`);

      // 返回前端结果页URL
      return {
        order,
        payUrl: `${frontendResultUrl}?out_trade_no=${outTradeNo}`
      };
    }

    // 构造易支付参数
    const params = {
      pid: this.pid,
      type: paymentMethod,
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      name: plan.name,
      money: plan.price.toFixed(2),
      sitename: 'CervixDetectAI'
    };

    // 生成签名
    params.sign = this.generateSign(params);
    params.sign_type = 'MD5';

    // 构造跳转URL
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const payUrl = `${this.apiUrl}submit.php?${queryString}`;

    return {
      order,
      payUrl
    };
  }

  /**
   * 查询易支付订单状态
   * @param {string} outTradeNo 订单号
   */
  async queryFromEpay(outTradeNo) {
    try {
      // 构造查询参数
      // 易支付查询接口: api.php?act=order&pid={pid}&key={key}&out_trade_no={out_trade_no}
      const response = await axios.get(`${this.apiUrl}api.php`, {
        params: {
          act: 'order',
          pid: this.pid,
          key: this.key,
          out_trade_no: outTradeNo
        }
      });

      // 返回示例: { code: 1, status: 1, money: "270.00", trade_no: "xxx" }
      // status: 0=未支付, 1=已支付
      console.log('[EPay] 查询订单结果:', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('查询易支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 同步订单状态
   * @param {string} outTradeNo 订单号
   */
  async syncOrderStatus(outTradeNo) {
    const order = await Order.findOne({ where: { out_trade_no: outTradeNo } });
    if (!order) {
      throw new Error('订单不存在');
    }

    // 如果订单已经支付或完成，直接返回
    if (order.status === 'paid' || order.status === 'completed') {
      return order;
    }

    // 查询易支付
    const epayResult = await this.queryFromEpay(outTradeNo);

    // 使用 == 而非 === 来兼容字符串和数字
    if (epayResult.code == 1 && epayResult.status == 1) {
      // 支持成功
      console.log('[EPay] 支付成功，发放权益:', outTradeNo);
      return await this.fulfillBenefits(order, epayResult.trade_no);
    }

    console.log('[EPay] 订单未支付:', outTradeNo, 'status:', epayResult.status);
    return order;
  }

  /**
   * 发放权益（事务处理）
   * @param {Order} order 订单对象
   * @param {string} tradeNo 支付平台交易号
   */
  async fulfillBenefits(order, tradeNo) {
    if (order.status === 'paid') return order;

    const t = await sequelize.transaction();

    try {
      // 1. 更新订单状态
      order.status = 'paid';
      order.trade_no = tradeNo;
      order.pay_time = new Date();
      await order.save({ transaction: t });

      // 2. 更新用户权益
      const user = await User.findByPk(order.user_id, { transaction: t });
      const plan = PLANS[order.plan_type];

      // 增加积分
      user.remaining_credits = (user.remaining_credits || 0) + plan.credits;

      // 如果是订阅类型，更新订阅时间
      if (plan.type === 'subscription') {
        const now = new Date();
        const currentExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : now;

        // 如果当前未过期，在原基础上增加；否则从当前时间开始
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

        user.subscription_type = order.plan_type;
        user.subscription_expires_at = newExpiry;
      }

      await user.save({ transaction: t });

      await t.commit();
      return order;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * 处理回调通知
   */
  async handleNotify(params) {
    // 1. 验证签名
    if (!this.verifySign(params)) {
      throw new Error('签名验证失败');
    }

    // 2. 检查支付状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      return 'success'; // 即使失败也返回success，避免重复通知
    }

    // 3. 查找订单
    const order = await Order.findOne({
      where: { out_trade_no: params.out_trade_no }
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 4. 发放权益
    if (order.status !== 'paid') {
      // 校验金额
      const notifyMoney = parseFloat(params.money);
      const orderMoney = parseFloat(order.money);

      if (Math.abs(notifyMoney - orderMoney) > 0.01) {
        throw new Error('金额不匹配');
      }

      await this.fulfillBenefits(order, params.trade_no);
    }

    return 'success';
  }
}

module.exports = new PaymentService();
