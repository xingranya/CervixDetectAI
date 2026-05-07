/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');
const axios = require('axios');
const { Order, User, sequelize } = require('../models');

const RAW_PLANS = {
  test: { name: '测试套餐', price: 0.01, credits: 1, type: 'package' },
  'package-10': { name: '10次AI分析包', price: 158.0, credits: 10, type: 'package' },
  'package-30': { name: '30次AI分析包', price: 438.0, credits: 30, type: 'package' },
  'package-50': { name: '50次AI分析包', price: 649.0, credits: 50, type: 'package' },
  monthly: { name: '月度订阅会员', price: 270.0, credits: 20, days: 30, type: 'subscription' },
  yearly: { name: '年度订阅会员', price: 2700.0, credits: 300, days: 365, type: 'subscription' },
  'basic-formal-once': { name: '基础套餐单次版', price: 29.9, credits: 1, type: 'package' },
  'basic-monthly-auto': {
    name: '基础套餐连续包月',
    price: 888.0,
    credits: 0,
    days: 30,
    type: 'subscription',
  },
  'basic-monthly': {
    name: '基础套餐一月版',
    price: 980.0,
    credits: 0,
    days: 30,
    type: 'subscription',
  },
  'basic-half-year': {
    name: '基础套餐半年版',
    price: 5199.0,
    credits: 0,
    days: 180,
    type: 'subscription',
  },
  'basic-yearly': {
    name: '基础套餐一年版',
    price: 9888.0,
    credits: 0,
    days: 365,
    type: 'subscription',
  },
  'premium-monthly-auto': {
    name: '顶级套餐连续包月',
    price: 999.0,
    credits: 0,
    days: 30,
    type: 'subscription',
  },
  'premium-monthly': {
    name: '顶级套餐一月版',
    price: 1280.0,
    credits: 0,
    days: 30,
    type: 'subscription',
  },
  'premium-half-year': {
    name: '顶级套餐半年版',
    price: 6699.0,
    credits: 0,
    days: 180,
    type: 'subscription',
  },
  'premium-yearly': {
    name: '顶级套餐一年版',
    price: 12699.0,
    credits: 0,
    days: 365,
    type: 'subscription',
  },
};

const PLANS = Object.freeze(RAW_PLANS);
const DEFAULT_TIMEOUT = 15000;

function normalizeGatewayBaseUrl(rawUrl) {
  const fallback = 'https://mpay.qzz.io/xpay/epay/';
  if (!rawUrl) return fallback;
  return `${String(rawUrl).replace(/\/+$/, '')}/`;
}

function detectClientDevice(inputDevice, userAgent) {
  if (typeof inputDevice === 'string' && inputDevice.trim()) {
    return inputDevice.trim().toLowerCase();
  }

  const ua = String(userAgent || '').toLowerCase();
  if (!ua) return 'pc';

  if (
    ua.includes('micromessenger') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('mobile')
  ) {
    return 'mobile';
  }

  return 'pc';
}

function serializeNotifyData(params) {
  try {
    return JSON.stringify(params);
  } catch {
    return null;
  }
}

function createPaymentError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isWhitelistError(error) {
  const message = String(error?.message || '');
  return message.includes('白名单') || message.includes('域名不在白名单');
}

class PaymentService {
  constructor() {
    this.pid = process.env.EPAY_PID;
    this.key = process.env.EPAY_KEY;
    this.apiUrl = normalizeGatewayBaseUrl(process.env.EPAY_API_URL);
    this.notifyUrl = process.env.EPAY_NOTIFY_URL;
    this.returnUrl = process.env.EPAY_RETURN_URL;
    this.frontendResultUrl = process.env.FRONTEND_RESULT_URL;
    this.requestTimeout = parseInt(process.env.EPAY_TIMEOUT_MS || '', 10) || DEFAULT_TIMEOUT;
  }

  ensureConfigured() {
    if (!this.pid || !this.key || !this.apiUrl) {
      throw new Error('支付网关配置不完整，请检查 EPAY_PID、EPAY_KEY、EPAY_API_URL');
    }
  }

  getPlan(planType) {
    const plan = PLANS[planType];
    if (!plan) {
      throw new Error('无效的套餐类型');
    }
    return plan;
  }

