# 宫颈病变智能风险评估与辅助诊断系统

## 项目概述

这是一个基于人工智能技术的宫颈病变智能风险评估与辅助诊断系统，旨在通过深度学习模型对宫颈医学影像进行分析，提供风险评估和诊断建议。系统采用C# .NET 8后端架构和HTML/CSS/JavaScript前端界面，支持多种医学影像格式，包括DICOM、TIFF、PNG、JPG和BMP等。

## 技术架构

### 后端架构
- **框架**: .NET 8 Windows平台
- **架构模式**: 四层架构（表示层、业务逻辑层、数据访问层、基础设施层）
- **主要技术栈**:
  - Microsoft.Extensions.Hosting (应用主机)
  - OpenCvSharp4 (图像处理)
  - Microsoft.ML.OnnxRuntime (AI模型推理)
  - Serilog (日志记录)
  - QuestPDF (报告生成)
  - fo-dicom (医学影像格式支持)

### 前端架构
- **技术**: HTML5 + CSS3 + JavaScript
- **UI框架**: 自定义CSS框架，采用Material Design原则
- **图表库**: ECharts 5.4.3
- **图标库**: Lucide Icons

### AI模型支持
- **模型格式**: ONNX (.onnx)、TensorFlow (.pb)
- **主要功能**: 病变分割、风险分类、特征提取
- **推理引擎**: ONNX Runtime、TensorFlow.NET

## 项目结构

```
宫颈病变智能风险评估系统/
├── 后端代码/
│   ├── src/CervicalLesionSystem/          # 主要后端代码
│   │   ├── Core/                          # 核心业务逻辑
│   │   │   ├── DiagnosticReportGenerator.cs
│   │   │   ├── ImagePreprocessor.cs
│   │   │   ├── LesionSegmenter.cs
│   │   │   └── RiskAssessmentCalculator.cs
│   │   ├── Services/                      # 服务层
│   │   │   ├── AIModelService.cs          # AI模型服务
│   │   │   ├── ImageProcessingService.cs  # 图像处理服务
│   │   │   └── ClinicalDecisionSupportService.cs
│   │   ├── Models/                        # 数据模型
│   │   │   ├── MedicalImage.cs
│   │   │   ├── LesionAnalysisResult.cs
│   │   │   ├── RiskAssessment.cs
│   │   │   └── DiagnosticReport.cs
│   │   ├── Utilities/                     # 工具类
│   │   ├── Constants/                     # 常量定义
│   │   └── Logging/                       # 日志配置
│   └── docs/                              # 文档
│       ├── API_REFERENCE.md
│       └── ARCHITECTURE.md
├── 静态页面/                              # 前端页面
│   ├── main_dashboard.html               # 主控制台
│   ├── image_analysis.html               # 影像分析页面
│   ├── risk_assessment.html              # 风险评估页面
│   ├── report_center.html                # 报告中心
│   └── system_settings.html              # 系统设置
└── 申请材料/                              # 项目申请文档
```

## 核心功能模块

### 1. 图像处理模块 (ImageProcessingService)
- **功能**: 医学影像预处理、标准化、对比度增强
- **支持格式**: DICOM (.dcm)、TIFF、PNG、JPG、BMP
- **主要方法**:
  - `Preprocess()`: 预处理医学影像
  - `BatchPreprocess()`: 批量预处理
  - `StandardizeSize()`: 标准化影像尺寸
  - `EnhanceContrast()`: 增强影像对比度

### 2. AI模型服务 (AIModelService)
- **功能**: 深度学习模型加载与推理
- **支持模型**: ONNX、TensorFlow格式
- **主要方法**:
  - `LoadModel()`: 加载训练好的模型
  - `Infer()`: 单张影像推理
  - `BatchInfer()`: 批量影像推理
  - `UnloadModel()`: 释放模型资源

### 3. 风险评估计算器 (RiskAssessmentCalculator)
- **功能**: 基于AI分析结果计算病变风险等级
- **评估维度**: 病变区域面积、细胞异常程度、历史一致性
- **风险等级**: 低风险(≤0.3)、中风险(0.3-0.7)、高风险(>0.7)

