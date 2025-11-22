# 医疗报告表 (medical_reports)

<cite>
**本文档引用的文件**
- [MedicalReport.js](file://server/models/MedicalReport.js)
- [reports.js](file://server/routes/reports.js)
- [AnalysisResult.js](file://server/models/AnalysisResult.js)
- [Study.js](file://server/models/Study.js)
- [User.js](file://server/models/User.js)
- [Patient.js](file://server/models/Patient.js)
</cite>

## 目录
1. [项目结构](#项目结构)
2. [核心组件](#核心组件)
3. [状态流转分析](#状态流转分析)
4. [报告内容JSON结构](#报告内容json结构)
5. [关联分析](#关联分析)
6. [电子签名与法律合规性](#电子签名与法律合规性)
7. [PDF生成与存储策略](#pdf生成与存储策略)
8. [依赖关系分析](#依赖关系分析)

## 项目结构

```mermaid
graph TB
subgraph "前端"
VueApp[Vue应用]
Stores[状态管理]
Pages[页面组件]
end
subgraph "后端"
Models[数据模型]
Routes[路由]
Services[服务]
end
Models --> Routes
Routes --> Services
VueApp --> Routes
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [reports.js](file://server/routes/reports.js#L1-L488)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [reports.js](file://server/routes/reports.js#L1-L488)

## 核心组件

医疗报告系统的核心组件包括医疗报告模型(MedicalReport)、分析结果模型(AnalysisResult)、病例模型(Study)和用户模型(User)。这些组件通过外键关联形成完整的医疗数据链。

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L1-L170)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L1-L127)
- [Study.js](file://server/models/Study.js#L1-L131)
- [User.js](file://server/models/User.js#L1-L109)

## 状态流转分析

医疗报告的状态流转是系统的核心业务逻辑，从草稿到最终签署的完整流程如下：

```mermaid
stateDiagram-v2
[*] --> 草稿
草稿 --> 待审核 : 提交审核
待审核 --> 已批准 : 审核通过
待审核 --> 已拒绝 : 审核不通过
已批准 --> 已签署 : 电子签名
已拒绝 --> 草稿 : 重新编辑
已签署 --> [*]
note right of 草稿
初始状态，可编辑
end note
note right of 待审核
等待审核医生审批
end note
note right of 已批准
内容已确认，可签署
end note
note right of 已签署
最终状态，不可修改
end note
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L102-L106)
- [reports.js](file://server/routes/reports.js#L338-L349)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L102-L106)
- [reports.js](file://server/routes/reports.js#L338-L349)

## 报告内容JSON结构

医疗报告的内容以JSON格式存储，包含患者信息、病例信息和分析结果三个主要部分：

```mermaid
erDiagram
报告内容JSON ||--o{ 患者信息 : 包含
报告内容JSON ||--o{ 病例信息 : 包含
报告内容JSON ||--o{ 分析结果 : 包含
患者信息 {
string 姓名
string 性别
string 患者ID
}
病例信息 {
string 病例ID
date 检查日期
string 检查类型
string 临床诊断
}
分析结果 {
string 风险等级
number 置信度
string 主要诊断
string[] 建议
object[] 可疑区域
object 生物标志物
}
```

**图表来源**
- [reports.js](file://server/routes/reports.js#L140-L161)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L46-L64)

**本节来源**
- [reports.js](file://server/routes/reports.js#L140-L161)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L46-L64)

## 关联分析

医疗报告与系统中其他实体的关联关系如下：

```mermaid
classDiagram
class MedicalReport {
+string report_id
+bigint study_id
+bigint analysis_result_id
+bigint patient_id
+bigint generated_by
+bigint signed_by
+string status
+string file_path
}
class Study {
+string study_id
+bigint patient_id
+bigint user_id
}
class AnalysisResult {
+bigint task_id
+bigint study_id
+string diagnosis
+decimal confidence
+string risk_level
}
class Patient {
+string patient_id
+string name
+string gender
}
class User {
+string username
+string real_name
+string role
}
MedicalReport --> Study : study_id
MedicalReport --> AnalysisResult : analysis_result_id
MedicalReport --> Patient : patient_id
MedicalReport --> User : generated_by
MedicalReport --> User : signed_by
Study --> Patient : patient_id
Study --> User : user_id
AnalysisResult --> Study : study_id
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L18-L92)
- [Study.js](file://server/models/Study.js#L13-L37)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L13-L27)
- [Patient.js](file://server/models/Patient.js#L13-L22)
- [User.js](file://server/models/User.js#L14-L47)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L18-L92)
- [Study.js](file://server/models/Study.js#L13-L37)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L13-L27)
- [Patient.js](file://server/models/Patient.js#L13-L22)
- [User.js](file://server/models/User.js#L14-L47)

## 电子签名与法律合规性

电子签名流程确保了医疗报告的法律效力和安全性：

```mermaid
sequenceDiagram
participant 医生 as 医生
participant 系统 as 报告系统
participant 审核医生 as 审核医生
participant 数据库 as 数据库
医生->>系统 : 创建报告(草稿)
系统->>数据库 : 保存草稿状态
医生->>系统 : 提交审核
系统->>审核医生 : 发送审核通知
审核医生->>系统 : 审核通过
系统->>数据库 : 更新为"已批准"状态
审核医生->>系统 : 执行电子签名
系统->>系统 : 生成签名数据
系统->>数据库 : 更新为"已签署"状态<br/>记录签名时间和数据
系统->>审核医生 : 返回已签署报告
Note over 系统,数据库 : 电子签名具有法律效力<br/>不可篡改，可追溯
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L83-L96)
- [reports.js](file://server/routes/reports.js#L345-L348)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L83-L96)
- [reports.js](file://server/routes/reports.js#L345-L348)

## PDF生成与存储策略

PDF报告的生成和存储遵循以下策略：

```mermaid
flowchart TD
A[创建或更新报告] --> B{状态为"已签署"?}
B --> |是| C[生成PDF报告]
C --> D[确定存储路径<br/>reports/YYYYMMDD/]
D --> E[生成文件名<br/>报告ID.pdf]
E --> F[保存PDF文件]
F --> G[更新数据库<br/>file_path字段]
G --> H[返回成功]
B --> |否| I[不生成PDF]
I --> H
style C fill:#f9f,stroke:#333
style D fill:#f9f,stroke:#333
style E fill:#f9f,stroke:#333
style F fill:#f9f,stroke:#333
style G fill:#f9f,stroke:#333
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L56-L64)
- [reports.js](file://server/routes/reports.js#L413-L428)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L56-L64)
- [reports.js](file://server/routes/reports.js#L413-L428)

## 依赖关系分析

系统各组件之间的依赖关系如下：

```mermaid
graph TD
A[MedicalReport] --> B[Study]
A --> C[AnalysisResult]
A --> D[Patient]
A --> E[User]
B --> D
B --> E
C --> B
F[reports.js] --> A
F --> B
F --> C
F --> D
F --> E
style A fill:#ff9999,stroke:#333
style B fill:#99ff99,stroke:#333
style C fill:#99ff99,stroke:#333
style D fill:#99ff99,stroke:#333
style E fill:#99ff99,stroke:#333
style F fill:#66ccff,stroke:#333
```

**图表来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L18-L92)
- [reports.js](file://server/routes/reports.js#L5-L6)
- [Study.js](file://server/models/Study.js#L13-L37)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L13-L27)
- [Patient.js](file://server/models/Patient.js#L13-L22)
- [User.js](file://server/models/User.js#L14-L47)

**本节来源**
- [MedicalReport.js](file://server/models/MedicalReport.js#L18-L92)
- [reports.js](file://server/routes/reports.js#L5-L6)
- [Study.js](file://server/models/Study.js#L13-L37)
- [AnalysisResult.js](file://server/models/AnalysisResult.js#L13-L27)
- [Patient.js](file://server/models/Patient.js#L13-L22)
- [User.js](file://server/models/User.js#L14-L47)