  getGatewayUrl(path) {
    return new URL(path, this.apiUrl).toString();
  }

  resolveUrls(baseUrl) {
    if (this.notifyUrl && this.returnUrl) {
      return {
        notifyUrl: this.notifyUrl,
        returnUrl: this.returnUrl,
        frontendResultUrl: this.frontendResultUrl || `${baseUrl}/#/payment/result`,
      };
    }

    const externalPort = process.env.EXTERNAL_PORT;
    let callbackBase = baseUrl;

    if (externalPort) {
      const url = new URL(baseUrl);
      url.port = externalPort;
      callbackBase = url.origin;
    }

    return {
      notifyUrl: `${callbackBase}/api/payment/notify`,
      returnUrl: `${callbackBase}/api/payment/return`,
      frontendResultUrl: `${callbackBase}/#/payment/result`,
    };
  }

  generateSign(params) {
    const keys = Object.keys(params).sort();
    const signStr = keys
      .filter((key) => {
        const value = params[key];
        return (
          key !== 'sign' &&
          key !== 'sign_type' &&
          value !== '' &&
          value !== undefined &&
          value !== null
        );
      })
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return crypto
      .createHash('md5')
      .update(`${signStr}${this.key}`)
      .digest('hex');
  }

  verifySign(params) {
    if (!params || !params.sign) return false;
    const calculatedSign = this.generateSign(params);
    return String(params.sign).toLowerCase() === calculatedSign;
  }

  getDisplayMode(payment) {
    if (payment?.qrcode) return 'qrcode';
    if (payment?.urlscheme) return 'scheme';
    if (payment?.payurl) return 'redirect';
    if (payment?.resultUrl) return 'result';
    return 'unknown';
  }

