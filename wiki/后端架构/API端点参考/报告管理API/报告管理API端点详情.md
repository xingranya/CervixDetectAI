# 报告管理API

<cite>
**本文档引用的文件**  
- [reports.js](file://server/routes/reports.js) - *更新了PDF下载功能*
- [MedicalReport.js](file://server/models/MedicalReport.js) - *新增PDF存储字段*
- [api.ts](file://src/services/api.ts) - *更新了API客户端*
- [ReportsPage.vue](file://src/pages/ReportsPage.vue) - *前端报告页面*
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts) - *新增PDF生成工具*
- [pdfFonts.ts](file://src/utils/pdfFonts.ts) - *新增中文字体支持*
</cite>

## 更新摘要
**变更内容**   
- 更新了"下载报告PDF"端点的文档，从模拟报告到真实PDF生成
- 新增了PDF生成流程的详细说明
- 更新了报告内容结构，增加了PDF相关字段
- 添加了新的代码示例，展示PDF生成和下载
- 修正了权限控制规则，增加了PDF文件的权限检查

## 目录
1. [简介](#简介)
2. [API端点详情](#api端点详情)
   - [创建医疗报告 (/api/reports)](#创建医疗报告-apireports)
   - [自动生成报告 (/api/reports/generate/:studyId)](#自动生成报告-apireportsgeneratestudyid)
   - [获取报告列表 (/api/reports)](#获取报告列表-apireports)
   - [获取报告详情 (/api/reports/:id)](#获取报告详情-apireportsid)
   - [更新报告 (/api/reports/:id)](#更新报告-apireportsid)
   - [下载报告PDF (/api/reports/:id/download)](#下载报告pdf-apireportsiddownload)
   - [删除报告 (/api/reports/:id)](#删除报告-apireportsid)
3. [报告内容结构](#报告内容结构)
4. [权限控制规则](#权限控制规则)
5. [代码示例](#代码示例)

## 简介
报告管理API是CervixDetectAI系统的核心功能之一，用于管理和操作医疗分析报告。该API支持创建、生成、获取、更新、下载和删除报告等操作，所有端点均需通过JWT认证。报告与病例、患者和AI分析结果紧密关联，确保数据的完整性和可追溯性。最新更新实现了从模拟报告到真实PDF生成的转变，现在系统能够生成符合医疗标准的PDF报告文件。

## API端点详情

### 创建医疗报告 (/api/reports)
**HTTP方法**: POST  
**URL路径**: `/api/reports`  
**请求头**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| study_id | number | 是 | 关联的病例ID |
| report_type | string | 是 | 报告类型（preliminary, final, supplementary） |
| content | object | 否 | 报告内容，JSON格式 |
| doctor_name | string | 否 | 医生姓名 |
| doctor_title | string | 否 | 医生职称 |

**响应格式**:
```json
{
  "success": true,
  "message": "报告创建成功",
  "data": {
    "report": {
      "id": 1,
      "report_id": "R20231201000001",
      "study_id": 123,
      "generated_by": 456,
      "report_type": "preliminary",
      "status": "draft",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  }
}
```

**状态码**:
- 201: 创建成功
- 400: 请求参数错误
- 403: 无权创建报告
- 404: 病例不存在
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L14-L84)

### 自动生成报告 (/api/reports/generate/:studyId)
**HTTP方法**: POST  
**URL路径**: `/api/reports/generate/:studyId`  
**请求头**: 
- `Authorization: Bearer <token>`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| studyId | number | 是 | 病例ID |

**响应格式**:
```json
{
  "success": true,
  "message": "报告生成成功",
  "data": {
    "report": {
      "id": 2,
      "report_id": "R20231201000002",
      "study_id": 123,
      "generated_by": 456,
      "report_type": "ai_analysis",
      "status": "draft",
      "content": {
        "patient_info": {
          "name": "张三",
          "gender": "女",
          "patient_id": "P20231201001"
        },
        "study_info": {
          "study_id": "S20231201001",
          "study_date": "2023-12-01",
          "study_type": "宫颈细胞学检查"
        },
        "analysis_result": {
          "risk_level": "high",
          "confidence_score": 0.95,
          "primary_diagnosis": "高度鳞状上皮内病变",
          "recommendations": ["建议进行阴道镜检查", "建议进行活检"]
        },
        "generated_at": "2023-12-01T10:05:00Z"
      },
      "created_at": "2023-12-01T10:05:00Z",
      "updated_at": "2023-12-01T10:05:00Z"
    }
  }
}
```

**状态码**:
- 201: 生成成功
- 400: 无分析结果
- 403: 无权生成报告
- 404: 病例不存在
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L90-L201)

### 获取报告列表 (/api/reports)
**HTTP方法**: GET  
**URL路径**: `/api/reports`  
**请求头**: 
- `Authorization: Bearer <token>`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| study_id | number | 否 | 病例ID |
| report_type | string | 否 | 报告类型 |
| status | string | 否 | 报告状态（draft, finalized） |

**响应格式**:
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 1,
        "report_id": "R20231201000001",
        "study_id": 123,
        "generated_by": 456,
        "report_type": "preliminary",
        "status": "draft",
        "created_at": "2023-12-01T10:00:00Z",
        "updated_at": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

**状态码**:
- 200: 获取成功
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L207-L263)

### 获取报告详情 (/api/reports/:id)
**HTTP方法**: GET  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 报告ID |

**响应格式**:
```json
{
  "success": true,
  "data": {
    "report": {
      "id": 1,
      "report_id": "R20231201000001",
      "study_id": 123,
      "generated_by": 456,
      "report_type": "preliminary",
      "status": "draft",
      "content": {
        "patient_info": {
          "name": "张三",
          "gender": "女",
          "patient_id": "P20231201001"
        },
        "study_info": {
          "study_id": "S20231201001",
          "study_date": "2023-12-01",
          "study_type": "宫颈细胞学检查"
        },
        "analysis_result": {
          "risk_level": "high",
          "confidence_score": 0.95,
          "primary_diagnosis": "高度鳞状上皮内病变",
          "recommendations": ["建议进行阴道镜检查", "建议进行活检"]
        },
        "generated_at": "2023-12-01T10:00:00Z"
      },
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  }
}
```

**状态码**:
- 200: 获取成功
- 403: 无权访问报告
- 404: 报告不存在
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L269-L313)

### 更新报告 (/api/reports/:id)
**HTTP方法**: PUT  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 报告ID |

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | object | 否 | 报告内容，JSON格式 |
| doctor_name | string | 否 | 医生姓名 |
| doctor_title | string | 否 | 医生职称 |
| status | string | 否 | 报告状态（draft, finalized） |

**响应格式**:
```json
{
  "success": true,
  "message": "报告更新成功",
  "data": {
    "report": {
      "id": 1,
      "report_id": "R20231201000001",
      "study_id": 123,
      "generated_by": 456,
      "report_type": "preliminary",
      "status": "finalized",
      "finalized_at": "2023-12-01T10:10:00Z",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:10:00Z"
    }
  }
}
```

**状态码**:
- 200: 更新成功
- 403: 无权更新报告
- 404: 报告不存在
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L319-L381)

### 下载报告PDF (/api/reports/:id/download)
**HTTP方法**: GET  
**URL路径**: `/api/reports/:id/download`  
**请求头**: 
- `Authorization: Bearer <token>`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 报告ID |

**响应格式**: PDF文件流

**响应头**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="R20231201000001.pdf"`

**状态码**:
- 200: 下载成功
- 403: 无权下载报告
- 404: 报告或PDF文件不存在
- 500: 服务器错误

**更新说明**: 此端点已从返回模拟报告更新为返回真实的PDF文件。系统现在会在报告状态变为"finalized"时自动生成PDF文件，并存储在服务器上。用户可以通过此端点下载生成的PDF报告。

**Section sources**
- [reports.js](file://server/routes/reports.js#L387-L437)
- [MedicalReport.js](file://server/models/MedicalReport.js#L56-L64)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)

### 删除报告 (/api/reports/:id)
**HTTP方法**: DELETE  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 报告ID |

**响应格式**:
```json
{
  "success": true,
  "message": "报告已删除"
}
```

**状态码**:
- 200: 删除成功
- 403: 无权删除报告
- 404: 报告不存在
- 500: 服务器错误

**Section sources**
- [reports.js](file://server/routes/reports.js#L443-L485)

## 报告内容结构
医疗报告采用结构化设计，包含以下主要部分：

1. **患者信息 (patient_info)**
   - 姓名
   - 性别
   - 患者ID

2. **病例信息 (study_info)**
   - 病例ID
   - 检查日期
   - 检查类型
   - 临床诊断

3. **AI分析结果 (analysis_result)**
   - 风险等级
   - 置信度分数
   - 主要诊断
   - 建议
   - 生物标志物
   - 可疑区域

4. **元数据**
   - 生成时间
   - 医生姓名
   - 报告状态

5. **PDF文件信息**
   - `file_path`: PDF文件存储路径
   - `file_size`: 文件大小（字节）
   - `page_count`: 页数
   - `download_count`: 下载次数
   - `last_downloaded_at`: 最后下载时间

报告内容以JSON格式存储在数据库中，确保数据的可读性和可扩展性。当报告状态变为"finalized"时，系统会自动生成PDF文件，并将文件路径和相关信息存储在数据库中。

**Section sources**
- [MedicalReport.js](file://server/models/MedicalReport.js#L56-L64)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L32-L35)

## 权限控制规则
报告管理API实施严格的权限控制，确保数据安全：

1. **身份验证**: 所有端点都需要有效的JWT令牌
2. **所有权控制**: 
   - 用户只能管理自己创建或生成的报告
   - 非管理员用户只能为自己的病例创建和生成报告
3. **角色权限**: 
   - 普通用户: 只能管理自己的报告
   - 管理员: 可以管理所有报告
4. **状态控制**: 
   - 草稿状态(draft)的报告可以被修改
   - 最终状态(finalized)的报告不可修改
5. **PDF文件权限**: 
   - 用户只能下载自己创建或生成的报告的PDF文件
   - 系统在下载前会检查PDF文件是否存在
   - 下载操作会更新下载次数和最后下载时间

**Section sources**
- [reports.js](file://server/routes/reports.js#L398-L404)
- [MedicalReport.js](file://server/models/MedicalReport.js#L108-L115)

## 代码示例
```typescript
// 创建报告
const reportData = {
  study_id: 123,
  report_type: 'preliminary',
  content: {
    patient_info: { /* 患者信息 */ },
    study_info: { /* 病例信息 */ },
    analysis_result: { /* AI分析结果 */ }
  }
};
const response = await reportAPI.createReport(reportData);

// 自动生成报告
const generatedReport = await reportAPI.generateReport(123);

// 更新报告状态为最终版，触发PDF生成
await reportAPI.updateReport(generatedReport.data.report.id, {
  status: 'finalized'
});

// 下载报告PDF
const pdfBlob = await reportAPI.downloadReport(generatedReport.data.report.id);
const url = window.URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = `${generatedReport.data.report.report_id}.pdf`;
a.click();

// 使用前端PDF生成工具（用于预览）
import { generatePDFReport } from '@/utils/pdfGenerator';

const pdfData = {
  study: {
    id: generatedReport.data.report.study_id,
    patientName: generatedReport.data.report.content.patient_info.name,
    patientId: generatedReport.data.report.content.patient_info.patient_id,
    studyDate: generatedReport.data.report.content.study_info.study_date,
    modality: generatedReport.data.report.content.study_info.study_type
  },
  result: {
    diagnosis: generatedReport.data.report.content.analysis_result.primary_diagnosis,
    confidence: generatedReport.data.report.content.analysis_result.confidence_score,
    recommendations: generatedReport.data.report.content.analysis_result.recommendations,
    detailedReport: JSON.stringify(generatedReport.data.report.content, null, 2)
  }
};

await generatePDFReport(pdfData);
```

**Section sources**
- [api.ts](file://src/services/api.ts#L289-L332)
- [ReportsPage.vue](file://src/pages/ReportsPage.vue#L1-L42)
- [pdfGenerator.ts](file://src/utils/pdfGenerator.ts#L42-L276)