# 注册逻辑修改总结 - 邮箱与工号任选其一或其二

## 📋 修改概述

将注册逻辑从"邮箱或工号必填其一"改为"邮箱和工号任选其一或其二"，支持更灵活的注册方式。

---

## ✅ 修改内容

### 1. 前端 UI 修改

#### 1.1 所属医院字段
**修改前：**
```vue
<q-select
  label="所属医院"
  :rules="[(val) => !!val || '请选择所属医院']"
/>
```

**修改后：**
```vue
<q-select
  label="所属医院（工号注册时必填）"
  :rules="[(val) => (val || (!department && !entryYear && !sequenceNumber)) || '请选择所属医院']"
/>
```

**说明：** 只有当填写了工号相关信息时，医院才变为必填。

---

#### 1.2 工号字段
**修改前：**
```vue
<!-- 科室、入职年份、顺序号都是必填 -->
:rules="[(val) => !!val || '请选择']"
:rules="[(val) => !!val || '必填']"
```

**修改后：**
```vue
<!-- 所有字段都改为可选 -->
<!-- 添加验证规则但不强制必填 -->
:rules="[(val) => !val || val.length === 4 || '4位年份']"
```

**说明：** 工号字段完全改为可选，只有格式验证。

---

#### 1.3 添加分隔线
```vue
<div class="text-center text-grey-6 q-my-md">
  <q-separator class="q-mb-sm" />
  <span class="text-caption">或使用邮箱注册</span>
  <q-separator class="q-mt-sm" />
</div>
```

**说明：** 在工号和邮箱输入框之间添加视觉分隔，提示用户两种注册方式。

---

### 2. 前端逻辑修改

#### 2.1 注册数据结构
**修改前：**
```typescript
const userData: {
  password: string;
  hospital_id: string;      // 必填
  employee_id: string;      // 必填
  email?: string;
  emailCode?: string;
  real_name?: string;
  phone?: string;
} = {
  password: password.value,
  hospital_id: hospital.value!.id,  // 必填
  employee_id: `${department.value!.code}${entryYear.value}${sequenceNumber.value}`,  // 必填
};
```

**修改后：**
```typescript
const userData: {
  password: string;
  hospital_id?: string;     // 可选
  employee_id?: string;     // 可选
  email?: string;
  emailCode?: string;
  real_name?: string;
  phone?: string;
} = {
  password: password.value,
};

// 根据用户填写情况动态添加
if (hasEmployeeId && hospital.value) {
  userData.hospital_id = hospital.value.id;
  userData.employee_id = `${department.value!.code}${entryYear.value}${sequenceNumber.value}`;
}
if (hasEmail) {
  userData.email = email.value;
  userData.emailCode = emailCode.value;
}
```

---

#### 2.2 添加注册验证
```typescript
// 验证：邮箱和工号至少需要一个
const hasEmail = !!email.value;
const hasEmployeeId = !!(department.value && entryYear.value && sequenceNumber.value);

if (!hasEmail && !hasEmployeeId) {
  $q.notify({
    type: 'warning',
    message: '请填写邮箱或工号信息（至少需要一种）',
    position: 'top',
  });
  return;
}

// 验证：如果填写了邮箱，必须填写验证码
if (hasEmail && !emailCode.value) {
  $q.notify({
    type: 'warning',
    message: '请输入邮箱验证码',
    position: 'top',
  });
  return;
}

// 验证：如果填写了工号，必须选择医院
if (hasEmployeeId && !hospital.value) {
  $q.notify({
    type: 'warning',
    message: '工号注册需要选择所属医院',
    position: 'top',
  });
  return;
}
```

---

### 3. 后端优化

#### 3.1 优化错误消息
**修改前：**
```javascript
if ((!email && !employee_id) || !password) {
  return res.status(400).json({
    success: false,
    message: '账号和密码为必填项',
  });
}
```

**修改后：**
```javascript
// 基础验证：邮箱和工号至少需要一个
if ((!email && !employee_id) || !password) {
  return res.status(400).json({
    success: false,
    message: '请填写邮箱或工号信息（至少需要一种），密码为必填项',
  });
}
```

**说明：** 错误消息更清晰，准确说明验证规则。

---

## 🎯 支持的注册方式

### 方式1：纯邮箱注册 ✅
```
✅ 邮箱: user@example.com
✅ 邮箱验证码: 123456
✅ 密码: password123
❌ 医院: 不需要
❌ 工号: 不需要
```

### 方式2：纯工号注册 ✅
```
✅ 医院: 荆州市中心医院
✅ 科室: GH
✅ 入职年份: 2024
✅ 顺序号: 01
✅ 密码: password123
❌ 邮箱: 不需要
❌ 验证码: 不需要
```

### 方式3：邮箱 + 工号注册 ✅
```
✅ 邮箱: user@example.com
✅ 邮箱验证码: 123456
✅ 医院: 荆州市中心医院
✅ 科室: GH
✅ 入职年份: 2024
✅ 顺序号: 01
✅ 密码: password123
```

---

## 📊 数据模型验证

### User 模型字段
```javascript
{
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,        // ✅ 允许为空
    unique: true,
  },
  hospital_id: {
    type: DataTypes.STRING(50),
    allowNull: true,        // ✅ 允许为空
  },
  employee_id: {
    type: DataTypes.STRING(50),
    allowNull: true,        // ✅ 允许为空
    unique: true,
  },
}
```

**结论：** 数据模型已完全支持灵活注册方式。

---

## ✨ 用户体验优化

### 1. 清晰的提示
- ✅ "所属医院（工号注册时必填）" - 明确说明使用场景
- ✅ "邮箱（可选）" - 邮箱为可选项
- ✅ 分隔线提示："或使用邮箱注册" - 引导用户选择

### 2. 智能验证
- ✅ 动态验证规则 - 根据用户填写情况调整
- ✅ 友好的错误提示 - 明确告知缺少什么信息
- ✅ 实时反馈 - 输入时即时验证

### 3. 灵活性
- ✅ 三种注册方式任选
- ✅ 无强制要求 - 用户可自由选择
- ✅ 向后兼容 - 原有工号注册方式不受影响

---

## 🧪 测试场景

### 场景1：纯邮箱注册
1. 只填写邮箱和验证码
2. 填写密码
3. 提交注册
4. ✅ 应该成功

### 场景2：纯工号注册
1. 选择医院
2. 填写工号信息（科室、年份、顺序号）
3. 填写密码
4. 提交注册
5. ✅ 应该成功

### 场景3：邮箱 + 工号注册
1. 选择医院
2. 填写工号信息
3. 填写邮箱和验证码
4. 填写密码
5. 提交注册
6. ✅ 应该成功

### 场景4：两者都不填
1. 不填写邮箱和工号
2. 只填写密码
3. 提交注册
4. ❌ 应该提示："请填写邮箱或工号信息（至少需要一种）"

### 场景5：填写邮箱但无验证码
1. 填写邮箱但不填验证码
2. 提交注册
3. ❌ 应该提示："请输入邮箱验证码"

### 场景6：填写工号但无医院
1. 填写工号信息但不选医院
2. 提交注册
3. ❌ 应该提示："工号注册需要选择所属医院"

---

## 📝 相关文件

### 前端
- `src/pages/RegisterPage.vue` - 注册页面

### 后端
- `server/routes/auth.js` - 注册接口
- `server/models/User.js` - 用户数据模型

---

## 🎉 完成状态

✅ 前端 UI 修改完成
✅ 前端逻辑修改完成
✅ 后端优化完成
✅ 数据模型验证通过

**总计进度：100%**

---

生成时间: 2026-02-05
版本: v1.1.0
