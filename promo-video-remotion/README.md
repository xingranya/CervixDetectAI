# CervixDetectAI 20 秒商务路演视频

这是为 PPT 评审展示制作的 Remotion 商务路演短片，横版 16:9，20 秒，1920x1080，30fps，包含真实液基细胞学影像、中文配音、原创背景音乐和动作音效。

## 产物

- `out/cervixdetectai-intro-business-20s.mp4`：最终版，适合直接插入 PPT。
- `out/business-frame-150-v4.png`、`out/business-frame-300-v4.png`、`out/business-frame-450-v4.png`、`out/business-frame-570-v4.png`：关键帧检查图。

## 叙事重点

- 真实影像：使用 `public/tct-source.png` 展示液基细胞学图像。
- AI 能力：扫描线、识别框、局部放大镜和置信度锁定。
- 商务价值：突出基层机构低门槛接入、云端 AI 降低设备与人力成本。
- SaaS 交付：按次、包月、年度订阅与定制交付。
- 闭环服务：报告归档、医生复核、随访提醒与持续服务收入。

## 常用命令

```bash
python3 -m venv .venv-edge-tts
.venv-edge-tts/bin/python -m pip install --upgrade pip edge-tts
npm run generate:music
npm run generate:voiceover
npm run lint
npx remotion still CervixDetectAIIntro --scale=0.25 --frame=150 out/business-frame-150.png
npx remotion render CervixDetectAIIntro out/cervixdetectai-intro-business-20s.mp4 --codec=h264 --crf=18 --concurrency=4
```

## 入口文件

- `src/Root.tsx`：Remotion composition 注册。
- `src/Composition.tsx`：20 秒完整分镜、动画、音频和转场。
- `scripts/generate-music.mjs`：生成原创背景音乐与音效。
- `scripts/generate-voiceover.mjs`：生成中文配音；优先 `edge-tts`，不可用时使用 macOS `say` 降级。
