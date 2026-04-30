# PDF报告生成说明

> **本文引用的文件**
> - [pdfGenerator.ts](file://src/utils/pdfGenerator.ts)
> - [pdfFonts.ts](file://src/utils/pdfFonts.ts)
> - [ReportsPage.vue](file://src/pages/ReportsPage.vue)
> - [reports.js](file://server/routes/reports.js)
> - [MedicalReport.js](file://server/models/MedicalReport.js)
> - [index.js](file://server/models/index.js)
> - [qwenService.js](file://server/services/qwenService.js)
> - [api.ts](file://src/services/api.ts)
> - [报告管理API.md](file://wiki/后端架构/API端点参考/报告管理API.md)
> - [报告生成服务.md](file://wiki/后端架构/业务逻辑层/报告生成服务.md)

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考量](#性能考量)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件聚焦于“PDF 报告生成”功能，覆盖从前端触发、后端生成、AI分析、数据库落盘到 PDF 下载的完整链路。系统支持两种报告生成路径：
- 在线即时生成：前端直接调用 PDF 工具生成本地 PDF 并自动下载。
- 后端生成并落库：后端基于 AI 分析结果生成结构化报告并持久化，随后可下载。

当前 PDF 输出采用医生归档版结构，统一包含诊断摘要、影像对比、关键指标、可疑区域、患者趋势曲线、临床建议、详细说明、免责声明与页码信息。前端即时导出会额外拉取患者最近 6 次历史分析结果，用于绘制风险趋势；后端生成链路兼容本地影像和图仓远程 URL。

## 项目结构
围绕 PDF 报告生成的关键文件与职责如下：
- 前端
  - ReportsPage.vue / StudyDetailPage.vue / StudiesPage.vue：提供报告生成与下载入口。
  - useStudyReportDownload.ts：统一病例报告下载流程，负责获取病例分析结果与患者历史趋势。
  - pdfGenerator.ts：统一的医生归档版 PDF 报告生成器，负责布局、中文字体、影像对比、趋势图、分页与页脚。
  - pdfFonts.ts：中文字体加载与降级策略。
  - studyAnnotations.ts：统一 AI 可疑区域坐标转换，供页面标注与 PDF 标注复用。
  - api.ts：前端 API 客户端，封装后端接口调用。
- 后端
  - reports.js：报告相关 API（生成、批量导出、查询、下载、分享）。
  - reportGenerator.service.js：服务端 PDF / Word / Excel 报告生成，PDF 支持远程影像 Buffer 嵌入。
  - MedicalReport.js：报告数据模型，含 report_id 自动编号、状态与归档字段。
  - index.js：模型关系定义，明确报告与病例、患者、分析结果的关联。
  - qwenService.js：AI 分析服务，对接通义千问，返回结构化诊断结果。
- Wiki
  - 报告管理API.md：后端接口规范与下载机制说明。
  - 报告生成服务.md：整体架构与流程说明。

```mermaid
flowchart TB
RP["ReportsPage.vue"] --> API["api.ts"]
API --> R["reports.js"]
R --> MR["MedicalReport.js"]
R --> QW["qwenService.js"]
RP --> PG["pdfGenerator.ts"]
PG --> PF["pdfFonts.ts"]
```

图表来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

章节来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L1-L226)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L1-L277)
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L1-L89)
- [reports.js](file://server/routes/reports.js#L1-L488)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

## 核心组件
- 前端 PDF 生成器
  - 职责：接收“病例 + AI 分析结果”数据，动态生成 PDF，自动保存并下载。
  - 特性：A4 页面、中文字体支持、医生归档版首页、影像对比、关键指标表、可疑区域表、患者趋势曲线、分页、页眉页脚、免责声明。
- 患者历史趋势
  - 职责：根据 `patientDbId` 查询最近 6 次历史分析结果，生成风险权重与置信度曲线。
  - 降级：历史接口失败或数据不足时回退为本次检查趋势，不阻断报告导出。
- 影像与标注
  - 职责：原始影像与 AI 标注摘要图并排输出，可疑区域坐标由 `studyAnnotations.ts` 统一转换。
  - 降级：远程或本地影像不可用时输出占位说明，保留结构化报告主体。
- 中文字体支持
  - 职责：优先加载 SimSun；失败则尝试 SourceHanSansSC；均失败则回退至 helvetica 并提示乱码风险。
- 报告路由与模型
  - 路由：提供创建、生成、查询、更新、下载、删除报告的 API。
  - 模型：MedicalReport 定义报告结构、状态、外键关联；report_id 自动生成。
- AI 分析服务
  - 职责：将图像转为 Base64，调用通义千问 API，解析并标准化返回结果。
- 前端报告页面
  - 职责：拉取已完成的病例与分析结果，触发 PDF 生成与下载。

章节来源
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)

## 架构总览
PDF 报告生成涉及两条主线：
- 在线即时生成（前端直连 PDF 工具）
- 后端生成落库（后端生成 JSON 报告并持久化）

```mermaid
sequenceDiagram
participant U as 用户
participant UI as ReportsPage
participant API as api
participant R as reports
participant M as MedicalReport
participant Q as qwenService
participant PDF as pdfGenerator
Note over UI,PDF : 前端即时生成PDF
U->>UI : 点击下载报告
UI->>API : 获取病例与分析数据
API-->>UI : 返回 study + result
UI->>PDF : generatePDFReport
PDF-->>U : 下载本地PDF
Note over R,M : 后端生成并落库
U->>UI : 点击生成并下载
UI->>API : 调用 /reports/generate
API->>R : POST /reports/generate
R->>Q : 获取最新分析结果
Q-->>R : 返回结构化结果
R->>M : 创建 MedicalReport 记录
M-->>R : 返回报告
R-->>UI : 返回报告
UI->>API : 调用 /reports/:id/download
API->>R : GET /reports/:id/download
R-->>UI : 返回PDF文件流
```

图表来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [api.ts](file://src/services/api.ts#L288-L298)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)

## 详细组件分析

### 前端即时 PDF 生成流程
- 触发：用户在病例详情页或病例列表点击 PDF 导出。
- 数据准备：调用 `/api/analyze/study/:studyId` 获取病例、影像、诊断结果、风险等级、可疑区域与生物标志物。
- 趋势补充：若返回 `patientDbId`，调用患者洞察历史接口获取最近 6 次分析趋势。
- 生成与下载：动态导入 pdfGenerator.ts，传入 study、result、history，生成并自动保存 PDF。

```mermaid
flowchart TD
Start(["点击导出 PDF"]) --> Fetch["获取病例与分析数据"]
Fetch --> HasResult{"存在分析结果?"}
HasResult --> |否| Warn["提示暂无可生成报告"]
HasResult --> |是| History["尝试获取患者历史趋势"]
History --> Gen["调用 generatePDFReport(study,result,history)"]
Gen --> Save["自动保存PDF"]
Save --> End(["完成"])
Warn --> End
```

图表来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)

章节来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)

### 后端生成与下载流程
- 生成：POST /api/reports/generate，校验权限与分析结果，调用 `reportGenerator.service.js` 生成文件，创建 MedicalReport 记录。
- 下载：GET /api/reports/:id/download，校验权限与文件存在性，设置 Content-Type 与 Content-Disposition，返回 PDF 文件流。
- 批量：POST /api/reports/batch-export 支持将多份 PDF 打包为 ZIP，并写入导出摘要。

### 医生归档版 PDF 内容结构

| 模块 | 说明 |
| :--- | :--- |
| 首页摘要 | 诊断结论、风险等级、置信度、检查日期、检查方式 |
| 影像对比 | 原始影像与 AI 标注摘要图并排展示 |
| 关键指标 | 患者编号、检查方式、诊断结论、风险等级、置信度、生物标志物 |
| 可疑区域明细 | 序号、描述、位置、特征 |
| 患者趋势曲线 | 最近 6 次风险权重与置信度变化 |
| 临床建议 | AI 分析返回的建议列表，缺失时给出保守复查建议 |
| 详细说明 | Markdown 详细报告转纯文本分段渲染 |
| 免责声明 | 强调 AI 辅助筛查属性，不替代执业医师诊断 |

```mermaid
sequenceDiagram
participant C as "客户端"
participant R as "reports.js"
participant M as "MedicalReport.js"
participant Q as "qwenService.js"
C->>R : POST /reports/generate
R->>Q : 获取最新分析结果
Q-->>R : 返回结构化结果
R->>M : 创建报告记录
M-->>R : 返回报告
R-->>C : 201 成功
C->>R : GET /reports/ : id/download
R-->>C : 返回PDF文件流
```

图表来源
- [reports.js](file://server/routes/reports.js#L90-L201)
- [reports.js](file://server/routes/reports.js#L387-L437)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

章节来源
- [reports.js](file://server/routes/reports.js#L90-L201)
- [reports.js](file://server/routes/reports.js#L387-L437)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

### 报告模型与外键关系
- MedicalReport 与 Study、Patient、AnalysisResult 存在外键关联，确保报告与病例、患者、分析结果的强绑定。
- report_id 自动生成，避免重复与冲突。

```mermaid
erDiagram
STUDY {
bigint id PK
bigint patient_id FK
bigint user_id FK
}
PATIENT {
bigint id PK
string patient_id UK
}
ANALYSIS_RESULT {
bigint id PK
bigint study_id FK
}
MEDICAL_REPORT {
bigint id PK
string report_id UK
bigint study_id FK
bigint patient_id FK
bigint analysis_result_id FK
enum status
}
STUDY ||--o{ MEDICAL_REPORT : "包含"
PATIENT ||--o{ MEDICAL_REPORT : "包含"
ANALYSIS_RESULT ||--o{ MEDICAL_REPORT : "生成"
```

图表来源
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)

章节来源
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)

### 中文字体加载与降级策略
- 优先加载 SimSun；若失败尝试 SourceHanSansSC；最终回退 helvetica 并输出警告，避免中文乱码。

```mermaid
flowchart TD
S["尝试加载 SimSun"] --> OK1{"加载成功?"}
OK1 --> |是| UseSimSun["设置字体为 SimSun"]
OK1 --> |否| TrySC["尝试加载 SourceHanSansSC"]
TrySC --> OK2{"加载成功?"}
OK2 --> |是| UseSC["设置字体为 SourceHanSansSC"]
OK2 --> |否| Fallback["回退 helvetica 并警告"]
UseSimSun --> End(["完成"])
UseSC --> End
Fallback --> End
```

图表来源
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)

章节来源
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)

## 依赖分析
- 前端
  - StudyDetailPage.vue / StudiesPage.vue 通过 useStudyReportDownload.ts 获取病例分析与患者历史趋势，依赖 pdfGenerator.ts 生成即时 PDF。
  - pdfGenerator.ts 依赖 pdfFonts.ts 提供中文字体，依赖 studyAnnotations.ts 统一可疑区域坐标转换。
- 后端
  - reports.js 依赖 MedicalReport 模型、Study/Patient/AnalysisResult 关联、qwenService.js。
  - MedicalReport.js 通过 index.js 建立与 Study、Patient、AnalysisResult 的关系。
- 外部依赖
  - qwenService.js 依赖 axios 与通义千问 API，受环境变量控制。

```mermaid
flowchart LR
RP["ReportsPage.vue"] --> API["api.ts"]
RP --> PG["pdfGenerator.ts"]
PG --> PF["pdfFonts.ts"]
R["reports.js"] --> MR["MedicalReport.js"]
R --> QW["qwenService.js"]
MR --> IDX["index.js"]
```

图表来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [api.ts](file://src/services/api.ts#L288-L298)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

章节来源
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)
- [api.ts](file://src/services/api.ts#L288-L298)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)
- [pdfFonts.ts](file://src/utils/pdfFonts.ts#L10-L75)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [index.js](file://server/models/index.js#L1-L79)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)

## 性能考量
- AI 分析调用
  - qwenService.js 内置最多 3 次重试与递增延迟策略，降低网络波动与限流影响。
- 数据库查询
  - MedicalReport、Study 等模型在关键字段建立索引，提升查询效率。
- 报告内容存储
  - 报告内容以 JSON 字符串形式存储，避免复杂 JOIN，提高读取性能。
- PDF 生成
  - 前端即时导出用于快速下载；后端生成用于报告中心、批量导出和归档落库。
  - 影像加载支持图仓远程 URL，失败时使用占位说明，避免整份报告生成失败。

章节来源
- [qwenService.js](file://server/services/qwenService.js#L194-L251)
- [MedicalReport.js](file://server/models/MedicalReport.js#L117-L147)
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)

## 故障排查指南
- 前端下载失败
  - 确认已获取到分析结果；若无结果，前端会提示“暂无可生成报告”。
  - 若 PDF 未生成，检查后端生成接口是否成功创建 MedicalReport 记录。
- 后端下载失败
  - 检查 /api/reports/:id/download 是否返回“报告不存在/PDF 未生成/文件不存在”。
  - 确认 MedicalReport 记录中的 `file_path` 存在且服务器文件系统可读取。
- AI 分析失败
  - 检查 QWEN_API_KEY、QWEN_API_URL 环境变量是否配置正确。
  - 查看 qwenService.js 的错误日志，区分网络超时、API 限流、服务不可用等情况。
- 权限问题
  - 非管理员仅能操作自己的报告；若返回 403，请确认登录用户与报告生成人匹配。

章节来源
- [reports.js](file://server/routes/reports.js#L387-L437)
- [reports.js](file://server/routes/reports.js#L90-L201)
- [qwenService.js](file://server/services/qwenService.js#L1-L255)
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L103-L148)

## 结论
本系统提供了两条高效稳定的 PDF 报告生成路径：前端即时生成与后端生成落库。前端 PDF 工具与中文字体加载策略确保中文显示质量；后端通过严格的权限校验、AI 分析服务与结构化报告模型，保障报告的准确性与可追溯性。整体架构清晰、扩展性强，满足临床场景下的报告生成与分发需求。

## 附录
- 接口参考（节选）
  - 创建报告：POST /api/reports
  - 自动生成报告：POST /api/reports/generate
  - 获取报告列表：GET /api/reports
  - 获取报告详情：GET /api/reports/:id
  - 更新报告：PUT /api/reports/:id
  - 下载报告 PDF：GET /api/reports/:id/download
  - 删除报告：DELETE /api/reports/:id

章节来源
- [报告管理API.md](file://wiki/后端架构/API端点参考/报告管理API.md#L87-L149)
- [报告管理API.md](file://wiki/后端架构/API端点参考/报告管理API.md#L293-L342)
- [报告生成服务.md](file://wiki/后端架构/业务逻辑层/报告生成服务.md#L27-L121)
