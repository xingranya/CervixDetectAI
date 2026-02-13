# 第一阶段：安全加固与基础完善

> **周期**: 2-3 周  
> **目标**: 修复所有 P0 级安全漏洞，消除数据泄露风险，完善基础功能缺失项  
> **前置条件**: 无  
> **验收标准**: 通过安全清单逐项验证，所有高危漏洞闭合

---

## 任务总览

| 任务                  |   编号   | 优先级 | 预估工时 | 依赖 |
| :-------------------- | :------: | :----: | :------: | :--: |
| 恢复患者数据权限隔离  | S1/S6/S7 |   P0   |    4h    |  无  |
| 静态资源鉴权保护      |    S2    |   P0   |    6h    |  无  |
| Token 安全存储迁移    |    S3    |   P0   |   12h    |  无  |
| 安全响应头 + 输入校验 |  S4/S5   |   P0   |    8h    |  无  |
| JWT Secret 强制校验   |    S8    |   P0   |   0.5h   |  无  |
| 验证码日志脱敏        |    S9    |   P0   |   0.5h   |  无  |
| 支付幂等性修复        |   S10    |   P0   |    4h    |  无  |
| Dashboard 数据真实化  |   F24    |   P1   |    4h    |  S1  |
| 忘记密码功能完善      |   U11    |   P1   |    4h    |  无  |
| API 服务层去重        |    T8    |   P1   |    6h    |  无  |

**合计预估**: ~49h（约 6 个工作日）

---

## 详细执行方案

### 1. S1/S6/S7 — 恢复患者数据权限隔离

**问题背景**: `server/routes/patients.js` 中权限校验被显式注释掉，`analyze.js` 和 `system.js` 接口缺少鉴权。

**执行步骤**:

1. **`server/routes/patients.js`**: 取消注释 `created_by` 过滤逻辑

   ```diff
   - // if (req.user.role !== 'admin') { where.created_by = req.user.id; }
   + if (req.user.role !== 'admin') { where.created_by = req.user.id; }
   ```

2. **`server/routes/patients.js`**: 恢复患者详情归属校验

   ```diff
   - // if (req.user.role !== 'admin' && patient.created_by !== req.user.id) { return 403; }
   + if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
   +   return res.status(403).json({ success: false, message: '无权访问该患者信息' });
   + }
   ```

3. **`server/routes/analyze.js`**: 为 `GET /api/analyze/:taskId` 和 `GET /api/analyze/study/:studyId` 添加 `authenticate` 中间件 + 归属校验

4. **`server/routes/system.js`**: 为所有接口添加 `authenticate`，写操作增加 `authorize('admin')`

5. **`server/routes/studies.js`**: 移除 `user_id = null` 的开放查询

**验收条件**:

- [ ] 非管理员访问他人患者数据返回 403
- [ ] 未登录访问 `/api/analyze/*` 返回 401
- [ ] 未登录访问 `/api/system/*` 返回 401
- [ ] 非管理员调用 `POST /api/system/database/cleanup` 返回 403
- [ ] 普通用户 `GET /api/studies` 只返回自己的病例

---

### 2. S2 — 静态资源鉴权保护

**问题背景**: `server/index.js` 中 `/uploads` 和 `/reports` 目录直接通过 `express.static` 公开，无需登录即可下载患者影像和报告。

**执行步骤**:

1. 移除 `server/index.js` 中的公开静态目录挂载：

   ```diff
   - app.use('/reports', express.static(reportsDir));
   - app.use('/uploads', express.static(uploadDir));
   ```

2. 新建受控下载接口 `server/routes/files.js`：

   ```javascript
   // GET /api/files/study-images/:imageId — 需鉴权 + 归属校验
   // GET /api/files/reports/:reportId — 需鉴权 + 归属校验
   ```

3. 前端修改所有直接引用 `/uploads/xxx` 的图片路径，改为调用下载接口获取文件流

4. 前端图片展示改用 `URL.createObjectURL(blob)` 方式渲染

**涉及文件**:

