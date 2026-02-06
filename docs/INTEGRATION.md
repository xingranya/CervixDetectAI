# 前后端联调文档

## 1. 概述

本文档描述了宫颈病变智能风险评估与辅助诊断系统的前后端接口规范、数据结构及联调注意事项。

## 2. 接口规范

### 2.1 基础信息

- **Base URL**: `/api`
- **Backend Server**: `http://localhost:4000`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 2.2 现状与偏差说明（必读）

- **真实已联通的核心链路**：
  - **病例管理链路**：`POST /api/studies` → `POST /api/studies/:id/images` → `POST /api/analysis-tasks`
  - **快捷上传链路**（UploadPage 使用）：`POST /api/analyze`（可匿名）→ `GET /api/analyze/:taskId` 轮询
- **当前仍为演示/Mock 的模块**：
  - **报告中心**：后端 `server/routes/reports.js` 为 Mock 数据；前端 PDF 由 `src/utils/pdfGenerator.ts`（`html2canvas + jspdf`）在浏览器端生成。
  - **系统设置**：`/api/settings/*` 为演示数据，不保证持久化。
- **统一返回格式**：后端多数接口返回 `{ success: boolean, message?: string, data?: any, error?: string }`，不使用 `{ error: string }` 单一格式。

### 2.3 报告中心 (Reports)（当前为 Mock）

#### 获取报告列表

- **Endpoint**: `GET /reports`
- **Query Params**:
  - `patient`: string (可选，患者姓名或ID)
  - `riskLevel`: string (可选，low/medium/high)
  - `status`: string (可选，completed/pending/draft)
- **Response**: `Report[]`

#### 获取报告详情

- **Endpoint**: `GET /reports/:id`
- **Response**: `Report`

#### 更新报告

- **Endpoint**: `PUT /reports/:id`
- **Body**: `Partial<Report>`
- **Response**: `Report`

### 2.4 系统设置 (Settings)（当前为演示数据）

#### 获取用户列表

- **Endpoint**: `GET /settings/users`
- **Response**: `User[]`

#### 添加用户

- **Endpoint**: `POST /settings/users`
- **Body**: `{ name: string, role: string }`
- **Response**: `User`

#### 获取系统参数

- **Endpoint**: `GET /settings/params`
- **Response**: `SystemParams`

#### 更新系统参数

- **Endpoint**: `PUT /settings/params`
- **Body**: `Partial<SystemParams>`
- **Response**: `SystemParams`

#### 获取系统日志

- **Endpoint**: `GET /settings/logs`
- **Response**: `LogEntry[]`

#### 获取AI模型信息

- **Endpoint**: `GET /settings/ai-model`
- **Response**: `AIModelInfo`

### 2.5 数据库监控 (System)

#### 获取数据库指标

- **Endpoint**: `GET /system/db-metrics`
- **Response**: `DbMetrics`

## 3. 数据结构

### Report

```typescript
interface Report {
  id: string;
  patientName: string;
  age: number;
  patientId: string;
  date: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'completed' | 'pending' | 'draft';
  confidence: number;
  acetowhite: string;
  iodine: string;
  lesionArea: string;
  recommendation: string;
}
```

### User

```typescript
interface User {
  id: number;
  name: string;
  role: 'admin' | 'senior' | 'doctor' | 'viewer';
  status: 'active' | 'inactive';
}
```

### SystemParams

```typescript
interface SystemParams {
  lowRiskThreshold: number;
  highRiskThreshold: number;
  includeSummary: boolean;
  includeFollowUp: boolean;
  requireReview: boolean;
  analysisMode: 'high' | 'balanced' | 'fast';
  saveIntermediate: boolean;
  diagnosticStandard: 'who2020' | 'asccp2019' | 'custom';
}
```

### DbMetrics

```typescript
interface DbMetrics {
  healthScore: number;
  qps: number;
  avgResponseTime: number;
  errorRate: number;
  poolStats: {
    size: number;
    available: number;
    borrowed: number;
    pending: number;
  };
  slowQueries: Array<{
    sql: string;
    duration: number;
    timestamp: number;
  }>;
  queryTimeHistory: Array<{
    time: string;
    duration: number;
  }>;
}
```

## 4. 联调注意事项

1.  **Mock 数据**: 目前后端仅 `reports/settings` 使用 Mock/演示数据；`patients/studies/analysis-tasks` 等为数据库数据。
2.  **文件上传**:
    - 病例影像上传：`POST /api/studies/:id/images`（保存到 `server/uploads/studies/`）
    - 快捷上传：`POST /api/analyze`（保存到 `server/uploads/`）
3.  **实时同步**:
    - 数据库监控页面每 5 秒轮询一次 `/api/system/db-metrics`。
    - 影像分析进度通过前端模拟轮询实现，实际生产环境应使用 WebSocket。
4.  **错误处理**: 推荐以 `success=false` 与 `message/error` 字段为准，前端统一提示即可。

## 5. 测试计划

1.  **单元测试**: 验证各组件渲染及基本交互。
2.  **集成测试**:
    - 验证报告列表筛选功能是否与后端 Mock 数据一致。
    - 验证系统设置修改是否能持久化（内存中）。
    - 验证数据库监控图表是否随时间更新。
3.  **端到端测试**: 模拟完整流程：上传影像 -> 分析 -> 生成报告 -> 查看报告 -> 修改设置。
