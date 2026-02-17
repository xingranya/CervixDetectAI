# CervixDetectAI 动画优化设计（方案 A）

- 日期：2026-02-17
- 设计目标：基于 Quasar 动画能力优化现有 Vue3 + Quasar 项目动画体验
- 范围：仅前端，不改后端
- 优先页面：登录/注册/找回、仪表盘、上传页
- 设计风格：医疗稳重（短时长、低位移、弱弹性）
- 用户决策：忽略系统 `prefers-reduced-motion`，统一动画策略

---

## 1. 背景与问题

当前项目动画存在以下问题：

1. **全局缺少统一动画基线**：`quasar.config.ts` 当前 `animations: []`，页面使用的动画方式不统一。
2. **局部写法分散**：存在手写 keyframes、局部 transition、Quasar transition-show/hide 混用。
3. **维护成本偏高**：同类交互在不同页面节奏不一致。
4. **性能隐患**：部分页面使用 `transition: all`，可能触发不必要的重排与重绘。

---

## 2. 目标与非目标

### 2.1 目标

- 建立统一动画设计令牌（时长、缓动、位移）
- 在高频页面形成一致的动效节奏与视觉语言
- 优先保证稳定、清晰、专业的医疗产品气质
- 降低后续维护成本（复用类 + 统一配置）

### 2.2 非目标

- 不做后端改动
- 不引入大型第三方动画库
- 不做重度品牌级复杂时间线（本轮以稳定可维护为先）

---

## 3. 备选方案与结论

### 方案 A（推荐，已选）
**统一动画令牌 + 关键页面分层改造**

- 先构建 Foundation（配置 + token + 通用类）
- 再覆盖认证域、仪表盘、上传页
- 优点：统一、可维护、风险可控、收益高

### 方案 B
**只做高频页面局部提质**

- 优点：快
- 缺点：长期维护差，风格易继续分裂

### 方案 C
**重度动画体系**

- 优点：表现力强
- 缺点：实施和回归成本高，不适合当前阶段

**最终选择：方案 A**

---

## 4. 动画架构设计（Foundation）

### 4.1 Quasar 动画按需启用

在 `quasar.config.ts` 从 `animations: []` 调整为按需动画列表（不启用 `all`）。

原则：仅保留项目实用动画族（进入/退出/缩放/淡入淡出），兼顾包体和可维护性。

### 4.2 设计令牌（Design Tokens）

在 `src/css/design-tokens.scss` 新增动画变量：

- `--app-motion-duration-fast: 140ms`
- `--app-motion-duration-normal: 220ms`
- `--app-motion-duration-slow: 320ms`
- `--app-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1)`
- `--app-motion-ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1)`
- `--app-motion-distance-xs: 4px`
- `--app-motion-distance-sm: 8px`
- `--app-motion-distance-md: 12px`

### 4.3 通用动画类（Utilities）

在全局样式中新增可复用类：

- `.app-motion-fade-in`
- `.app-motion-slide-up-soft`
- `.app-motion-press`
- `.app-motion-hover-lift`

并约束：禁止新增 `transition: all`，改为精确属性过渡。

---

## 5. 页面级策略

## 5.1 登录 / 注册 / 找回（Auth 域）

- 入口动画统一：
  - 由 `AuthSplitLayout` 承担工作区入场
  - 调整为低位移（8~12px）+ 短时长（220~280ms）
- 表单切换统一：
  - 登录三通道切换采用容器级淡入淡出（`mode="out-in"`）
- 弹窗过渡统一：
  - 协议弹窗、短信图形验证、邮箱验证码弹窗统一 show/hide 节奏
- 按钮反馈统一：
  - hover 为轻提亮 + 阴影变化
  - active 为轻压（≤1px）

## 5.2 仪表盘（Dashboard）

- 将卡片/列表项的 `transition: all` 改为精确属性
- 分组入场（欢迎区、统计区、任务区、快速入口）采用轻量 stagger
- hover 位移上限 2px，保持“稳重”
- 暗色模式复用同一动画节奏，仅切换色值与阴影强度

## 5.3 上传页（Upload）

- 统一现有 `fade` 过渡的时长与 easing
- 上传状态流三态统一（default/drag-active/has-file）
- 上传进度、预览切换采用轻淡入，不做弹跳
- 日期等弹出层统一 transition-show/hide 规范

---

## 6. 组件级规范

### 6.1 弹窗类组件（q-dialog / q-popup-proxy）

- 统一采用 fade + 轻 scale
- 时长区间 180~220ms
- 统一显隐体验，减少“每个弹窗都不一样”的观感

### 6.2 按钮与卡片

- 主按钮：hover 提亮、active 轻压
- 卡片：hover 轻抬升 + 阴影层级变化
- 禁止强缩放、强弹性、强旋转

### 6.3 列表与状态切换

- 统一淡入淡出
- 同一元素同一时刻只保留一个主动画

---

## 7. 性能与工程约束

1. 优先使用合成层友好属性：`transform`、`opacity`
2. 避免布局属性动画：`top/left/width/height`
3. 谨慎使用 `box-shadow`（短时长，避免频繁大范围变化）
4. 除必要加载态外，不新增无限循环动画
5. 移动端降低阴影和位移幅度，优先稳定帧率

---

## 8. 可访问性策略

按用户确认：

- 本轮忽略系统 `prefers-reduced-motion`
- 全端统一动画策略

> 备注：后续可在设置页增加“低动态模式”开关，作为可选增强项。

---

## 9. 验证标准（验收）

1. 认证域（登录/注册/找回）动画节奏一致，深浅色表现一致
2. 仪表盘 hover 与入场动效统一，无突兀跳动
3. 上传页状态切换（上传中/预览/弹出层）节奏一致
4. `npm run lint` 通过
5. 移动端（<=600）与桌面端（>=1024）手工回归无明显卡顿

---

## 10. 风险与回滚

### 风险

- 局部页面可能出现视觉回归（节奏变化导致主观感知变化）
- 替换 `transition: all` 后，个别交互可能遗漏属性

### 回滚策略

- 按文件粒度回滚（优先页面样式块）
- 保留 Foundation 改造，先恢复关键页面视觉可用，再二次微调

---

## 11. 实施顺序（高层）

1. Foundation：Quasar 动画配置 + motion tokens + 通用类
2. Auth 域：登录/注册/找回统一节奏
3. Dashboard：替换 all + 分组入场 + hover 统一
4. Upload：状态流与弹层过渡统一
5. 验证与微调

---

## 12. 关键文件清单（预期）

- `quasar.config.ts`
- `src/css/design-tokens.scss`
- `src/css/app.scss`
- `src/components/auth/AuthSplitLayout.vue`
- `src/components/common/AgreementDialog.vue`
- `src/pages/LoginPage.vue`
- `src/pages/RegisterPage.vue`
- `src/pages/ForgotPasswordPage.vue`
- `src/pages/DashboardPage.vue`
- `src/pages/UploadPage.vue`
