# 支付 API

## 概述

支付模块提供订阅套餐购买、订单管理和支付状态查询功能。集成了易支付(EPay)第三方支付平台，支持支付宝、微信支付和银行卡（模拟）三种支付方式。

## 数据模型

### Order 订单表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户ID |
| out_trade_no | STRING(64) | 商户订单号（唯一） |
| trade_no | STRING(64) | 支付平台交易号 |
| type | STRING(20) | 支付方式 (alipay/wxpay/bank) |
| name | STRING(127) | 商品名称 |
| money | DECIMAL(10,2) | 订单金额 |
| plan_type | STRING(50) | 套餐类型 |
| credits | INTEGER | 获得积分数 |
| status | ENUM | 订单状态 (pending/paid/failed/expired) |
| pay_time | DATE | 支付时间 |
| notify_data | TEXT | 回调原始数据 |

## API 端点

### POST /api/payment/create

创建支付订单。

**请求头**: 需要 Bearer Token 认证

**请求体**:
```json
{
  "planType": "monthly",
  "paymentMethod": "alipay"
}
```

**套餐类型 (planType)**:
| 值 | 名称 | 价格 | 积分 |
|-----|------|------|------|
| test | 测试套餐 | ¥0.01 | 1 |
| package-10 | 10次AI分析包 | ¥158.00 | 10 |
| package-30 | 30次AI分析包 | ¥438.00 | 30 |
| package-50 | 50次AI分析包 | ¥649.00 | 50 |
| monthly | 月度订阅会员 | ¥270.00 | 20 |
| yearly | 年度订阅会员 | ¥2700.00 | 300 |

**支付方式 (paymentMethod)**:
| 值 | 说明 |
|-----|------|
| alipay | 支付宝（真实支付） |
| wxpay | 微信支付（真实支付） |
| bank | 银行卡支付（模拟，直接成功） |

**响应**:
```json
{
  "code": 200,
  "data": {
    "order": { ... },
    "payUrl": "https://pay.example.com/..."
  },
  "message": "订单创建成功"
}
```

### GET /api/payment/check/:out_trade_no

公开接口，查询订单状态（用于支付结果页轮询）。

**无需认证**

**响应**:
```json
{
  "code": 200,
  "data": {
    "out_trade_no": "1769535136337887",
    "status": "paid",
    "name": "测试套餐",
    "money": "0.01",
    "plan_type": "test",
    "credits": 1,
    "pay_time": "2026-01-28T01:33:13.000Z"
  },
  "message": "获取成功"
}
```

### GET /api/payment/status/:out_trade_no

查询订单详细状态（需认证，验证订单归属）。

**请求头**: 需要 Bearer Token 认证

### GET /api/payment/orders

获取当前用户的订单列表。

**请求头**: 需要 Bearer Token 认证

**查询参数**:
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 10）

### GET /api/payment/notify

易支付异步回调通知（GET 方式）。

### POST /api/payment/notify

易支付异步回调通知（POST 方式）。

### GET /api/payment/return

易支付同步跳转，中转到前端结果页。

## 支付流程

### 支付宝/微信支付流程

```
用户选择套餐 → POST /payment/create → 返回 payUrl
      ↓
跳转易支付收银台 → 用户完成支付
      ↓
易支付跳转 → GET /payment/return → 重定向前端
      ↓
前端结果页轮询 → GET /payment/check/:out_trade_no
      ↓
后端查询易支付API → 确认支付状态 → 发放权益
```

### 银行卡支付流程（模拟）

```
用户选择银行卡支付 → POST /payment/create
      ↓
后端直接标记订单已支付 → 发放权益
      ↓
返回前端结果页URL → 显示支付成功
```

## 权益发放

支付成功后自动发放权益：

1. **积分包**: 增加用户 `remaining_credits`
2. **订阅套餐**:
   - 更新 `subscription_type` 为套餐类型
   - 计算并设置 `subscription_expires_at` 过期时间
   - 如当前订阅未过期，在原基础上叠加时间

## 环境配置

```env
# 易支付配置
EPAY_PID=12636
EPAY_KEY=your_merchant_key
EPAY_API_URL=https://pay.mymzf.com/xpay/epay/
EPAY_NOTIFY_URL=http://your-domain.com/api/payment/notify
EPAY_RETURN_URL=http://your-domain.com/api/payment/return
FRONTEND_RESULT_URL=http://your-domain.com/#/payment/result
```

## 安全注意事项

1. **签名验证**: 所有回调必须验证 MD5 签名
2. **金额校验**: 回调金额与订单金额必须一致
3. **幂等处理**: 防止重复发放权益
4. **密钥保护**: 商户密钥仅存于后端环境变量
