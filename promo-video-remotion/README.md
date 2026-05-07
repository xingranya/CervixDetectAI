# CervixDetectAI 视频生成教程

这是 `CervixDetectAI` 项目下的视频工程，基于 Remotion 生成 PPT 展示视频。当前主要包含三类成片：

- `20 秒商务路演视频`
- `第 2 页影像存储与异步分析任务队列循环动画`
- `第 3 页病例数据闭环与医生归档报告循环动画`

默认输出规格：

- `16:9`
- `1920x1080`
- `30fps`

## 产物位置

- `out/cervixdetectai-intro-business-20s.mp4`
  20 秒商务路演成片，适合放在 PPT 首页或章节页。
- `out/cervixdetectai-queue-flow-loop.mp4`
  第 2 页“影像存储与异步分析任务队列”循环动画，适合在 PPT 中循环播放。
- `out/cervixdetectai-report-closure-loop.mp4`
  第 3 页“病例数据闭环与医生归档报告”循环动画，适合在 PPT 中循环播放。
- `out/business-frame-150-v4.png`、`out/business-frame-300-v4.png`、`out/business-frame-450-v4.png`、`out/business-frame-570-v4.png`
  历史关键帧检查图。

## 目录说明

- `src/Root.tsx`
  Remotion composition 注册入口。
- `src/Composition.tsx`
  20 秒商务路演视频主文件。
- `src/QueueFlowLoop.tsx`
  第 2 页动态流程图循环动画主文件。
- `src/ReportClosureLoop.tsx`
  第 3 页数据闭环与归档报告循环动画主文件。
- `scripts/generate-music.mjs`
  生成背景音乐与音效。
- `scripts/generate-voiceover.mjs`
  生成中文配音；优先使用 `edge-tts`，不可用时降级到 macOS `say`。

## 使用前提

在当前视频工程目录中执行命令：

```bash
cd promo-video-remotion
```

建议先确认：

- 已安装 `Node.js` 和 `npm`
- 已执行过 `npm install`
- 如果要生成中文配音，建议准备项目内虚拟环境 `.venv-edge-tts`

## 环境准备

### 1. 安装 Node 依赖

```bash
npm install
```

### 2. 准备中文配音环境

```bash
python3 -m venv .venv-edge-tts
.venv-edge-tts/bin/python -m pip install --upgrade pip edge-tts
```

## 最常用命令

### 启动预览

```bash
npm run dev
```

启动后可在 Remotion Studio 中预览：

- `CervixDetectAIIntro`
- `CervixDetectAIQueueFlowLoop`
- `CervixDetectAIReportClosureLoop`

### 检查代码

```bash
npm run lint
```

### 生成背景音乐

```bash
npm run generate:music
```

### 生成中文配音

```bash
npm run generate:voiceover
```

### 导出 20 秒商务路演视频

```bash
npm run render:business
```

### 导出第 2 页循环流程动画

```bash
npm run render:queue-flow
```

### 导出第 3 页数据闭环循环动画

```bash
npm run render:report-closure
```

## 单帧检查命令

正式导出前，建议先渲染单帧，检查版式、颜色、文案和重叠问题。

### 检查商务路演视频

```bash
npx remotion still CervixDetectAIIntro --scale=0.25 --frame=150 out/business-frame-150.png
```

### 检查流程图循环动画

```bash
npx remotion still CervixDetectAIQueueFlowLoop --scale=0.25 --frame=90 out/queue-flow-frame-90.png
```

### 检查第 3 页数据闭环动画

```bash
npx remotion still CervixDetectAIReportClosureLoop --scale=0.25 --frame=90 out/report-closure-frame-90.png
```

## 推荐操作流程

如果你要修改并重新生成视频，建议按下面顺序执行。

### 场景 1：修改后先本地预览

```bash
cd promo-video-remotion
npm install
npm run lint
npm run dev
```

### 场景 2：先检查单帧，再正式导出流程图动画

```bash
cd promo-video-remotion
npm run lint
npx remotion still CervixDetectAIQueueFlowLoop --scale=0.25 --frame=90 out/queue-flow-frame-90.png
npm run render:queue-flow
```

### 场景 3：先检查单帧，再正式导出第 3 页数据闭环动画

```bash
cd promo-video-remotion
npm run lint
npx remotion still CervixDetectAIReportClosureLoop --scale=0.25 --frame=90 out/report-closure-frame-90.png
npm run render:report-closure
```

### 场景 4：先检查单帧，再正式导出商务路演视频

```bash
cd promo-video-remotion
npm run lint
npx remotion still CervixDetectAIIntro --scale=0.25 --frame=150 out/business-frame-150.png
npm run render:business
```

## 一组可直接复制的完整命令

### 只导出流程图动画

```bash
cd promo-video-remotion
npm run lint
npm run render:queue-flow
```

### 只导出第 3 页数据闭环动画

```bash
cd promo-video-remotion
npm run lint
npm run render:report-closure
```

### 只导出商务路演片

```bash
cd promo-video-remotion
npm run lint
npm run render:business
```

### 生成配音和音乐后再导出商务路演片

```bash
cd promo-video-remotion
python3 -m venv .venv-edge-tts
.venv-edge-tts/bin/python -m pip install --upgrade pip edge-tts
npm install
npm run generate:music
npm run generate:voiceover
npm run lint
npm run render:business
```

## 常见修改入口

### 修改 20 秒商务路演视频

- 改镜头、文案、动画、节奏：
  `src/Composition.tsx`
- 改中文配音逻辑：
  `scripts/generate-voiceover.mjs`
- 改背景音乐逻辑：
  `scripts/generate-music.mjs`

### 修改第 2 页循环流程图

- 改流程图结构、颜色、圆角、文案、布局、状态卡：
  `src/QueueFlowLoop.tsx`

### 修改第 3 页数据闭环循环动画

- 改数据链路、归档报告结构、趋势图、闭环文案：
  `src/ReportClosureLoop.tsx`

## 当前视频内容重点

### 商务路演视频

- 真实影像：使用 `public/tct-source.png` 展示液基细胞学图像
- AI 能力：扫描线、识别框、局部放大镜、置信度锁定
- 商务价值：突出基层机构低门槛接入、云端 AI 降低设备与人力成本
- SaaS 交付：按次、包月、年度订阅与定制交付
- 闭环服务：报告归档、医生复核、随访提醒与持续服务收入

### 第 2 页循环流程图

- 本地持久化与图仓双路径
- 远程 URL 优先与本地回退
- 异步任务队列
- 轮询、重试、并发与状态回传

### 第 3 页循环流程图

- Patient → Study → StudyImage → AnalysisTask → AnalysisResult → MedicalReport
- 医生归档版 PDF 结构
- 最近 6 次风险权重与置信度趋势
- 页面标注与 PDF 标注共用同一套坐标转换逻辑

## 交付建议

- 插入 PPT 的循环页，优先使用：
  `out/cervixdetectai-queue-flow-loop.mp4`
- 第 3 页闭环展示，优先使用：
  `out/cervixdetectai-report-closure-loop.mp4`
- 首页或章节展示，优先使用：
  `out/cervixdetectai-intro-business-20s.mp4`
- 每次改完布局或文案，先跑 `still` 单帧检查，再正式 `render`