- `server/index.js` — 移除 static 挂载
- `server/routes/files.js` — 新建受控下载路由
- `src/stores/studyStore.ts` — 修正图片 URL 构建逻辑
- `src/pages/StudyDetailPage.vue` — 修改影像展示方式

**验收条件**:

- [ ] 直接访问 `GET /uploads/xxx` 返回 404
- [ ] 直接访问 `GET /reports/xxx` 返回 404
- [ ] 登录后通过 API 可正常下载自己的影像
- [ ] 登录后无法下载他人的影像（返回 403）

---

### 3. S3 — Token 安全存储迁移

**问题背景**: Access/Refresh Token 均存储在 `localStorage`，XSS 攻击可直接窃取。

**执行步骤**:

1. **后端**: 修改 `/api/auth/login` 和 `/api/auth/refresh` 响应：
   - `accessToken` 仍在 JSON 响应体中返回
   - `refreshToken` 通过 `Set-Cookie` 设置为 HttpOnly + Secure + SameSite=Strict

2. **后端**: 新建 `server/middleware/cookieParser.js`（或引入 `cookie-parser`）

3. **后端**: `/api/auth/refresh` 从 Cookie 中读取 `refreshToken`（而非请求体）

4. **前端**: `src/stores/authStore.ts` 修改：
   - `accessToken` 仅保存在 Pinia state 内存中
   - 移除 `localStorage.setItem('refreshToken', ...)` 相关代码
   - 页面刷新时自动调用 `/api/auth/refresh`（依赖 Cookie 自动携带）

5. **前端**: `src/services/api.ts` 和 `src/services/apiClient.ts` 统一修改 Token 获取逻辑

**注意事项**:

- 开发环境（HTTP）需将 Cookie 的 `Secure` 属性设为 `false`，通过环境变量控制
- CORS 配置需添加 `credentials: true`
- Quasar proxy 配置需确保正确转发 Cookie

**验收条件**:

- [ ] 浏览器 `localStorage` 中不再存有 `refreshToken`
- [ ] 刷新页面后仍保持登录状态
- [ ] `document.cookie` 中看不到 `refreshToken`（HttpOnly）
- [ ] XSS 注入脚本无法获取 refreshToken

---

### 4. S4/S5 — 安全响应头 + 输入校验

**执行步骤**:

1. **安全头**（S4）：

   ```bash
   cd server && npm install helmet express-rate-limit
   ```

   ```javascript
   // server/index.js
   const helmet = require('helmet');
   const rateLimit = require('express-rate-limit');

   app.use(helmet());
   app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
   app.use('/api/sms/', rateLimit({ windowMs: 60 * 1000, max: 5 }));
   ```

2. **输入校验**（S5）：
   ```bash
   cd server && npm install joi
   ```

   - 优先为以下高风险接口添加校验：
     - `POST /api/auth/login`
     - `POST /api/auth/register`
     - `POST /api/patients`
     - `POST /api/studies`
     - `POST /api/analyze`
   - 创建 `server/middleware/validate.js` 通用校验中间件

**验收条件**:

