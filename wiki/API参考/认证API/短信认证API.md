# 短信认证 API

<cite>
**Referenced Files**
- [sms-auth.js](file://server/routes/sms-auth.js)
- [api.ts](file://src/services/api.ts)
</cite>

## 概述
提供基于短信验证码的认证服务，包括验证码发送、短信登录、注册和密码重置。

**Base URL**: `/api/auth/sms`

## 1. 发送验证码

向指定手机号发送 6 位数字验证码。

- **URL**: `/send-code`
- **Method**: `POST`
- **Auth Required**: No

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| phone | string | 是 | 11位手机号码 |
| type | string | 否 | 验证码类型，默认为 `login`。<br>可选值: `login` (登录/注册通用), `register` (注册), `reset_password` (重置密码) |

### 响应示例

```json
{
  "success": true,
  "message": "验证码已发送",
  "data": {
    "expiresIn": 300
  }
}
```

### 错误码
- `400`: 手机号格式错误 / 缺少参数
- `404`: 重置密码时手机号未注册
- `409`: 注册时手机号已存在
- `429`: 发送过于频繁（60秒内）或超过每日限额

---

## 2. 短信登录

使用手机号和验证码进行登录。

- **URL**: `/login`
- **Method**: `POST`
- **Auth Required**: No

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| phone | string | 是 | 11位手机号码 |
| code | string | 是 | 6位短信验证码 |

### 响应示例

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "user_13800...",
      "phone": "13800138000",
      "role": "user",
      "status": "active"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## 3. 短信注册

使用手机号和验证码创建新账号。

- **URL**: `/register`
- **Method**: `POST`
- **Auth Required**: No

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| phone | string | 是 | 11位手机号码 |
| code | string | 是 | 6位短信验证码 |
| username | string | 否 | 自定义用户名，若不填则自动生成 |
| real_name | string | 否 | 真实姓名 |
| email | string | 否 | 邮箱，若不填则生成临时邮箱 |

### 响应示例

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 注意事项
- 注册成功后会自动登录，返回 Token。
- 注册接口内部验证验证码时，会查找 `type='login'` 的验证码记录（代码实现细节），因此发送验证码时建议使用默认类型或 `login`。

---

## 4. 重置密码

通过短信验证码重置用户密码。

- **URL**: `/reset-password`
- **Method**: `POST`
- **Auth Required**: No

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| phone | string | 是 | 11位手机号码 |
| code | string | 是 | 6位短信验证码 |
| newPassword | string | 是 | 新密码（至少6位） |

### 响应示例

```json
{
  "success": true,
  "message": "密码重置成功"
}
```
