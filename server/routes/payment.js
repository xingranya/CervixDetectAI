/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { Order } = require('../models');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: 支付相关接口
 */

/**
 * @swagger
 * /payment/create:
 *   post:
 *     summary: 创建支付订单
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planType
 *               - paymentMethod
 *             properties:
 *               planType:
 *                 type: string
 *                 description: 套餐类型 (package-10/package-30/monthly/yearly)
 *               paymentMethod:
 *                 type: string
 *                 description: 支付方式 (alipay/wxpay)
 *     responses:
 *       200:
 *         description: 订单创建成功，返回支付链接
 */
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { planType, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!planType || !paymentMethod) {
      return res.status(400).json({ error: '参数不完整' });
    }

    // 动态获取当前域名，支持多域名部署
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const result = await paymentService.createOrder(userId, planType, paymentMethod, baseUrl);

    res.json({
      code: 200,
      data: result,
      message: '订单创建成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /payment/check/{out_trade_no}:
 *   get:
 *     summary: 公开查询订单状态（用于支付结果页）
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: out_trade_no
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 返回订单状态
 */
router.get('/check/:out_trade_no', async (req, res, next) => {
  try {
    const { out_trade_no } = req.params;

    // 同步并获取最新状态
    const order = await paymentService.syncOrderStatus(out_trade_no);

    // 只返回必要的非敏感信息
    res.json({
      code: 200,
      data: {
        out_trade_no: order.out_trade_no,
        status: order.status,
        name: order.name,
        money: order.money,
        plan_type: order.plan_type,
        credits: order.credits,
        pay_time: order.pay_time
      },
      message: '获取成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /payment/status/{out_trade_no}:
 *   get:
 *     summary: 查询订单状态
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: out_trade_no
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 返回订单状态
 */
router.get('/status/:out_trade_no', authenticate, async (req, res, next) => {
  try {
    const { out_trade_no } = req.params;

    // 同步并获取最新状态
    const order = await paymentService.syncOrderStatus(out_trade_no);

    // 验证订单归属
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权访问此订单' });
    }

    res.json({
      code: 200,
      data: order,
      message: '获取成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /payment/orders:
 *   get:
 *     summary: 获取用户订单列表
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 订单列表
 */
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Order.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      code: 200,
      data: {
        orders: rows,
        total: count,
        page,
        limit
      },
      message: '获取成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /payment/notify:
 *   get:
 *     summary: 支付异步通知
 *     tags: [Payment]
 *     description: 易支付回调接口
 */
router.get('/notify', async (req, res) => {
  try {
    const result = await paymentService.handleNotify(req.query);
    res.send(result);
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.send('fail');
  }
});

/**
 * @swagger
 * /payment/notify:
 *   post:
 *     summary: 支付异步通知 (POST)
 *     tags: [Payment]
 */
router.post('/notify', async (req, res) => {
  try {
    const result = await paymentService.handleNotify(req.body);
    res.send(result);
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.send('fail');
  }
});

/**
 * @swagger
 * /payment/return:
 *   get:
 *     summary: 支付同步跳转
 *     tags: [Payment]
 */
router.get('/return', async (req, res) => {
    // 动态获取当前域名，支持多域名部署
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    let baseUrl = `${protocol}://${host}`;

    // NAT 环境：替换为外网端口
    const externalPort = process.env.EXTERNAL_PORT;
    if (externalPort) {
      const url = new URL(baseUrl);
      url.port = externalPort;
      baseUrl = url.origin;
    }

    // 同步跳转：后端中转到前端 Hash Mode URL
    const { out_trade_no } = req.query;
    res.redirect(`${baseUrl}/#/payment/result?out_trade_no=${encodeURIComponent(out_trade_no)}`);
});

module.exports = router;