### 4. 诊断报告生成器 (DiagnosticReportGenerator)
- **功能**: 生成结构化诊断报告
- **输出格式**: PDF、HTML、DOCX
- **报告内容**: 影像分析结果、风险评估、临床建议

## 构建和运行

### 环境要求
- **操作系统**: Windows 10/11 (x64)
- **.NET版本**: .NET 8.0 SDK
- **数据库**: SQL Server (支持集成身份验证)
- **内存**: 最低8GB RAM (推荐16GB)
- **存储**: 至少10GB可用空间

### 构建步骤
1. 确保已安装.NET 8.0 SDK
2. 在后端代码目录中运行:
   ```bash
   cd 后端代码/src/CervicalLesionSystem
   dotnet restore
   dotnet build --configuration Release
   ```

### 运行应用
1. **后端启动**:
   ```bash
   cd 后端代码/src/CervicalLesionSystem
   dotnet run --configuration Release
   ```

2. **前端访问**:
   - 打开浏览器访问静态页面
   - 主页面: `静态页面/main_dashboard.html`

### 配置说明
主要配置文件位于 `后端代码/src/CervicalLesionSystem/appsettings.json`:

- **数据库连接**: `ConnectionStrings.MedicalDatabase`
- **模型配置**: `ModelConfiguration` (模型路径、批处理大小等)
- **图像处理**: `ImageProcessing` (支持格式、预处理管道等)
- **风险评估**: `RiskAssessment` (阈值设置、权重因子等)

## 开发约定

### 代码风格
- **命名约定**: 使用PascalCase命名类和方法，camelCase命名变量
- **注释**: 所有公共方法和类必须有XML文档注释
- **异常处理**: 使用特定的异常类型，提供详细的错误信息
- **日志记录**: 使用Serilog进行结构化日志记录

### 测试约定
- 单元测试应覆盖所有核心业务逻辑
- 集成测试应验证主要工作流程
- 性能测试应确保AI推理速度满足临床要求

### 安全约定
- 所有敏感数据必须加密存储
- 用户会话超时时间: 1小时
- 支持CORS配置，限制允许的源地址

## 常见问题处理

### 模型加载失败
1. 检查模型文件路径是否正确
2. 确认模型格式受支持 (ONNX/TensorFlow)
3. 验证模型文件完整性

### 图像处理错误
1. 确认图像格式支持列表
2. 检查图像文件是否损坏
3. 验证预处理参数配置

### 数据库连接问题
1. 检查SQL Server服务是否运行
2. 验证连接字符串配置
3. 确认数据库访问权限

## 性能优化建议

1. **AI推理优化**:
   - 启用GPU加速 (在配置中设置GpuDeviceId)
   - 调整批处理大小以平衡内存使用和处理速度
   - 考虑使用TensorRT优化 (EnableTensorRtOptimization)

2. **图像处理优化**:
   - 启用图像缓存减少重复处理
   - 调整预处理管道步骤
   - 使用多线程处理批量图像

3. **系统资源优化**:
   - 配置合适的最大并发分析数
   - 定期清理过期缓存文件
   - 监控内存使用情况

## 扩展指南

### 添加新的AI模型
1. 将模型文件放置在models目录
2. 更新appsettings.json中的ModelConfiguration
3. 在AIModelService中添加模型特定的加载和推理逻辑

### 集成外部PACS系统
1. 配置ExternalServices.PacsEndpoint
2. 实现PACS接口适配器
3. 添加DICOM网络通信支持

### 自定义报告模板
1. 在report_templates目录添加新模板
2. 更新ReportGeneration配置
3. 实现模板渲染逻辑

## 联系信息

- **项目仓库**: https://github.com/xingranya/CervixDetectAI.git
- **技术支持**: 通过项目Issues提交问题
- **文档更新**: 随版本一同更新

---

*最后更新: 2025年12月21日*