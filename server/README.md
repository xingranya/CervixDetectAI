# CervixDetectAI 后端服务使用说明

## 快速开始

### 1. 配置API密钥

复制 `.env.example` 为 `.env` 并填入你的通义千问API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
QWEN_API_KEY=sk-your-actual-api-key-here
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-max
PORT=3000
```

### 2. 启动后端服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

### 3. 测试API

访问健康检查端点：

```bash
curl http://localhost:3000/health
```

## API接口

### 上传图像并分析

**接口：** `POST /api/analyze`

**请求类型：** `multipart/form-data`

**字段：**
- `image` (File): 图像文件
- `patientName` (String): 患者姓名
- `patientId` (String): 患者ID
- `studyDate` (String): 检查日期
- `modality` (String): 检查方式
- `description` (String, 可选): 病例描述

**响应：**
```json
{
  "taskId": "task_xxx",
  "studyId": "study_xxx",
  "status": "PENDING",
  "estimatedTime": 30
}
```

### 查询任务状态

**接口：** `GET /api/analyze/:taskId`

**响应：**
```json
{
  "taskId": "task_xxx",
  "studyId": "study_xxx",
  "status": "SUCCESS",
  "progress": 100,
  "result": {
    "diagnosis": "LSIL",
    "confidence": 0.92,
    "suspiciousAreas": ["..."],
    "biomarkers": {
      "HPV": "阳性",
      "p16": "阴性",
      "Ki67": "中等表达"
    },
    "recommendations": ["..."],
    "detailedReport": "..."
  }
}
```

## 获取API密钥

1. 访问 [阿里云DashScope](https://dashscope.aliyun.com/)
2. 登录并创建API密钥
3. 将密钥配置到 `.env` 文件

## 目录结构

```
server/
├── index.js          # 服务入口
├── routes/           # API路由
│   └── analyze.js    # 分析接口
├── services/         # 服务模块
│   └── qwenService.js # 通义千问API集成
├── uploads/          # 上传图像存储
├── reports/          # PDF报告存储
└── .env              # 环境配置
```

## 注意事项

- 确保图像文件小于10MB
- 支持格式：JPG、PNG、TIFF
- API调用超时时间为60秒
- 失败会自动重试最多3次
