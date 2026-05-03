import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const text =
  "CervixDetectAI，用云端人工智能降低宫颈癌筛查门槛。基层机构上传液基细胞学影像，即可获得辅助分析、医生报告和随访提醒。按次、按年、定制化 SaaS 交付，让筛查服务更快复制、更低成本运营。";

const outDir = join(process.cwd(), "public", "voiceover");
const finalPath = join(outDir, "business-20s.mp3");
const tempAiff = join(outDir, "business-20s.aiff");
const fallbackWavPath = join(outDir, "business-20s.wav");
const localEdgeTts = join(process.cwd(), ".venv-edge-tts", "bin", "edge-tts");
let generatedPath = "";

mkdirSync(outDir, { recursive: true });

const hasCommand = (command) => spawnSync("zsh", ["-lc", `command -v ${command}`], { encoding: "utf8" }).status === 0;

const tryEdgeTts = () => {
  const command = existsSync(localEdgeTts) ? localEdgeTts : hasCommand("edge-tts") ? "edge-tts" : null;
  if (!command) {
    return false;
  }

  const edge = spawnSync(
    command,
    [
      "--voice",
      "zh-CN-YunyangNeural",
      "--rate",
      "+10%",
      "--volume",
      "+0%",
      "--text",
      text,
      "--write-media",
      finalPath,
    ],
    { stdio: "inherit" },
  );
  const ok = edge.status === 0 && existsSync(finalPath);
  if (ok) {
    generatedPath = finalPath;
  }
  return ok;
};

const generateWithSay = () => {
  const voiceCandidates = ["Ting-Ting", "Sin-ji", "Mei-Jia"];
  let generated = false;

  for (const voice of voiceCandidates) {
    const result = spawnSync("say", ["-v", voice, "-r", "215", "-o", tempAiff, text], { stdio: "inherit" });
    if (result.status === 0 && existsSync(tempAiff)) {
      generated = true;
      break;
    }
  }

  if (!generated) {
    const result = spawnSync("say", ["-r", "215", "-o", tempAiff, text], { stdio: "inherit" });
    generated = result.status === 0 && existsSync(tempAiff);
  }

  if (!generated) {
    throw new Error("无法生成系统配音：say 命令不可用或没有可用中文语音。");
  }

  const convert = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16@44100", tempAiff, fallbackWavPath], {
    stdio: "inherit",
  });
  if (convert.status !== 0 || !existsSync(fallbackWavPath)) {
    throw new Error("无法将系统配音转换为 WAV。");
  }

  console.warn(`edge-tts 不可用，已降级生成系统配音：${fallbackWavPath}`);
  generatedPath = fallbackWavPath;
};

if (!tryEdgeTts()) {
  generateWithSay();
}

if (existsSync(tempAiff)) {
  rmSync(tempAiff);
}

console.log(`Generated voiceover: ${generatedPath || finalPath}`);
