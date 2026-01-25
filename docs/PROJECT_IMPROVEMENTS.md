# CervixDetectAI 项目改进指南

> 生成时间: 2025-01-25
> 项目性质: 演示项目 (非生产环境)

---

## 目录

- [一、前端架构问题](#一前端架构问题)
- [二、后端架构问题](#二后端架构问题)
- [三、代码质量问题](#三代码质量问题)
- [四、配置与依赖问题](#四配置与依赖问题)
- [五、代码优化方案](#五代码优化方案)
- [六、改进路线图](#六改进路线图)

---

## 一、前端架构问题

### 1.1 Store 数据重叠问题 ⚠️

**位置**: `src/stores/studyStore.ts` 和 `src/stores/analysisStore.ts`

**问题**:
- 两个 Store 在"分析结果"数据上存在重叠
- 更新 `analysisStore` 时需同步更新 `studyStore`
- 可能导致数据不一致

**当前架构**:
```
studyStore
├── studies: Study[]
├── currentStudy: Study | null
└── status: 'pending' | 'analyzing' | 'completed'

analysisStore
├── currentTask: AnalysisTask | null
├── currentResult: AnalysisResult | null
├── status: 'idle' | 'polling' | 'completed'  ← 重叠
└── pollingInterval: number
```

**解决方案 A: 统一数据源**
```typescript
// analysisStore 仅负责轮询，完成后更新 studyStore
async onComplete(result: AnalysisResult) {
  const studyStore = useStudyStore()
  studyStore.updateStudyAnalysis(result.studyId, result)
}
```

**解决方案 B: 发布订阅模式**
```typescript
// 使用 mitt 事件总线
eventBus.emit('analysis:completed', { studyId, result })
```

**优先级**: 🟡 中

---

### 1.2 组件耦合问题

**位置**: `src/components/studies/ImageAnalyzer.vue`

**问题**: 与 `analysisStore` 存在强耦合，降低可测试性

**解决方案**: 通过 Props 传递状态

**优先级**: 🟢 低

---

### 1.3 路由跳转方式

**位置**: `src/services/api.ts`

**问题**: 使用 `window.location.href` 而非 Vue Router

**解决方案**: 使用 `router.push({ path: '/login' })`

**优先级**: 🟢 低

---

## 二、后端架构问题

### 2.1 缺少输入验证中间件

**位置**: `server/routes/*.js`

**解决方案**: 可选引入 Joi 或 Zod 进行参数校验

**优先级**: 🟢 低 (演示项目可忽略)

---

### 2.2 缺少结构化日志

**当前**: 使用 `console.log`

**解决方案**: 可选引入 winston 或 pino

**优先级**: 🟢 低 (演示项目可忽略)

---

### 2.3 后端使用 JavaScript 而非 TypeScript

**解决方案**: 如需长期维护，可逐步迁移至 TypeScript

**优先级**: 🟢 低 (工作量大)

---

## 三、代码质量问题

### 3.1 API 服务层类型安全

**位置**: `src/services/api.ts`

**问题**: 使用 `any` 类型，禁用了 ESLint 检查

**解决方案**: 定义精确的接口类型

**优先级**: 🟢 低

---

### 3.2 缺少全局错误 UI 提示

**解决方案**: 在响应拦截器中添加 Quasar Notify

**优先级**: 🟢 低

---

## 四、配置与依赖问题

| 问题 | 当前状态 | 建议 |
|------|----------|------|
| Axios 版本较低 | 1.2.1 | 可选升级到 1.7+ |
| 前端包体积过大 | 1600KB | 可选使用 manualChunks 拆包 |

---

## 五、代码优化方案

### 5.1 高优先级任务

| 任务 | 描述 | 预计效果 |
|------|------|----------|
| 统一 API 配置 | 合并三个重复的 axios 配置 | 减少代码重复 |
| 重构 authStore | 使用辅助方法消除重复代码 | 代码更简洁 |
| 统一错误处理 | 创建 errorHandler 工具 | 错误处理一致 |

### 5.2 中优先级任务

| 任务 | 描述 | 预计效果 |
|------|------|----------|
| 统一类型定义 | 创建 `src/types/` 目录 | 类型安全 |
| 共享工具函数 | storage.ts, mappers.ts | 代码复用 |
| 减少代码嵌套 | 使用提前返回 | 可读性提升 |

### 5.3 低优先级任务

| 任务 | 描述 | 预计效果 |
|------|------|----------|
| 添加 JSDoc 文档 | 为核心函数添加注释 | 便于维护 |
| 组件拆分 | 拆分大型组件 | 可维护性 |

---

## 六、改进路线图

### 如果需要继续开发

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P1 | Store 数据同步问题 | ⬜ |
| P2 | 统一 API 配置 | ⬜ |
| P2 | 统一类型定义 | ⬜ |
| P3 | 后端 TypeScript 迁移 | ⬜ |
| P3 | 组件解耦 | ⬜ |

### 如果要上线生产环境

需要额外处理:
- 静态资源鉴权
- 患者数据权限隔离
- Token 安全存储
- 安全响应头
- 输入验证
- 结构化日志

---

## 附录：相关文件索引

| 问题类别 | 相关文件 |
|---------|---------|
| Store 数据重叠 | `src/stores/studyStore.ts`, `src/stores/analysisStore.ts` |
| API 类型 | `src/services/api.ts` |
| 认证逻辑 | `src/stores/authStore.ts` |

---

**最后更新**: 2025-01-25
