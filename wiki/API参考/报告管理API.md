# 报告管理API

> **本文档引用的文件**   
> - [MedicalReport.js](file://server/models/MedicalReport.js)
> - [reports.js](file://server/routes/reports.js)
> - [api.ts](file://src/services/api.ts)

## 目录
1. [简介](#简介)
2. [报告生成流程](#报告生成流程)
3. [状态管理](#状态管理)
4. [PDF下载机制](#pdf下载机制)
5. [API端点详情](#api端点详情)
   - [创建医疗报告 (/api/reports)](#创建医疗报告-apireports)
   - [自动生成报告 (/api/reports/generate)](#自动生成报告-apireportsgenerate)
   - [获取报告列表 (/api/reports)](#获取报告列表-apireports)
   - [获取报告详情 (/api/reports/:id)](#获取报告详情-apireportsid)
   - [更新报告 (/api/reports/:id)](#更新报告-apireportsid)
   - [下载报告PDF (/api/reports/:id/download)](#下载报告pdf-apireportsiddownload)
   - [删除报告 (/api/reports/:id)](#删除报告-apireportsid)

## 简介
报告管理API提供医疗报告生成、批量导出、查询、下载和分享能力。系统通过RESTful接口实现，除分享访问外请求均需要经过身份验证。每个报告都与特定病例（study）和分析结果相关联，PDF 生成使用医生归档版结构，包含影像对比、关键指标、可疑区域、患者趋势、临床建议与免责声明。

**Section sources**
- [reports.js](file://server/routes/reports.js#L1-L487)

## 报告生成流程
报告的自动生成流程始于用户请求`POST /api/reports/generate`端点，并在请求体中传入`study_id`、`format`和可选`template_id`。系统首先验证用户权限，确保用户有权访问指定病例；随后查找该病例最新分析结果，调用报告生成服务输出 PDF / Word / Excel 文件。生成完成后，后端会根据 `REPORT_STORAGE_PROVIDER` 决定报告最终落点：本地模式保留文件路径，`edgeone-blob` 模式则由 Node 后端直连官方 `@edgeone/pages-blob` SDK 上传对象，并将 `storage_provider / storage_key / storage_namespace / storage_status` 写入 `medical_reports`。写库成功后会清理本地临时文件。

**Section sources**
- [reports.js](file://server/routes/reports.js#L86-L201)

## 状态管理
医疗报告的状态由`status`字段管理，该字段是一个枚举类型，包含以下值：`draft`（草稿）、`pending_review`（待审核）、`approved`（已批准）和`rejected`（已拒绝）。新创建或自动生成的报告默认状态为`draft`。当报告的`status`被更新为`finalized`时，系统会自动设置`finalized_at`时间戳。状态管理确保了报告在不同处理阶段的可追踪性，并为权限控制提供了依据。

**Section sources**
- [MedicalReport.js](file://server/models/MedicalReport.js#L102-L106)

## PDF下载机制
报告文件下载通过`/api/reports/:id/download`端点实现。系统首先验证报告是否存在以及用户是否有权下载，然后根据 `storage_provider` 选择文件来源：

- `local`：读取 `file_path` 指向的本地文件
- `edgeone-blob`：使用官方 Blob SDK 按 `storage_key` 读取远程对象

无论底层来源是什么，接口都会统一设置合适的 `Content-Type` 和 `Content-Disposition`，前端调用方式保持不变。

**Section sources**
- [reports.js](file://server/routes/reports.js#L383-L437)

## API端点详情

### 创建医疗报告 (/api/reports)
此端点用于手动创建新的医疗报告。

**HTTP方法**: POST  
**URL路径**: `/api/reports`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)
- `Content-Type: application/json` (必填)

**请求参数 (路径)**: 无

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**:
```json
{
  "study_id": "integer, 必填, 病例ID",
  "report_type": "string, 必填, 报告类型 (preliminary, final, supplementary)",
  "content": "string, 可选, 报告内容",
  "doctor_name": "string, 可选, 医生姓名",
  "doctor_title": "string, 可选, 医生职称"
}
```

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "message": "string",
  "data": {
    "report": {
      "id": "integer",
      "report_id": "string",
      "study_id": "integer",
      "analysis_result_id": "integer",
      "patient_id": "integer",
      "report_type": "string",
      "report_title": "string",
      "file_path": "string",
      "file_size": "integer",
      "page_count": "integer",
      "template_version": "string",
      "generated_by": "integer",
      "signed_by": "integer",
      "signed_at": "string, date-time",
      "signature_data": "string",
      "status": "string",
      "download_count": "integer",
      "last_downloaded_at": "string, date-time",
      "created_at": "string, date-time",
      "updated_at": "string, date-time",
      "study": {
        "id": "integer",
        "study_id": "string",
        "study_date": "string, date-time",
        "study_type": "string",
        "patient": {
          "id": "integer",
          "patient_id": "string",
          "name": "string",
          "gender": "string"
        }
      }
    }
  }
}
```

**可能的HTTP状态码及错误信息**:
- `201 Created`: 报告创建成功
- `400 Bad Request`: 缺少必填字段（如"病例ID和报告类型为必填项"）
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权为该病例创建报告
- `404 Not Found`: 指定的病例不存在
- `500 Internal Server Error`: 创建报告失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L10-L84)

### 自动生成报告 (/api/reports/generate)
此端点用于基于病例的分析结果自动生成报告。

**HTTP方法**: POST  
**URL路径**: `/api/reports/generate`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)
- `Content-Type: application/json` (必填)

**请求参数 (路径)**: 无

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**:
```json
{
  "study_id": "integer, 必填, 病例ID",
  "format": "string, 可选, pdf | word | excel，默认 pdf",
  "template_id": "string, 可选, 指定报告模板"
}
```

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "message": "string",
  "data": {
    "report": {
      "id": "integer",
      "report_id": "string",
      "study_id": "integer",
      "analysis_result_id": "integer",
      "patient_id": "integer",
      "report_type": "string",
      "report_title": "string",
      "file_path": "string",
      "file_size": "integer",
      "page_count": "integer",
      "template_version": "string",
      "generated_by": "integer",
      "signed_by": "integer",
      "signed_at": "string, date-time",
      "signature_data": "string",
      "status": "string",
      "download_count": "integer",
      "last_downloaded_at": "string, date-time",
      "created_at": "string, date-time",
      "updated_at": "string, date-time",
      "study": {
        "id": "integer",
        "study_id": "string",
        "study_date": "string, date-time",
        "study_type": "string",
        "patient": {
          "id": "integer",
          "patient_id": "string",
          "name": "string",
          "gender": "string"
        }
      }
    }
  }
}
```

**可能的HTTP状态码及错误信息**:
- `200 OK`: 报告生成成功
- `400 Bad Request`: 缺少 study_id、格式不支持或该病例暂无分析结果
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权为该病例生成报告
- `404 Not Found`: 指定的病例不存在
- `500 Internal Server Error`: 生成报告失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L86-L201)

### 获取报告列表 (/api/reports)
此端点用于获取报告列表，支持分页和过滤。

**HTTP方法**: GET  
**URL路径**: `/api/reports`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)

**请求参数 (路径)**: 无

**请求参数 (查询)**:
- `page`: integer, 可选, 页码，默认为1
- `limit`: integer, 可选, 每页数量，默认为10
- `study_id`: integer, 可选, 按病例ID过滤
- `report_type`: string, 可选, 按报告类型过滤
- `status`: string, 可选, 按状态过滤

**请求体 (JSON Schema)**: 无

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "data": {
    "reports": [
      {
        "id": "integer",
        "report_id": "string",
        "study_id": "integer",
        "analysis_result_id": "integer",
        "patient_id": "integer",
        "report_type": "string",
        "report_title": "string",
        "file_path": "string",
        "file_size": "integer",
        "page_count": "integer",
        "template_version": "string",
        "generated_by": "integer",
        "signed_by": "integer",
        "signed_at": "string, date-time",
        "signature_data": "string",
        "status": "string",
        "download_count": "integer",
        "last_downloaded_at": "string, date-time",
        "created_at": "string, date-time",
        "updated_at": "string, date-time",
        "study": {
          "id": "integer",
          "study_id": "string",
          "study_date": "string, date-time",
          "study_type": "string",
          "patient": {
            "id": "integer",
            "patient_id": "string",
            "name": "string"
          }
        }
      }
    ],
    "pagination": {
      "total": "integer",
      "page": "integer",
      "limit": "integer",
      "pages": "integer"
    }
  }
}
```

**可能的HTTP状态码及错误信息**:
- `200 OK`: 成功获取报告列表
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `500 Internal Server Error`: 获取报告列表失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L203-L263)

### 获取报告详情 (/api/reports/:id)
此端点用于获取单个报告的详细信息。

**HTTP方法**: GET  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)

**请求参数 (路径)**:
- `id`: integer, 必填, 报告ID

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**: 无

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "data": {
    "report": {
      "id": "integer",
      "report_id": "string",
      "study_id": "integer",
      "analysis_result_id": "integer",
      "patient_id": "integer",
      "report_type": "string",
      "report_title": "string",
      "file_path": "string",
      "file_size": "integer",
      "page_count": "integer",
      "template_version": "string",
      "generated_by": "integer",
      "signed_by": "integer",
      "signed_at": "string, date-time",
      "signature_data": "string",
      "status": "string",
      "download_count": "integer",
      "last_downloaded_at": "string, date-time",
      "created_at": "string, date-time",
      "updated_at": "string, date-time",
      "study": {
        "id": "integer",
        "study_id": "string",
        "study_date": "string, date-time",
        "study_type": "string",
        "patient": {
          "id": "integer",
          "patient_id": "string",
          "name": "string",
          "gender": "string"
        }
      }
    }
  }
}
```

**可能的HTTP状态码及错误信息**:
- `200 OK`: 成功获取报告详情
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权访问该报告
- `404 Not Found`: 报告不存在
- `500 Internal Server Error`: 获取报告详情失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L264-L313)

### 更新报告 (/api/reports/:id)
此端点用于更新现有报告的信息。

**HTTP方法**: PUT  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)
- `Content-Type: application/json` (必填)

**请求参数 (路径)**:
- `id`: integer, 必填, 报告ID

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**:
```json
{
  "content": "string, 可选, 报告内容",
  "doctor_name": "string, 可选, 医生姓名",
  "doctor_title": "string, 可选, 医生职称",
  "status": "string, 可选, 报告状态"
}
```

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "message": "string",
  "data": {
    "report": {
      "id": "integer",
      "report_id": "string",
      "study_id": "integer",
      "analysis_result_id": "integer",
      "patient_id": "integer",
      "report_type": "string",
      "report_title": "string",
      "file_path": "string",
      "file_size": "integer",
      "page_count": "integer",
      "template_version": "string",
      "generated_by": "integer",
      "signed_by": "integer",
      "signed_at": "string, date-time",
      "signature_data": "string",
      "status": "string",
      "download_count": "integer",
      "last_downloaded_at": "string, date-time",
      "created_at": "string, date-time",
      "updated_at": "string, date-time",
      "study": {
        "id": "integer",
        "study_id": "string",
        "study_date": "string, date-time",
        "study_type": "string",
        "patient": {
          "id": "integer",
          "patient_id": "string",
          "name": "string",
          "gender": "string"
        }
      }
    }
  }
}
```

**可能的HTTP状态码及错误信息**:
- `200 OK`: 报告更新成功
- `400 Bad Request`: 请求体格式错误
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权更新该报告
- `404 Not Found`: 报告不存在
- `500 Internal Server Error`: 更新报告失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L316-L381)

### 下载报告PDF (/api/reports/:id/download)
此端点用于下载报告的PDF文件。

**HTTP方法**: GET  
**URL路径**: `/api/reports/:id/download`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)

**请求参数 (路径)**:
- `id`: integer, 必填, 报告ID

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**: 无

**响应体**: PDF文件流

**可能的HTTP状态码及错误信息**:
- `200 OK`: 成功返回PDF文件流
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权下载该报告
- `404 Not Found`: 报告不存在、报告PDF未生成或PDF文件不存在
- `500 Internal Server Error`: 下载报告失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L383-L437)

### 删除报告 (/api/reports/:id)
此端点用于删除报告。

**HTTP方法**: DELETE  
**URL路径**: `/api/reports/:id`  
**请求头**: 
- `Authorization: Bearer <token>` (必填)

**请求参数 (路径)**:
- `id`: integer, 必填, 报告ID

**请求参数 (查询)**: 无

**请求体 (JSON Schema)**: 无

**响应体 (JSON Schema)**:
```json
{
  "success": "boolean",
  "message": "string"
}
```

**可能的HTTP状态码及错误信息**:
- `200 OK`: 报告已删除
- `401 Unauthorized`: 未提供认证令牌或令牌无效
- `403 Forbidden`: 用户无权删除该报告
- `404 Not Found`: 报告不存在
- `500 Internal Server Error`: 删除报告失败

**Section sources**
- [reports.js](file://server/routes/reports.js#L439-L485)
