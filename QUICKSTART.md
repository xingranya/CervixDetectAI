# CervixDetectAI 快速启动指南

## 第一步：配置后端服务

### 1. 进入server目录并配置环境变量

```bash
cd server
cp .env.example .env
```

### 2. 编辑 `.env` 文件，填入你的通义千问API密钥

```env
QWEN_API_KEY=sk-your-api-key-here
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-max
PORT=3000
```

> 💡 **获取API密钥：**
> 1. 访问 https://dashscope.aliyuncs.com/
> 2. 登录阿里云账号
> 3. 创建API密钥
> 4. 复制密钥到 .env 文件

### 3. 启动后端服务

```bash
npm start
```

你应该看到：

```
🚀 CervixDetectAI 后端服务已启动
📡 服务地址: http://localhost:3000
🏥 API基础路径: http://localhost:3000/api
💾 上传目录: C:\...\server\uploads
📄 报告目录: C:\...\server\reports
🤖 通义千问模型: qwen-vl-max
```

## 第二步：配置并启动前端

### 1. 在项目根目录创建 `.env` 文件（如果不存在）

```bash
# 回到项目根目录
cd ..

# 复制环境变量示例
copy .env.example .env
```

### 2. 确认 `.env` 配置正确

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAX_FILE_SIZE=10485760
VITE_SUPPORTED_IMAGE_FORMATS=.jpg,.jpeg,.png,.tiff
```

### 3. 启动前端开发服务器

```bash
npm run dev
```

## 第三步：测试系统

### 1. 访问应用

打开浏览器访问：`http://localhost:9000`（或终端显示的地址）

### 2. 登录系统

使用任意邮箱登录（暂时还是模拟登录）

### 3. 上传图像测试

1. 点击"上传新病例"
2. 填写病例信息：
   - 患者姓名：测试患者
   - 患者ID：P001
   - 检查日期：选择今天
   - 检查方式：阴道镜检查
3. 上传一张宫颈图像（JPG/PNG/TIFF格式，<10MB）
4. 点击"上传并分析"

### 4. 观察分析过程

- 上传成功后会自动跳转到病例详情页
- 可以看到分析进度从 PENDING → PROCESSING → SUCCESS
- 完成后显示AI分析结果：
  - 诊断结论
  - 置信度
  - 生物标志物
  - 临床建议
  - 详细报告

## 常见问题

### Q1: 后端启动失败

**A:** 检查以下几点：
- 是否已安装node_modules：`npm install`
- 是否配置了 .env 文件
- API密钥是否正确
- 3000端口是否被占用

### Q2: 前端无法连接后端

**A:** 确认：
- 后端服务是否已启动
- `.env` 中的 `VITE_API_BASE_URL` 是否正确
- 浏览器控制台是否有CORS错误

### Q3: 上传失败

**A:** 检查：
- 图像格式是否支持（JPG/PNG/TIFF）
- 图像大小是否小于10MB
- 后端日志中的错误信息

### Q4: API调用失败

**A:** 查看：
- 通义千问API密钥是否有效
- API额度是否充足
- 网络连接是否正常

## 开发调试

### 查看后端日志

后端会输出详细的日志：
- 🤖 调用通义千问API
- ✅ API调用成功
- ❌ API调用失败
- 📝 创建分析任务

### 查看前端日志

打开浏览器开发者工具（F12），在Console中可以看到：
- 📡 API请求
- ✅ API响应
- 🔄 开始轮询任务状态
- 🎉 分析完成

### 测试API

使用curl测试上传接口：

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@test.jpg" \
  -F "patientName=测试患者" \
  -F "patientId=P001" \
  -F "studyDate=2024-01-01" \
  -F "modality=阴道镜检查"
```

## 下一步

✅ 核心AI集成已完成！

接下来可以：
1. 实现PDF报告生成功能
2. 添加对话交互功能
3. 集成电子签名
4. 实现离线支持

参考设计文档：`E:\HTML+CSS\CervixDetectAI\.qoder\quests\feature-optimization-api-integration.md`
