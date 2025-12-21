# 宫颈病变智能风险评估与辅助诊断系统 (CervixDetectAI)

## 项目概述

这是一个基于人工智能的医疗影像分析系统,专注于宫颈病变的智能风险评估与辅助诊断。系统由 **C# .NET 8.0 后端** 和 **HTML/CSS/JavaScript 静态前端** 组成,提供医学影像处理、病变分割、风险评估和诊断报告生成等核心功能。

### 核心功能
- 🔬 **医学影像智能分析**: 支持多种医学影像格式(JPG/PNG/TIFF/BMP/DICOM)的上传与预处理
- 🎯 **病变区域分割**: 基于深度学习模型(ONNX)的病变区域自动识别与分割
- 📊 **风险等级评估**: 自动评估病变风险等级(Normal/ASC-US/LSIL/HSIL/SCC)
- 📄 **诊断报告生成**: 自动生成结构化的诊断报告,支持PDF导出
- 📈 **数据可视化**: 提供风险分布统计、趋势分析等可视化功能

### 技术栈

**后端技术:**
- 框架: .NET 8.0 (Windows Forms应用)
- 图像处理: OpenCvSharp4, SixLabors.ImageSharp
- AI/ML: Microsoft.ML, ONNX Runtime, TensorFlow.NET
- 医学影像: fo-dicom (DICOM格式支持)
- 报告生成: QuestPDF
- 日志: Serilog
- 重试策略: Polly
- 数据验证: FluentValidation

**前端技术:**
- 纯静态页面: HTML5 + CSS3 + JavaScript
- 图标库: Lucide Icons
- 图表库: ECharts 5.4.3
- UI风格: 现代化医疗系统设计,深色导航栏 + 浅色内容区

### 项目结构

```
D:\html\CervixDetectAI\另外一个项目\
├── 后端代码\                           # C# .NET 后端项目
│   ├── CervicalLesionSystem.sln      # Visual Studio 解决方案文件
│   ├── README.md                      # 后端文档(实际为appsettings.json内容)
│   ├── docs\                          # API文档
│   │   ├── API_REFERENCE.md          # API接口参考
│   │   └── ARCHITECTURE.md           # 系统架构文档
│   └── src\
│       └── CervicalLesionSystem\     # 主项目代码
│           ├── Program.cs            # 应用程序入口
│           ├── Startup.cs            # 服务配置与中间件
│           ├── appsettings.json      # 配置文件
│           ├── Constants\            # 常量定义
│           ├── Core\                 # 核心业务逻辑
│           │   ├── ImagePreprocessor.cs        # 影像预处理
│           │   ├── LesionSegmenter.cs          # 病变分割
│           │   ├── RiskAssessmentCalculator.cs # 风险评估
│           │   └── DiagnosticReportGenerator.cs # 报告生成
│           ├── Models\               # 数据模型
│           ├── Services\             # 服务层
│           │   ├── AIModelService.cs           # AI模型服务
│           │   ├── ImageProcessingService.cs   # 图像处理服务
│           │   ├── ClinicalDecisionSupportService.cs # 临床决策支持
│           │   └── DataExportService.cs        # 数据导出服务
│           ├── Utilities\            # 工具类
│           └── Logging\              # 日志配置
└── 静态页面\                          # 前端静态页面
    ├── main_dashboard.html           # 工作台主页
    ├── image_analysis.html           # 影像分析页面
    ├── risk_assessment.html          # 风险评估页面
    ├── report_center.html            # 报告中心页面
    ├── system_settings.html          # 系统设置页面
    └── 1.jpeg                        # 示例图片

```

## 构建与运行

### 后端系统

#### 前置要求
- Windows 操作系统 (Windows 7+)
- .NET 8.0 SDK 或更高版本
- Visual Studio 2022 (推荐) 或 Visual Studio Code
- 至少 4GB 可用内存
- AI模型文件 (ONNX格式,需放置在配置的路径下)

#### 构建步骤

1. **打开解决方案**
   ```powershell
   cd "D:\html\CervixDetectAI\另外一个项目\后端代码"
   # 使用 Visual Studio 打开
   start CervicalLesionSystem.sln
   ```

2. **还原 NuGet 包**
   ```powershell
   dotnet restore
   ```

3. **编译项目**
   ```powershell
   # Debug 模式
   dotnet build --configuration Debug
   
   # Release 模式
   dotnet build --configuration Release
   ```

4. **运行应用程序**
   ```powershell
   # 方式1: 使用 dotnet 命令
   cd src\CervicalLesionSystem
   dotnet run
   
   # 方式2: 运行编译后的可执行文件
   .\bin\Debug\net8.0-windows\CervicalLesionSystem.exe
   ```

#### 配置说明

关键配置文件: `src/CervicalLesionSystem/appsettings.json`

