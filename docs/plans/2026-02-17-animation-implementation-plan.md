# 认证与高频页面动画优化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改后端的前提下，为登录/注册/找回、仪表盘、上传页建立统一的“医疗稳重”动画体系，并落地到可维护的前端代码结构。

**Architecture:** 先建设全局动画基础层（Quasar 按需动画 + Motion Tokens + 通用类），再按页面域分层实施（Auth → Dashboard → Upload），最后做一致性回归和风险收敛。动画统一采用短时长、低位移、弱弹性，替换关键页面中的 `transition: all`，收敛到精确属性过渡。

**Tech Stack:** Vue 3、Quasar 2（Vite）、TypeScript、SCSS、ESLint

---

## 实施前约束

- 仅修改前端文件，不触碰 `server/**`
- 动画风格固定为“医疗稳重”
- 按用户确认，本轮不实现 `prefers-reduced-motion` 分支
- 优先页面：Auth（登录/注册/找回）→ Dashboard → Upload

---

### Task 1: 建立动画基础层（配置 + Token + 通用类）

**Files:**
- Modify: `quasar.config.ts:128-131`
- Modify: `src/css/design-tokens.scss:33-36`（扩展 motion 变量）
- Modify: `src/css/app.scss`（新增通用 motion 工具类）
- Test: `npm run lint`

**Step 1: 写“失败”的基线验收清单（手工测试先失败）**

在本地临时记录（可放在任务笔记）以下基线断言，当前应至少 3 项不满足：

```md
- [ ] Auth 工作区入场位移 <= 12px
- [ ] Dashboard 不再出现 transition: all
- [ ] Upload 页 fade 时长与全局 token 一致
- [ ] 所有高频弹窗 show/hide 节奏一致
```

**Step 2: 运行基线检查，确认“失败”**

Run: `npm run dev`
Expected: 页面存在动效节奏不一致；Dashboard 仍可检出 `transition: all`。

**Step 3: 实现最小基础改造**

1) `quasar.config.ts` 将动画从空数组改为按需：

```ts
animations: ['fadeIn', 'fadeOut', 'scaleIn', 'scaleOut']
```

2) `src/css/design-tokens.scss` 增加 motion tokens：

```scss
--app-motion-duration-fast: 140ms;
--app-motion-duration-normal: 220ms;
--app-motion-duration-slow: 320ms;
--app-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--app-motion-ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);
--app-motion-distance-xs: 4px;
--app-motion-distance-sm: 8px;
--app-motion-distance-md: 12px;
```

3) `src/css/app.scss` 增加可复用类：

```scss
.app-motion-fade-in {
  animation: app-fade-in var(--app-motion-duration-normal) var(--app-motion-ease-standard);
}

.app-motion-slide-up-soft {
  animation: app-slide-up-soft var(--app-motion-duration-normal) var(--app-motion-ease-emphasis);
}

.app-motion-press {
  transition:
    transform var(--app-motion-duration-fast) var(--app-motion-ease-standard),
    box-shadow var(--app-motion-duration-fast) var(--app-motion-ease-standard);
}

@keyframes app-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes app-slide-up-soft {
  from {
    opacity: 0;
    transform: translateY(var(--app-motion-distance-sm));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 4: 验证基础层通过**

Run: `npm run lint`
Expected: PASS（无 eslint 错误）

**Step 5: Commit**

```bash
git add quasar.config.ts src/css/design-tokens.scss src/css/app.scss
git commit -m "feat(animation): add global motion foundation and quasar animation presets"
```

---

### Task 2: 收敛 Auth 骨架与弹窗过渡

**Files:**
- Modify: `src/components/auth/AuthSplitLayout.vue:88-105`
- Modify: `src/components/common/AgreementDialog.vue:2-8`
- Test: `src/pages/LoginPage.vue`, `src/pages/RegisterPage.vue`, `src/pages/ForgotPasswordPage.vue`

**Step 1: 写“失败”验证（手测）**

```md
- [ ] Auth 入场动画位移从 20px 降到 <=12px
- [ ] 协议弹窗 show/hide 与其他认证弹窗节奏一致
```

**Step 2: 运行页面基线，确认当前不满足**

Run: `npm run dev`
Expected: Auth 入场仍较重（20px / 0.6s），弹窗节奏未统一。

**Step 3: 实现最小改造**

1) `AuthSplitLayout.vue` 调整 keyframes 和时长：

```scss
.workspace-content-wrapper {
  animation: auth-workspace-enter var(--app-motion-duration-slow) var(--app-motion-ease-emphasis);
}

