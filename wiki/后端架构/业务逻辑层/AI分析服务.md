# AI分析服务

<cite>
**Referenced Files in This Document**   
- [qwenService.js](file://server/services/qwenService.js)
- [analyze.js](file://server/routes/analyze.js)
- [.env](file://server/.env)
- [AnalysisTask.js](file://server/models/AnalysisTask.js)
- [AnalysisResult.js](file://server/models/AnalysisResult.js)
- [index.js](file://server/index.js)
</cite>

## 目录
1. [简介](#简介)
2. [核心组件](#核心组件)
3. [QwenService类设计与实现](#qwenservice类设计与实现)
4. [AI分析流程详解](#ai分析流程详解)
5. [错误处理与重试机制](#错误处理与重试机制)
6. [服务层与控制器层交互](#服务层与控制器层交互)
7. [系统架构与数据流](#系统架构与数据流)

## 简介
本文档深入解析CervixDetectAI项目中AI分析服务的设计与实现。该服务基于通义千问视觉语言模型，为宫颈细胞学图像提供专业的病理分析。文档详细阐述了QwenService类的构造函数初始化过程、analyzeImage方法的完整执行流程、重试机制和错误处理策略，以及服务层与控制器层的交互方式。

## 核心组件

**Section sources**
- [qwenService.js](file://server/services/qwenService.js)
- [analyze.js](file://server/routes/analyze.js)

## QwenService类设计与实现

### 构造函数初始化
QwenService类的构造函数负责初始化通义千问API客户端，包括API密钥、模型配置和Axios实例设置。构造函数从环境变量中读取必要的配置信息，并创建一个预配置的Axios实例用于API调用。

```mermaid
classDiagram
class QwenService {
+string apiKey
+string apiUrl
+string model
+object axiosInstance
+constructor()
+imageToBase64(imagePath) Promise~string~
+analyzeImage(imagePath, retryCount) Promise~Object~
+shouldRetry(error) boolean
+formatError(error) Error
}
```

**Diagram sources **
- [qwenService.js](file://server/services/qwenService.js#L35-L52)

**Section sources**
- [qwenService.js](file://server/services/qwenService.js#L35-L52)
- [.env](file://server/.env#L1-L4)

## AI分析流程详解

### analyzeImage方法执行流程
analyzeImage方法是AI分析服务的核心，其完整执行流程包括图像文件读取、Base64编码转换、请求体构建、API调用到响应解析等步骤。

```mermaid
flowchart TD
Start([开始分析图像]) --> ReadImage["读取图像文件 (fs.readFile)"]
ReadImage --> ConvertBase64["转换为Base64编码"]
ConvertBase64 --> BuildRequest["构建API请求体"]
BuildRequest --> SetHeaders["设置请求头 (Authorization, Content-Type)"]
SetHeaders --> CallAPI["调用通义千问API (axios.post)"]
CallAPI --> CheckResponse["检查API响应格式"]
CheckResponse --> ParseJSON["解析JSON响应"]
ParseJSON --> CleanContent["清理Markdown代码块标记"]
CleanContent --> ValidateFields["验证必需字段"]
ValidateFields --> Standardize["标准化数据结构"]
Standardize --> ReturnResult["返回分析结果"]
ParseJSON --> |解析失败| HandleParseError["处理JSON解析错误"]
HandleParseError --> ThrowError["抛出解析错误"]
CallAPI --> |调用失败| RetryLogic["执行重试逻辑"]
RetryLogic --> |可重试| Delay["等待指数退避延迟"]
Delay --> RetryCall["重试API调用"]
RetryLogic --> |不可重试| FormatError["格式化错误信息"]
FormatError --> ThrowFormattedError["抛出格式化错误"]
```

**Diagram sources **
- [qwenService.js](file://server/services/qwenService.js#L84-L191)

**Section sources**
- [qwenService.js](file://server/services/qwenService.js#L84-L191)

## 错误处理与重试机制

### 重试机制
QwenService实现了智能的重试机制，通过shouldRetry方法判断是否应该重试。该方法会检查网络错误、超时、API限流和服务器错误等可恢复的错误类型。

```mermaid
flowchart TD
Start["开始shouldRetry判断"] --> CheckNetwork["检查网络错误 (ECONNABORTED, ETIMEDOUT)"]
CheckNetwork --> |是| ShouldRetry["返回true"]
CheckNetwork --> |否| CheckRateLimit["检查API限流 (429)"]
CheckRateLimit --> |是| ShouldRetry
CheckRateLimit --> |否| CheckServerError["检查服务器错误 (5xx)"]
CheckServerError --> |是| ShouldRetry
CheckServerError --> |否| NoRetry["返回false"]
```

**Diagram sources **
- [qwenService.js](file://server/services/qwenService.js#L199-L215)

### 错误格式化
formatError方法将原始错误转换为用户友好的错误信息，针对不同类型的错误提供具体的错误描述。

```mermaid
flowchart TD
Start["开始formatError"] --> CheckResponse["检查是否有response"]
CheckResponse --> |是| GetStatus["获取HTTP状态码"]
GetStatus --> Check400["检查400错误"]
Check400 --> |是| Return400["返回'请求参数错误'"]
Check400 --> |否| Check401["检查401错误"]
Check401 --> |是| Return401["返回'API密钥无效或已过期'"]
Check401 --> |否| Check403["检查403错误"]
Check403 --> |是| Return403["返回'无权限访问该API'"]
Check403 --> |否| Check429["检查429错误"]
Check429 --> |是| Return429["返回'API请求频率超限'"]
Check429 --> |否| Check5xx["检查5xx错误"]
Check5xx --> |是| Return5xx["返回'通义千问服务暂时不可用'"]
Check5xx --> |否| ReturnOther["返回'API错误'"]
CheckResponse --> |否| CheckTimeout["检查超时错误"]
CheckTimeout --> |是| ReturnTimeout["返回'API请求超时'"]
CheckTimeout --> |否| ReturnGeneric["返回'调用通义千问API失败'"]
```

**Diagram sources **
- [qwenService.js](file://server/services/qwenService.js#L223-L249)

**Section sources**
- [qwenService.js](file://server/services/qwenService.js#L199-L249)

## 服务层与控制器层交互

### 分析任务处理流程
analyze.js路由文件展示了服务层与控制器层的交互方式，包括任务创建、状态更新和结果保存的完整流程。

```mermaid
sequenceDiagram
participant Client as "客户端"
participant Router as "analyze.js路由"
participant Service as "QwenService"
participant DB as "数据库"
Client->>Router : POST /api/analyze (上传图像)
Router->>Router : 验证文件和必填字段
Router->>Router : 生成任务ID和病例ID
Router->>Router : 保存任务到内存Map
Router->>Client : 返回任务ID (200 OK)
Router->>Router : 异步执行saveToDatabase
Router->>DB : 保存患者、病例、图像和分析任务
DB-->>Router : 保存成功
Router->>Router : 调用processAnalysisTask
Router->>Service : 调用qwenService.analyzeImage()
Service->>Service : 转换图像为Base64
Service->>Service : 构建请求体
Service->>Service : 调用通义千问API
Service-->>Router : 返回分析结果
Router->>DB : 保存分析结果到AnalysisResult表
DB-->>Router : 保存成功
Router->>Router : 更新任务和病例状态
```

**Diagram sources **
- [analyze.js](file://server/routes/analyze.js#L240-L337)
- [qwenService.js](file://server/services/qwenService.js#L264-L264)

**Section sources**
- [analyze.js](file://server/routes/analyze.js#L240-L337)

## 系统架构与数据流

### 系统架构图
展示了AI分析服务在整个系统中的位置和与其他组件的交互关系。

```mermaid
graph TB
subgraph "前端"
UI[用户界面]
Store[状态管理]
end
subgraph "后端"
API[API服务器]
Qwen[QwenService]
DB[(数据库)]
end
UI --> Store
Store --> API
API --> Qwen
Qwen --> |调用API| QwenAPI[通义千问API]
Qwen --> DB
API --> DB
```

**Diagram sources **
- [index.js](file://server/index.js#L8-L15)
- [qwenService.js](file://server/services/qwenService.js)
- [analyze.js](file://server/routes/analyze.js)

**Section sources**
- [index.js](file://server/index.js#L8-L15)
- [qwenService.js](file://server/services/qwenService.js)
- [analyze.js](file://server/routes/analyze.js)