- [ ] 响应头包含 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security`
- [ ] 登录接口 15 分钟内超过 20 次返回 429
- [ ] 发送空 body 到 `POST /api/patients` 返回 400 + 具体字段校验错误

---

### 5. S8/S9 — 快速修复项

**S8 — JWT Secret 强制校验**:

```javascript
// server/utils/jwt.js — 启动时校验
if (!process.env.JWT_SECRET) {
  console.error('❌ 致命错误: JWT_SECRET 环境变量未配置');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
```

**S9 — 验证码日志脱敏**:

```diff
// server/routes/sms-auth.js
- console.log(`📱 [短信验证码] 已发送 ... 验证码: ${sendResult.code}`);
+ console.log(`📱 [短信验证码] 已发送至 ${phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}, biz_id: ${sendResult.bizId}`);
```

---

### 6. S10 — 支付幂等性修复

**执行步骤**:

1. 在 `server/services/paymentService.js` 的 `fulfillBenefits()` 中：

   ```javascript
   // 使用事务 + 行锁确保原子性
   const result = await sequelize.transaction(async (t) => {
     const order = await Order.findOne({
       where: { out_trade_no, status: { [Op.ne]: 'paid' } },
       lock: t.LOCK.UPDATE,
       transaction: t,
     });
     if (!order) return null; // 已处理过，直接跳过
     // ... 发放权益 ...
     await order.update({ status: 'paid' }, { transaction: t });
     return order;
   });
   ```

2. 记录已处理的 `trade_no`，防止回调重放

**验收条件**:

- [ ] 并发发送两次相同回调，积分只增加一次
- [ ] 日志记录重复回调被跳过的信息

---

### 7. F24 — Dashboard 数据真实化

**问题背景**: `server/routes/dashboard.js` 中部分统计未按用户范围过滤，且存在调试后门。

**执行步骤**:

1. 删除 `historyTasks = allTasks` 调试后门逻辑
2. 所有统计查询添加 `userCondition` 过滤（关联 `Study.user_id`）
3. `highRiskCount` 和 `diagnosisStats` 聚合查询加入用户范围限制
4. 管理员可查看全局统计（通过 `req.user.role === 'admin'` 条件区分）

**验收条件**:

- [ ] 普通用户看到的统计数据仅包含自己的病例
- [ ] 管理员看到全局统计
- [ ] 无调试后门代码残留

---

### 8. U11 — 忘记密码功能完善

**问题背景**: `ForgotPasswordPage.vue` 仅有 1384 字节，使用 `alert()` Mock 提示。

**执行步骤**:

1. **后端**: 复用现有 `email.service.js`，新增 `/api/auth/forgot-password` 和 `/api/auth/reset-password` 接口
2. **后端**: 复用 `EmailCode` 模型存储重置密码验证码
3. **前端**: 完善 `ForgotPasswordPage.vue`：
   - 输入邮箱 → 发送验证码 → 输入验证码+新密码 → 重置成功
   - 添加倒计时、错误提示、成功跳转

**验收条件**:

- [ ] 输入已注册邮箱可收到重置密码邮件
- [ ] 输入正确验证码 + 新密码后成功重置
- [ ] 输入错误验证码返回明确错误提示

---

### 9. T8 — API 服务层去重

**问题背景**: `src/services/api.ts` 和 `src/services/apiClient.ts` 并存，各自创建 axios 实例，Token 刷新和错误处理逻辑不一致。

**执行步骤**:

1. 确定 `apiClient.ts` 为唯一 axios 实例
2. 将 `api.ts` 中的业务 API 函数迁移到各独立 Service 文件（如已存在的 `patientService.ts`）
3. 统一 Token 刷新逻辑：仅在 `apiClient.ts` 中实现，添加"单飞"锁防止并发 401 时重复刷新
4. 修改 `window.location.href = '/login'` 为 `window.location.href = '/#/login'`（兼容 hash 路由）
5. 全局搜索替换所有使用 `api.ts` 的导入，改为 `apiClient.ts`

**涉及文件**:

- `src/services/api.ts` — 删除或改为纯 API 函数定义
- `src/services/apiClient.ts` — 唯一 axios 实例 + 拦截器
- `src/stores/*.ts` — 统一使用 `apiClient`

**验收条件**:

- [ ] 全局仅存在一个 axios 实例
- [ ] 多个页面同时 401 时只触发一次 Token 刷新
- [ ] hash 路由下刷新失败正确跳转到登录页

---

## 里程碑检查清单

完成本阶段后，确认以下所有项：

- [ ] 所有 P0 安全漏洞已修复
- [ ] 未登录无法访问任何敏感资源
- [ ] 患者数据做到用户级隔离
- [ ] Token 存储已安全化
- [ ] 支付回调无法重放
- [ ] Dashboard 展示真实数据
- [ ] 忘记密码功能可用
- [ ] API 客户端统一归一
- [ ] 项目可通过 `npm run build` 正常构建
- [ ] Docker 部署无回归问题