```json
{
  "ApplicationSettings": {
    "ApplicationName": "宫颈病变智能风险评估系统",
    "Version": "1.0.0",
    "MaxImageSize": 4096,
    "SupportedFormats": [".jpg", ".jpeg", ".png", ".tiff", ".bmp"]
  },
  "ModelSettings": {
    "SegmentationModelPath": "models\\lesion_segmentation.onnx",
    "ClassificationModelPath": "models\\risk_classification.onnx",
    "ModelInputSize": 512,
    "ConfidenceThreshold": 0.7
  },
  "DatabaseSettings": {
    "ConnectionString": "Server=(local);Database=CervicalLesionDB;Trusted_Connection=True;",
    "EnableLogging": true,
    "MaxRetryCount": 3
  }
}
```

**重要提示:**
- 确保 `ModelSettings:SegmentationModelPath` 和 `ModelSettings:ClassificationModelPath` 指向的 ONNX 模型文件存在
- 如果没有模型文件,系统启动时会记录警告但不会崩溃
- 数据库连接字符串需根据实际环境调整

#### 日志文件

日志文件自动生成在:
```
后端代码\src\CervicalLesionSystem\bin\Debug\net8.0-windows\logs\
文件名格式: cervical_lesion_YYYYMMDD.log
```

### 前端系统

前端为纯静态页面,无需构建步骤。

#### 运行方式

**方式1: 直接在浏览器中打开**
```powershell
# 打开主工作台
start "D:\html\CervixDetectAI\另外一个项目\静态页面\main_dashboard.html"

# 打开影像分析页面
start "D:\html\CervixDetectAI\另外一个项目\静态页面\image_analysis.html"
```

**方式2: 使用本地Web服务器 (推荐)**
```powershell
cd "D:\html\CervixDetectAI\另外一个项目\静态页面"

# 使用 Python 简单HTTP服务器
python -m http.server 8080

# 或使用 Node.js http-server (需先安装: npm install -g http-server)
http-server -p 8080
```

然后在浏览器访问: `http://localhost:8080/main_dashboard.html`

#### 页面说明

- **main_dashboard.html**: 工作台首页,展示系统概览、待处理任务、快速操作入口
- **image_analysis.html**: 影像分析页面,支持影像上传、预处理、AI分析
- **risk_assessment.html**: 风险评估页面,展示病变风险等级评估结果
- **report_center.html**: 报告中心,管理和导出诊断报告
- **system_settings.html**: 系统设置页面,配置系统参数

## 开发约定

### 代码风格

**C# 后端:**
- 遵循 Microsoft C# 编码规范
- 使用 PascalCase 命名类、方法、属性
- 使用 camelCase 命名局部变量和参数
- 使用下划线前缀 `_` 命名私有字段
- 启用 Nullable 引用类型 (`<Nullable>enable</Nullable>`)
- 所有公共API必须包含XML文档注释
- 使用依赖注入 (DI) 管理服务生命周期

**前端:**
- 使用语义化的 HTML5 标签
- CSS 采用 BEM 命名规范 (部分区域)
- JavaScript 使用 ES6+ 语法
- 使用 Lucide Icons 图标库
- 使用 ECharts 进行数据可视化
- 响应式设计,支持移动端和桌面端

### 架构模式

系统采用 **分层架构**:

```
┌─────────────────────────────────────────────────────────────┐
│                   表示层 (Presentation Layer)                 │
│  - Windows Forms UI (后端)                                    │
│  - 静态HTML页面 (前端)                                         │
├─────────────────────────────────────────────────────────────┤
│                   业务逻辑层 (Business Logic Layer)           │
│  - Core: 核心算法实现                                         │
│  - Services: 业务服务封装                                     │
├─────────────────────────────────────────────────────────────┤
│                   数据访问层 (Data Access Layer)              │
│  - Models: 数据模型定义                                       │
│  - 数据库访问 (未完全实现)                                     │
├─────────────────────────────────────────────────────────────┤
│                   基础设施层 (Infrastructure Layer)           │
│  - Logging: 日志记录                                          │
│  - Utilities: 工具类                                          │
│  - 中间件: 异常处理、请求日志                                  │
└─────────────────────────────────────────────────────────────┘
```

### 依赖注入

系统使用 Microsoft.Extensions.DependencyInjection 进行依赖注入:

```csharp
// 在 Startup.cs 中注册服务
services.AddScoped<ImagePreprocessor>();
services.AddScoped<LesionSegmenter>();
services.AddScoped<RiskAssessmentCalculator>();
services.AddScoped<IImageProcessingService, ImageProcessingService>();
services.AddScoped<IAIModelService, AIModelService>();

// 使用装饰器模式添加重试策略
services.Decorate<IImageProcessingService, RetryDecorator<IImageProcessingService>>();
```