@keyframes auth-workspace-enter {
  from {
    opacity: 0;
    transform: translateY(var(--app-motion-distance-md));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

2) `AgreementDialog.vue` 统一弹窗过渡（示例）：

```vue
<q-dialog
  :model-value="modelValue"
  transition-show="fade"
  transition-hide="fade"
>
```

**Step 4: 验证通过**

Run: `npm run lint`
Expected: PASS

手测预期：登录/注册/找回进入更稳，协议弹窗显隐不突兀。

**Step 5: Commit**

```bash
git add src/components/auth/AuthSplitLayout.vue src/components/common/AgreementDialog.vue
git commit -m "refactor(animation): soften auth entrance and unify agreement dialog transitions"
```

---

### Task 3: 登录/注册/找回页面级动画统一

**Files:**
- Modify: `src/pages/LoginPage.vue`
- Modify: `src/pages/RegisterPage.vue`
- Modify: `src/pages/ForgotPasswordPage.vue`
- Optional Modify: `src/css/auth.scss`（如需集中通用动效类）
- Test: `npm run lint`

**Step 1: 写“失败”验证（手测）**

```md
- [ ] 登录三通道切换存在统一淡入淡出
- [ ] 注册/找回弹窗节奏与登录一致
- [ ] Auth 主按钮 hover/active 节奏一致
```

**Step 2: 确认当前失败**

Run: `npm run dev`
Expected: 登录三通道切换缺少统一容器过渡或节奏不一致。

**Step 3: 最小实现（示例骨架）**

1) 登录页三通道外层增加 transition：

```vue
<transition name="auth-form-switch" mode="out-in">
  <q-form v-if="loginType === 'email'" key="email" ... />
  <q-form v-else-if="loginType === 'phone'" key="phone" ... />
  <q-form v-else key="employee" ... />
</transition>
```

2) 对应样式：

```scss
.auth-form-switch-enter-active,
.auth-form-switch-leave-active {
  transition:
    opacity var(--app-motion-duration-normal) var(--app-motion-ease-standard),
    transform var(--app-motion-duration-normal) var(--app-motion-ease-standard);
}

.auth-form-switch-enter-from,
.auth-form-switch-leave-to {
  opacity: 0;
  transform: translateY(var(--app-motion-distance-xs));
}
```

3) 统一主按钮微交互（仅 transform/box-shadow/filter）。

**Step 4: 验证通过**

Run: `npm run lint`
Expected: PASS

手测：登录/注册/找回切换连续，按钮反馈一致。

**Step 5: Commit**

```bash
git add src/pages/LoginPage.vue src/pages/RegisterPage.vue src/pages/ForgotPasswordPage.vue src/css/auth.scss
git commit -m "feat(animation): unify auth page transitions and button micro-interactions"
```

---

### Task 4: 仪表盘动效优化（移除 transition: all）

**Files:**
- Modify: `src/pages/DashboardPage.vue:647,667,696,734,806,833` 及相关 hover 区块
- Test: `npm run lint`

**Step 1: 写“失败”验证**

```md
- [ ] Dashboard 关键卡片不再使用 transition: all
- [ ] hover 位移不超过 2px
- [ ] 卡片、列表、快速入口节奏一致
```

**Step 2: 执行失败确认**

Run: `npm run dev`
Expected: 现有样式存在 `transition: all`，且多个模块节奏不同。

**Step 3: 最小实现**

将典型写法：

```scss
transition: all 0.2s ease;
```

替换为：

```scss
transition:
  transform var(--app-motion-duration-normal) var(--app-motion-ease-standard),
  box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-standard),
  border-color var(--app-motion-duration-normal) var(--app-motion-ease-standard),
  background-color var(--app-motion-duration-normal) var(--app-motion-ease-standard);
```

并统一 hover 位移：

```scss
transform: translateY(-2px);
```

**Step 4: 验证通过**

Run: `npm run lint`
Expected: PASS

手测：Dashboard 卡片动效更稳，无突兀抖动。

**Step 5: Commit**

