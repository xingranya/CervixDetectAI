# 前后端联调文档

## 1. 概述

本文档描述了宫颈病变智能风险评估与辅助诊断系统的前后端接口规范、数据结构及联调注意事项。

## 2. 接口规范

### 2.1 基础信息

- **Base URL**: `/api`
- **Backend Server**: `http://localhost:4000`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 2.2 报告中心 (Reports)

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

### 2.3 系统设置 (Settings)

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

### 2.4 数据库监控 (System)

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

1.  **Mock 数据**: 目前后端使用内存 Mock 数据，重启服务器后数据会重置。
2.  **文件上传**: 影像上传接口 `/api/studies/upload` 仅支持 `.jpg`, `.png`, `.dcm` 格式。
3.  **实时同步**:
    - 数据库监控页面每 5 秒轮询一次 `/api/system/db-metrics`。
    - 影像分析进度通过前端模拟轮询实现，实际生产环境应使用 WebSocket。
4.  **错误处理**: 所有 API 均返回标准错误格式 `{ error: string }`，前端需统一处理。

## 5. 测试计划

1.  **单元测试**: 验证各组件渲染及基本交互。
2.  **集成测试**:
    - 验证报告列表筛选功能是否与后端 Mock 数据一致。
    - 验证系统设置修改是否能持久化（内存中）。
    - 验证数据库监控图表是否随时间更新。
3.  **端到端测试**: 模拟完整流程：上传影像 -> 分析 -> 生成报告 -> 查看报告 -> 修改设置。