  async createGatewayOrder(params) {
    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        body.set(key, String(value));
      }
    });

    const response = await axios.post(this.getGatewayUrl('mapi.php'), body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: this.requestTimeout,
    });

    const data = response.data || {};

    if (String(data.code) !== '1') {
      throw createPaymentError(data.msg || '支付网关下单失败');
    }

    return {
      tradeNo: data.trade_no || null,
      payurl: data.payurl || null,
      qrcode: data.qrcode || null,
      urlscheme: data.urlscheme || null,
      money: data.money || null,
    };
  }

  async createOrder(userId, planType, paymentMethod, context) {
    const plan = this.getPlan(planType);
    const outTradeNo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const urls = this.resolveUrls(context.baseUrl);

    const order = await Order.create({
      user_id: userId,
      out_trade_no: outTradeNo,
      type: paymentMethod,
      name: plan.name,
      money: plan.price,
      plan_type: planType,
      credits: plan.credits,
      status: 'pending',
    });

    if (paymentMethod === 'bank') {
      const paidOrder = await this.fulfillBenefits(order, `BANK_${outTradeNo}`);
      const resultUrl = `${urls.frontendResultUrl}?out_trade_no=${encodeURIComponent(outTradeNo)}`;

      return {
        order: paidOrder,
        payUrl: resultUrl,
        payment: {
          outTradeNo,
          tradeNo: paidOrder.trade_no,
          payurl: resultUrl,
          qrcode: null,
          urlscheme: null,
          displayMode: 'result',
          resultUrl,
        },
      };
    }

    this.ensureConfigured();

    const basePayload = {
      pid: this.pid,
      type: paymentMethod,
      out_trade_no: outTradeNo,
      return_url: urls.returnUrl,
      name: plan.name,
      money: plan.price.toFixed(2),
      param: planType,
      clientip: context.clientIp || '',
      device: detectClientDevice(context.device, context.userAgent),
    };

    let gatewayResult;
    let usedNotifyUrl = urls.notifyUrl;

    try {
      const payload = {
        ...basePayload,
        notify_url: urls.notifyUrl,
      };

      gatewayResult = await this.createGatewayOrder({
        ...payload,
        sign: this.generateSign(payload),
        sign_type: 'MD5',
      });
    } catch (error) {
      if (!urls.notifyUrl || !isWhitelistError(error)) {
        throw error;
      }

      console.warn('[EPay] notify_url 白名单校验失败，降级为仅 return_url 模式:', error.message);
      usedNotifyUrl = '';

      gatewayResult = await this.createGatewayOrder({
        ...basePayload,
        sign: this.generateSign(basePayload),
        sign_type: 'MD5',
      });
    }

    const payment = {
      outTradeNo,
      tradeNo: gatewayResult.tradeNo,
      payurl: gatewayResult.payurl,
      qrcode: gatewayResult.qrcode,
      urlscheme: gatewayResult.urlscheme,
      displayMode: this.getDisplayMode(gatewayResult),
      resultUrl: `${urls.frontendResultUrl}?out_trade_no=${encodeURIComponent(outTradeNo)}`,
      notifyMode: usedNotifyUrl ? 'async' : 'manual',
    };

    if (!payment.payurl && !payment.qrcode && !payment.urlscheme) {
      throw createPaymentError('支付网关未返回可用的支付方式', 502);
    }

    return {
      order,
      payUrl: payment.payurl || payment.resultUrl,
      payment,
    };
  }

  async queryFromEpay(outTradeNo) {
    this.ensureConfigured();

    try {
      const response = await axios.get(this.getGatewayUrl('api.php'), {
        params: {
          act: 'order',
          pid: this.pid,
          key: this.key,
          out_trade_no: outTradeNo,
        },
        timeout: this.requestTimeout,
      });

      console.log('[EPay] 查询订单结果:', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('查询易支付订单失败:', error.message);
      throw error;
    }
  }

  async syncOrderStatus(outTradeNo) {
    const order = await Order.findOne({
      where: { out_trade_no: outTradeNo },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === 'paid') {
      return order;
    }

    if (order.type === 'bank') {
      return order;
    }

    const epayResult = await this.queryFromEpay(outTradeNo);

    if (String(epayResult.code) !== '1') {
      return order;
    }

    if (String(epayResult.status) === '1') {
      return this.fulfillBenefits(order, epayResult.trade_no || order.trade_no);
    }

    return order;
  }

  async fulfillBenefits(order, tradeNo, options = {}) {
    const transaction = await sequelize.transaction();

    try {
      const lockedOrder = await Order.findOne({
        where: { id: order.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!lockedOrder) {
        throw new Error('订单不存在');
      }

      if (lockedOrder.status === 'paid') {
        if (!lockedOrder.notify_data && options.notifyData) {
          lockedOrder.notify_data = options.notifyData;
          await lockedOrder.save({ transaction });
        }
        await transaction.commit();
        return lockedOrder;
      }

      const plan = this.getPlan(lockedOrder.plan_type);
      const user = await User.findByPk(lockedOrder.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        throw new Error('订单关联用户不存在');
      }

      lockedOrder.status = 'paid';
      lockedOrder.trade_no = tradeNo || lockedOrder.trade_no;
      lockedOrder.pay_time = new Date();
      if (options.notifyData) {
        lockedOrder.notify_data = options.notifyData;
      }
      await lockedOrder.save({ transaction });

      user.remaining_credits = (user.remaining_credits || 0) + (plan.credits || 0);

      if (plan.type === 'subscription' && plan.days) {
        const now = new Date();
        const currentExpiry = user.subscription_expires_at
          ? new Date(user.subscription_expires_at)
          : now;
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

        user.subscription_type = lockedOrder.plan_type;
        user.subscription_expires_at = newExpiry;
      }

      await user.save({ transaction });

      await transaction.commit();
      return lockedOrder;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async handleNotify(params) {
    if (!this.verifySign(params)) {
      throw new Error('签名验证失败');
    }

    const order = await Order.findOne({
      where: { out_trade_no: params.out_trade_no },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const notifyData = serializeNotifyData(params);

    if (params.trade_status !== 'TRADE_SUCCESS') {
      if (notifyData) {
        await Order.update(
          { notify_data: notifyData },
          {
            where: { id: order.id },
          },
        );
      }
      return 'success';
    }

    const notifyMoney = parseFloat(params.money);
    const orderMoney = parseFloat(order.money);
    if (Math.abs(notifyMoney - orderMoney) > 0.01) {
      throw new Error('金额不匹配');
    }

    await this.fulfillBenefits(order, params.trade_no, { notifyData });
    return 'success';
  }
}

module.exports = new PaymentService();