```bash
git add src/pages/DashboardPage.vue
git commit -m "refactor(animation): replace all-transitions with property-scoped motion in dashboard"
```

---

### Task 5: 上传页状态流动画统一

**Files:**
- Modify: `src/pages/UploadPage.vue:15,82,149,213,617,661-668`
- Test: `npm run lint`

**Step 1: 写“失败”验证**

```md
- [ ] Upload 页多个 fade 过渡时长一致
- [ ] 上传区三态切换仅变色/阴影/透明度，无大位移
- [ ] 弹层 show/hide 节奏与 Auth 域一致
```

**Step 2: 失败确认**

Run: `npm run dev`
Expected: fade 与局部过渡参数存在分散写法。

**Step 3: 最小实现**

统一 `fade` 过渡：

```scss
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--app-motion-duration-normal) var(--app-motion-ease-standard);
}
```

上传区交互改为精确属性：

```scss
.upload-zone {
  transition:
    border-color var(--app-motion-duration-normal) var(--app-motion-ease-standard),
    background-color var(--app-motion-duration-normal) var(--app-motion-ease-standard),
    box-shadow var(--app-motion-duration-normal) var(--app-motion-ease-standard);
}
```

必要弹层补齐统一 `transition-show/hide`。

**Step 4: 验证通过**

Run: `npm run lint`
Expected: PASS

手测：上传中、预览、患者信息区切换节奏一致。

**Step 5: Commit**

```bash
git add src/pages/UploadPage.vue
git commit -m "feat(animation): unify upload flow transitions and state-motion rhythm"
```

---

### Task 6: 统一回归与收口（仅前端）

**Files:**
- Modify: `src/pages/LoginPage.vue`（若有漏网局部）
- Modify: `src/pages/RegisterPage.vue`（若有漏网局部）
- Modify: `src/pages/ForgotPasswordPage.vue`（若有漏网局部）
- Modify: `src/pages/DashboardPage.vue`（若有漏网局部）
- Modify: `src/pages/UploadPage.vue`（若有漏网局部）
- Optional Modify: `src/css/auth.scss`, `src/css/app.scss`
- Test: `npm run lint`, `npm run dev`

**Step 1: 写最终验收清单（应全部通过）**

```md
- [ ] 高优先页面动效节奏统一（认证/仪表盘/上传）
- [ ] 主交互未出现明显跳动或突兀缩放
- [ ] 目标页面关键区域无 transition: all
- [ ] 深浅色模式下动画行为一致（只换颜色不换节奏）
```

**Step 2: 执行静态校验**

Run: `npm run lint`
Expected: PASS

**Step 3: 执行手工回归**

Run: `npm run dev`
Expected: 目标页面体验符合“医疗稳重”定义。

**Step 4: 记录风险与回滚说明**

在 PR 描述或变更说明中写入：
- 风险点：局部视觉预期变化（尤其 hover 强度）
- 回滚：按页面粒度回滚样式块（Auth / Dashboard / Upload）

**Step 5: Commit**

```bash
git add src/pages/LoginPage.vue src/pages/RegisterPage.vue src/pages/ForgotPasswordPage.vue src/pages/DashboardPage.vue src/pages/UploadPage.vue src/css/auth.scss src/css/app.scss
git commit -m "chore(animation): finalize motion consistency across high-frequency pages"
```

---

## 交付后检查（Definition of Done）

- [ ] 仅前端文件被修改
- [ ] 高优先页面动画节奏一致
- [ ] 无新增后端依赖与后端改动
- [ ] lint 通过
- [ ] 手工回归通过（移动端 + 桌面端）

---

## 风险与回滚（最终版）

### 风险
- 动效收敛后，个别原有“重反馈”交互会更克制，主观感知可能变化。
- 替换 `transition: all` 过程中，可能遗漏个别属性导致局部反馈变弱。

### 回滚策略
- 按页面回滚：`Auth`、`Dashboard`、`Upload` 分域回滚。
- 若全局 token 触发连锁影响，优先回滚 `src/css/design-tokens.scss` 中新增 motion 变量与 `app.scss` 新增通用类。

---

## 执行提示

- 推荐每个 Task 单独提交，便于回滚与 code review。
- 若发现需求变化，优先在本计划上增补一个最小 Task，再执行。
