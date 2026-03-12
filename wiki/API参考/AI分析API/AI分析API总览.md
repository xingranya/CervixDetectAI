# AI分析API总览

> **本文档引用文件**
> - [analyze.js](file://server/routes/analyze.js)
> - [analysis-tasks.js](file://server/routes/analysis-tasks.js)
> - [studyImageStorage.service.js](file://server/services/studyImageStorage.service.js)
> - [qwenService.js](file://server/services/qwenService.js)

## 简介

当前 AI 分析链路已经演进为“双路径兼容”：

- 优先使用图仓远程 URL
- 图仓不可用时回退本地绝对路径
- `qwenService` 同时支持 HTTP URL 与本地文件 Base64 转换

## 核心接口

- `POST /api/analyze`
  - 上传单张图像并创建任务
  - 文件会先进入临时目录，再持久化为病例影像
- `POST /api/analysis-tasks`
  - 基于已有病例创建单任务
  - 触发分析前会解析主图或最新图
- `POST /api/analysis-tasks/batch`
  - 批量上传并创建任务
  - 支持部分成功

## 分析前准备流程

```mermaid
flowchart TD
  A[获取 StudyImage] --> B{file_path 是否远程 URL?}
  B -->|是| C[直接返回 imagePath]
  B -->|否| D[尝试 syncStudyImageToTucang]
  D --> E{同步成功?}
  E -->|是| F[返回远程 URL]
  E -->|否| G[回退本地绝对路径]
  C --> H[qwenService.analyzeImage]
  F --> H
  G --> H
```

## 通义千问输入策略

当前 `qwenService` 的输入规则：

- 远程 URL：直接以 `image_url` 方式提交
- 本地文件：读取后转为 Base64 Data URL 再提交

```js
const imageDataUrl = isHttpUrl(imagePath) ? imagePath : await this.imageToBase64(imagePath);
```

## 接口行为说明

### POST /api/analyze

- 校验文件与患者字段
- 创建患者、病例、影像、任务
- 返回成功后异步触发分析
- 分析前会执行 `prepareStudyImageForAnalysis(...)`

### POST /api/analysis-tasks

- 基于现有病例触发单任务
- 优先选择主图，若没有主图则回退最新上传图
- 若没有可分析影像，任务会直接标记失败

### POST /api/analysis-tasks/batch

- 每张图片独立事务
- 单条失败不会阻断整个批次
- 批量结果可同时包含成功项与失败项

## 状态口径

- 允许状态：`PENDING`、`PROCESSING`、`SUCCESS`、`FAILED`
- 历史兼容状态会在查询或更新时做归一化处理

## 进度与终态语义

- `progress` 在 `0-85%` 区间表示阶段性估算进度，用于反馈“图像预处理 / AI 推理 / 报告生成”等阶段
- `SUCCESS / FAILED` 为真实终态，前端应以状态字段作为最终结果判断依据
- 后端默认增加 `180000ms` 分析超时保护，超时后任务会统一收口为 `FAILED`
- `POST /api/analyze`、`POST /api/analysis-tasks`、`POST /api/analysis-tasks/batch` 已统一失败收口逻辑，不再出现“后台异常只打印日志但任务仍停留处理中”的旧行为

```mermaid
flowchart LR
  A[PENDING] --> B[PROCESSING]
  B --> C[progress 0-85 阶段估算]
  C --> D{模型返回?}
  D -->|成功| E[SUCCESS 100%]
  D -->|超时/异常| F[FAILED]
```

## 响应解析与稳定性补充

- `qwenService` 现在会先去除 Markdown 围栏，再尝试提取首个完整 JSON 对象，降低模型输出附带说明文字导致的解析失败率
- 病例详情页与任务轮询页应将 `error_message` 视为失败态的一部分展示给用户
- 病例详情接口会优先返回最新 `analysis_tasks` 与最新 `analysis_results`，避免历史旧任务覆盖新终态

## 结果总结

- 文档不再沿用“仅本地文件转 Base64”的旧叙述
- AI 分析链路已具备远程 URL 优先、本地回退保底的稳定策略
- 分析任务当前口径为“阶段进度估算 + 可靠终态收口”，更适合用于医疗场景中的稳定性表达