### 错误处理

- 使用全局异常处理中间件 `GlobalExceptionHandler`
- 关键操作使用 Polly 库实现重试策略
- 所有异常都记录到日志文件
- 返回用户友好的错误消息

### 日志记录

使用 Serilog 进行结构化日志记录:
- **Information**: 正常操作流程
- **Warning**: 非关键性问题
- **Error**: 错误和异常
- **Debug**: 调试信息 (仅在开发环境)

## 测试

### 后端测试

目前项目中排除了测试文件 (见 .csproj 配置):
```xml
<Compile Remove="**\*Validate*.cs" />
<Compile Remove="**\*Spec*.cs" />
<Compile Remove="**\*Fixture*.cs" />
```

**建议添加测试:**
```powershell
# 创建测试项目
dotnet new xunit -n CervicalLesionSystem.Tests

# 添加测试引用
dotnet add reference ..\src\CervicalLesionSystem\CervicalLesionSystem.csproj

# 运行测试
dotnet test
```

### 前端测试

前端为静态页面,建议进行:
- **手动测试**: 在不同浏览器中测试功能
- **响应式测试**: 测试不同屏幕尺寸下的显示效果
- **性能测试**: 使用浏览器开发者工具检查加载性能

## API 接口

系统提供 RESTful API 接口 (详见 `docs/API_REFERENCE.md`):

### 核心接口

**影像预处理:**
```csharp
POST /api/image/preprocess
Content-Type: multipart/form-data

参数:
- sourceImage: 原始医学影像文件
- preprocessingOptions: 预处理选项 (JSON)

返回: 预处理后的影像数据
```

**病变分割:**
```csharp
POST /api/lesion/segment
Content-Type: application/json

参数:
- imageData: Base64编码的影像数据
- modelPath: 模型路径

返回: 分割结果 (病变区域坐标)
```

**风险评估:**
```csharp
POST /api/risk/assess
Content-Type: application/json

参数:
- lesionData: 病变分析结果
- clinicalData: 临床数据

返回: 风险评估报告
```

## 健康检查

系统提供健康检查端点:

```
GET /health
返回: 200 OK (系统正常)

GET /system-status
返回: "宫颈病变智能风险评估与辅助诊断系统运行正常"
```

## 部署说明

### 后端部署

1. **发布应用程序**
   ```powershell
   dotnet publish -c Release -r win-x64 --self-contained
   ```

2. **部署清单**
   - 可执行文件: `CervicalLesionSystem.exe`
   - 配置文件: `appsettings.json`
   - AI模型文件: `models/*.onnx`
   - 运行时依赖: OpenCvSharpExtern.dll 等

3. **环境变量**
   ```powershell
   # 设置环境 (可选)
   $env:ASPNETCORE_ENVIRONMENT="Production"
   ```

### 前端部署

前端静态页面可部署到任何Web服务器:
- IIS
- Nginx
- Apache
- 云存储 (如 Azure Blob Storage, AWS S3)

## 故障排查

### 常见问题

**1. 模型文件未找到**
```
错误: 指定的模型文件未找到: models\lesion_segmentation.onnx
解决: 检查 appsettings.json 中的 ModelSettings 路径配置
```

**2. 数据库连接失败**
```
错误: 无法连接到数据库
解决: 检查 appsettings.json 中的 DatabaseSettings:ConnectionString
```

**3. 端口占用**
```
错误: 地址已在使用中
解决: 修改 Properties/launchSettings.json 中的端口配置
```

**4. 前端页面样式异常**
```
问题: 图标不显示或图表无法加载
解决: 检查网络连接,确保 CDN 资源可访问
      - Lucide Icons: https://unpkg.com/lucide@latest
      - ECharts: https://cdn.jsdelivr.net/npm/echarts@5.4.3
```

## 扩展开发

### 添加新的AI模型

1. 将 ONNX 模型文件放置到 `models/` 目录
2. 在 `appsettings.json` 中配置模型路径
3. 在 `AIModelService.cs` 中添加加载逻辑
4. 更新 `LesionSegmenter.cs` 或创建新的分析器类

### 添加新的前端页面

1. 创建新的 HTML 文件
2. 复制导航栏代码 (保持一致性)
3. 引入必要的 CSS 和 JavaScript 库
4. 在所有页面的导航菜单中添加链接

### 自定义报告模板

编辑 `Utilities/ExportTemplateManager.cs` 以自定义报告格式和内容。

## 许可证

MIT License

## 联系方式

- 公司: MedicalAI Solutions
- 项目地址: https://github.com/medicalai/cervical-lesion-system
- 版本: 1.0.0

---

**最后更新**: 2025-12-17

**注意**: 本系统用于医疗辅助诊断,所有AI分析结果仅供参考,最终诊断需由专业医师确认。
