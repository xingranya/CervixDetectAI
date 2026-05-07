import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

export const AI_ENGINE_LOOP_WIDTH = 1920;
export const AI_ENGINE_LOOP_HEIGHT = 1080;
export const AI_ENGINE_LOOP_FPS = 30;
export const AI_ENGINE_LOOP_TOTAL_FRAMES = 12 * AI_ENGINE_LOOP_FPS;

const palette = {
  bg: "#f7fbff",
  ink: "#12304f",
  text: "#274860",
  muted: "#70869a",
  panel: "rgba(255,255,255,0.9)",
  line: "#bdd5e9",
  blue: "#1e66d0",
  blueSoft: "#e4efff",
  teal: "#1f8a70",
  tealSoft: "#e2f6f0",
  amber: "#f0a51d",
  amberSoft: "#fff1d5",
  coral: "#e65f50",
  coralSoft: "#ffe7e2",
  violet: "#6b62c9",
  violetSoft: "#eeedff",
  shadow: "0 20px 52px rgba(60, 94, 128, 0.13)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeSoft = Easing.bezier(0.45, 0, 0.55, 1);
const easePop = Easing.bezier(0.34, 1.32, 0.64, 1);

const ramp = (frame: number, start: number, end: number, easing = easeOut) =>
  interpolate(frame, [start, end], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const pulse = (frame: number, offset: number, duration = 168) => {
  const local = (frame + offset) % duration;
  return Math.min(
    ramp(local, 8, 34, easePop),
    interpolate(local, [88, 130], [1, 0], {
      easing: easeSoft,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
};

const panelStyle: CSSProperties = {
  borderRadius: 24,
  background: palette.panel,
  border: "1px solid rgba(123,154,186,0.24)",
  boxShadow: palette.shadow,
  overflow: "hidden",
};

const sampleImage = staticFile("cervix-ai-engine-sample.jpg");

type IconName =
  | "cells"
  | "droplet"
  | "slide"
  | "virus"
  | "stain"
  | "scope"
  | "prompt"
  | "shield"
  | "imageCheck"
  | "quality"
  | "target"
  | "biomarker"
  | "brain"
  | "diagnosis"
  | "confidence"
  | "pin"
  | "recommend"
  | "doctor"
  | "json";

const SvgIcon = ({ name, color = "currentColor", size = 28 }: { name: IconName; color?: string; size?: number }) => {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, ReactNode> = {
    cells: (
      <>
        <circle cx="15" cy="15" r="5" {...common} />
        <circle cx="28" cy="23" r="6" {...common} />
        <circle cx="16" cy="30" r="4" {...common} />
      </>
    ),
    droplet: <path d="M22 6c6 7 10 12 10 18a10 10 0 0 1-20 0c0-6 4-11 10-18Z" {...common} />,
    slide: (
      <>
        <rect x="8" y="11" width="28" height="22" rx="5" {...common} />
        <path d="M14 17h16M14 23h10M14 29h14" {...common} />
      </>
    ),
    virus: (
      <>
        <circle cx="22" cy="22" r="8" {...common} />
        <path d="M22 6v6M22 32v6M6 22h6M32 22h6M10.7 10.7l4.2 4.2M29.1 29.1l4.2 4.2M33.3 10.7l-4.2 4.2M14.9 29.1l-4.2 4.2" {...common} />
      </>
    ),
    stain: (
      <>
        <circle cx="16" cy="17" r="5" {...common} />
        <circle cx="27" cy="27" r="6" {...common} />
        <path d="M28 12c4 2 5 6 3 10" {...common} />
      </>
    ),
    scope: (
      <>
        <path d="M17 8h8v8l-4 4-4-4V8Z" {...common} />
        <path d="M21 20v8M15 34h14M12 28h18" {...common} />
        <path d="M27 13h5v8h-5" {...common} />
      </>
    ),
    prompt: (
      <>
        <rect x="8" y="10" width="28" height="24" rx="5" {...common} />
        <path d="m15 18 4 4-4 4M23 27h7" {...common} />
      </>
    ),
    shield: (
      <>
        <path d="M22 7 34 12v9c0 8-5 13-12 16-7-3-12-8-12-16v-9l12-5Z" {...common} />
        <path d="m17 22 3 3 7-8" {...common} />
      </>
    ),
    imageCheck: (
      <>
        <rect x="8" y="10" width="28" height="24" rx="5" {...common} />
        <path d="m13 28 6-7 5 5 3-3 5 5" {...common} />
        <path d="m25 16 3 3 5-6" {...common} />
      </>
    ),
    quality: (
      <>
        <circle cx="22" cy="22" r="13" {...common} />
        <path d="M22 13v9l6 4" {...common} />
      </>
    ),
    target: (
      <>
        <circle cx="22" cy="22" r="13" {...common} />
        <circle cx="22" cy="22" r="6" {...common} />
        <path d="M22 5v6M22 33v6M5 22h6M33 22h6" {...common} />
      </>
    ),
    biomarker: (
      <>
        <path d="M16 8c8 6 8 22 0 28M28 8c-8 6-8 22 0 28" {...common} />
        <path d="M17 14h10M16 22h12M17 30h10" {...common} />
      </>
    ),
    brain: (
      <>
        <path d="M17 13a6 6 0 0 0-6 6c0 2 1 4 3 5a6 6 0 0 0 6 8h5a6 6 0 0 0 6-8c2-1 3-3 3-5a6 6 0 0 0-7-6 6 6 0 0 0-10 0Z" {...common} />
        <path d="M19 14v18M25 14v18M14 24h16" {...common} />
      </>
    ),
    diagnosis: (
      <>
        <path d="M13 10h18v26H13z" {...common} />
        <path d="M17 17h10M17 23h10M17 29h6" {...common} />
      </>
    ),
    confidence: (
      <>
        <path d="M10 31a14 14 0 1 1 24 0" {...common} />
        <path d="m22 25 7-9" {...common} />
        <circle cx="22" cy="25" r="2" fill={color} />
      </>
    ),
    pin: (
      <>
        <path d="M22 38s10-9 10-19a10 10 0 0 0-20 0c0 10 10 19 10 19Z" {...common} />
        <circle cx="22" cy="19" r="4" {...common} />
      </>
    ),
    recommend: (
      <>
        <path d="M12 30h20M15 25c0-5 3-8 7-8s7 3 7 8" {...common} />
        <path d="M18 14a4 4 0 1 1 8 0" {...common} />
      </>
    ),
    doctor: (
      <>
        <circle cx="22" cy="15" r="6" {...common} />
        <path d="M11 36c2-8 7-12 11-12s9 4 11 12" {...common} />
        <path d="M31 29v8M27 33h8" {...common} />
      </>
    ),
    json: (
      <>
        <path d="M16 10c-4 0-5 3-5 6v3c0 2-1 3-3 3 2 0 3 1 3 3v3c0 3 1 6 5 6M28 10c4 0 5 3 5 6v3c0 2 1 3 3 3-2 0-3 1-3 3v3c0 3-1 6-5 6" {...common} />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const modalities = [
  { label: "宫颈细胞学", icon: "cells" as const, color: palette.blue, soft: palette.blueSoft },
  { label: "TCT / LCT", icon: "droplet" as const, color: palette.teal, soft: palette.tealSoft },
  { label: "HE 染色", icon: "slide" as const, color: palette.violet, soft: palette.violetSoft },
  { label: "HPV 检测", icon: "virus" as const, color: palette.amber, soft: palette.amberSoft },
  { label: "p16/Ki67 双染", icon: "stain" as const, color: palette.coral, soft: palette.coralSoft },
  { label: "阴道镜", icon: "scope" as const, color: palette.blue, soft: palette.blueSoft },
];

const outputRows = [
  { label: "诊断分类", value: "HSIL 风险提示", color: palette.blue, width: 0, icon: "diagnosis" as const },
  { label: "置信度", value: "92.4%", color: palette.teal, width: 92, icon: "confidence" as const },
  { label: "可疑区域", value: "2 处坐标", color: palette.coral, width: 54, icon: "pin" as const },
  { label: "生物标志物", value: "p16 / Ki67 阳性倾向", color: palette.violet, width: 0, icon: "biomarker" as const },
  { label: "临床建议", value: "建议医生复核与阴道镜评估", color: palette.amber, width: 0, icon: "recommend" as const },
];

const Background = () => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 82) * 18;
  const driftY = Math.cos(frame / 96) * 14;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #fbfdff 0%, #eef7fd 100%)", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,165,199,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(126,165,199,0.1) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
          transform: `translate(${driftX}px, ${driftY}px)`,
          opacity: 0.58,
        }}
      />
      <div style={{ position: "absolute", left: -220, top: -230, width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,102,208,0.16), rgba(30,102,208,0) 70%)", filter: "blur(18px)" }} />
      <div style={{ position: "absolute", right: -160, top: 70, width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle, rgba(31,138,112,0.14), rgba(31,138,112,0) 72%)", filter: "blur(18px)" }} />
      <div style={{ position: "absolute", left: 580, bottom: -330, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,165,29,0.12), rgba(240,165,29,0) 74%)", filter: "blur(20px)" }} />
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={{ position: "absolute", left: 72, right: 72, top: 38, display: "grid", gridTemplateColumns: "1fr 560px", gap: 38, alignItems: "start" }}>
    <div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: 999, background: "rgba(30,102,208,0.1)", color: palette.blue, fontSize: 17, fontWeight: 820 }}>
        <SvgIcon name="brain" size={22} color={palette.blue} />
        第 1 页 · AI 诊断引擎
      </div>
      <h1 style={{ margin: "12px 0 0", color: palette.ink, fontSize: 60, lineHeight: 1.03, fontWeight: 900, letterSpacing: 0 }}>
        多模态医学影像 AI 诊断引擎
      </h1>
    </div>
    <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.86)", border: "1px solid rgba(123,154,186,0.24)", boxShadow: "0 16px 38px rgba(64,94,125,0.1)", padding: "18px 24px", color: palette.text, fontSize: 21, lineHeight: 1.38, fontWeight: 660 }}>
      自研 <span style={{ color: palette.blue, fontWeight: 920 }}>CervixDetect-VL-Pro</span> 根据检查方式自适应生成专业提示词，完成图像类型、质量、异常区域与标志物的联合判读。
    </div>
  </div>
);

const ModalityInputs = () => {
  const frame = useCurrentFrame();

  return (
    <section style={{ position: "absolute", left: 100, top: 242, width: 315, height: 548 }}>
      <SectionTitle eyebrow="输入层" title="多模态自适应输入" />
      <div style={{ marginTop: 24, display: "grid", gap: 15 }}>
        {modalities.map((item, index) => {
          const active = pulse(frame, 286 - index * 18);
          return (
            <div
              key={item.label}
              style={{
                height: 58,
                display: "grid",
                gridTemplateColumns: "54px 1fr",
                alignItems: "center",
                gap: 14,
                color: palette.ink,
                transform: `translateX(${active * 4}px)`,
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: item.soft, color: item.color, display: "grid", placeItems: "center", boxShadow: `0 0 ${10 + active * 22}px ${item.color}24` }}>
                <SvgIcon name={item.icon} size={32} color={item.color} />
              </div>
              <div style={{ fontSize: 23, lineHeight: 1.1, fontWeight: 880 }}>{item.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PromptStrip = ({ frame }: { frame: number }) => {
  const sweep = ((frame * 2.2) % 360) / 360;

  return (
    <div style={{ position: "absolute", left: 34, right: 34, bottom: 32, height: 84, borderRadius: 20, background: "rgba(248,251,255,0.92)", border: "1px solid rgba(123,154,186,0.22)", boxShadow: "0 16px 34px rgba(62,96,128,0.09)", padding: "16px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: palette.blue, fontSize: 18, fontWeight: 860 }}>
          <SvgIcon name="prompt" size={25} color={palette.blue} />
          动态生成专业提示词
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {["方式匹配", "策略加载", "选项约束", "结构化输出"].map((line, index) => (
            <div key={line} style={{ height: 40, borderRadius: 12, background: index / 4 < sweep ? "rgba(30,102,208,0.12)" : "rgba(255,255,255,0.72)", color: index / 4 < sweep ? palette.blue : palette.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 15, fontWeight: 780 }}>
              <SvgIcon name={index === 3 ? "json" : "prompt"} size={18} color={index / 4 < sweep ? palette.blue : palette.muted} />
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TechTag = ({ text, color, left, top }: { text: string; color: string; left: number; top: number }) => (
  <div style={{ position: "absolute", left, top, borderRadius: 999, background: "rgba(255,255,255,0.72)", border: `1px solid ${color}26`, color, padding: "5px 9px", fontSize: 11, lineHeight: 1, fontWeight: 820, letterSpacing: 0, boxShadow: `0 8px 18px ${color}12` }}>
    {text}
  </div>
);

const ProcessingCenter = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + Math.sin(frame / 18) * 0.18;
  const scan = 32 + ((frame * 3.8) % 238);
  const promptFrame = frame;

  return (
    <section style={{ position: "absolute", left: 455, top: 190, width: 780, height: 746, ...panelStyle, borderRadius: 38, background: "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(228,239,255,0.72))" }}>
      <div style={{ position: "absolute", left: 34, right: 34, top: 28, display: "grid", gridTemplateColumns: "330px 1fr", gap: 24, alignItems: "start" }}>
        <SectionTitle eyebrow="处理中心" title="CervixDetect-VL-Pro" />
        <div style={{ color: palette.text, fontSize: 18, lineHeight: 1.34, fontWeight: 700 }}>
          统一接收多模态数据，总线入站后完成路由、判读与结构化分发。
        </div>
      </div>

      <div style={{ position: "absolute", left: 34, top: 118, width: 340, height: 424 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: palette.blue, fontSize: 17, fontWeight: 860 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SvgIcon name="imageCheck" size={23} color={palette.blue} />
            影像判读 · 真实影像
          </span>
          <span style={{ color: palette.muted, fontSize: 13, fontWeight: 760 }}>1024×1024</span>
        </div>
        <div style={{ marginTop: 12, position: "relative", height: 368, borderRadius: 23, overflow: "hidden", background: "#f8eef3", border: "1px solid rgba(123,154,186,0.22)", boxShadow: "0 18px 36px rgba(62,96,128,0.1)" }}>
          <Img src={sampleImage} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.07)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,48,79,0), rgba(18,48,79,0.08))" }} />
          <div style={{ position: "absolute", left: 24, right: 24, top: scan, height: 5, borderRadius: 99, background: "linear-gradient(90deg, rgba(30,102,208,0), rgba(30,102,208,0.95), rgba(30,102,208,0))", boxShadow: "0 0 24px rgba(30,102,208,0.48)" }} />
          <div style={{ position: "absolute", left: 156, top: 116, width: 90, height: 70, borderRadius: 14, border: `4px solid ${palette.coral}`, boxShadow: "0 0 24px rgba(230,95,80,0.44)" }} />
          <div style={{ position: "absolute", left: 74, top: 76, width: 68, height: 58, borderRadius: 14, border: "3px solid rgba(230,95,80,0.78)" }} />
          <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", alignItems: "center", gap: 8, borderRadius: 999, background: "rgba(255,255,255,0.9)", padding: "8px 12px", color: palette.coral, fontSize: 14, fontWeight: 850 }}>
            <SvgIcon name="target" size={19} color={palette.coral} />
            可疑区域定位
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 422, top: 120, width: 300, height: 226, display: "grid", placeItems: "center" }}>
        <svg width="312" height="226" viewBox="0 0 312 226" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <circle cx="156" cy="112" r="92" fill="none" stroke={palette.blue} strokeWidth="2" opacity="0.18" />
          <circle cx="156" cy="112" r="66" fill="none" stroke={palette.teal} strokeWidth="2" opacity="0.2" strokeDasharray="8 10" />
          <path d="M78 112 H124M188 112 H236M156 34 V72M156 152 V190" stroke={palette.blue} strokeWidth="2.5" opacity="0.32" strokeLinecap="round" />
          <circle cx="78" cy="112" r="5" fill={palette.blue} opacity={0.78 + glow * 0.2} />
          <circle cx="236" cy="112" r="5" fill={palette.teal} opacity={0.78 + glow * 0.2} />
          <circle cx="156" cy="34" r="5" fill={palette.amber} opacity="0.78" />
          <circle cx="156" cy="190" r="5" fill={palette.violet} opacity="0.78" />
        </svg>
        <div style={{ width: 142, height: 116, borderRadius: 999, background: "rgba(255,255,255,0.74)", border: "1px solid rgba(30,102,208,0.22)", display: "grid", gridTemplateRows: "33px 1fr", alignItems: "center", justifyItems: "center", paddingTop: 15, boxShadow: `0 14px 36px rgba(31,91,139,${0.08 + glow * 0.05})`, backdropFilter: "blur(6px)" }}>
          <SvgIcon name="prompt" size={28} color={palette.blue} />
          <div style={{ color: palette.ink, fontSize: 16, lineHeight: 1.12, textAlign: "center", fontWeight: 930 }}>
            API 路由<br />核心
          </div>
        </div>
        <TechTag text="Prompt Assembly" color={palette.blue} left={2} top={26} />
        <TechTag text="Concurrent Routing" color={palette.teal} left={176} top={24} />
        <TechTag text="Result Parser" color={palette.violet} left={180} top={174} />
      </div>

      <svg width="780" height="746" viewBox="0 0 780 746" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        <path d="M354 288 H510" stroke={palette.blue} strokeWidth="5" strokeLinecap="round" opacity="0.78" />
        <polygon points="505,288 489,277 489,299" fill={palette.blue} />
        <path d="M566 320 V364" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" opacity="0.72" strokeDasharray="8 8" />
        <path d="M438 364 H694" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <path d="M438 364 V388M566 364 V388M694 364 V388" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <circle cx="438" cy="388" r="5" fill={palette.blue} opacity="0.75" />
        <circle cx="566" cy="388" r="5" fill={palette.teal} opacity="0.75" />
        <circle cx="694" cy="388" r="5" fill={palette.violet} opacity="0.75" />
      </svg>

      <div style={{ position: "absolute", left: 384, right: 34, top: 420, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "图像类型", value: "确认图像", color: palette.blue, icon: "imageCheck" as const },
          { label: "质量评估", value: "低质拦截", color: palette.teal, icon: "quality" as const },
          { label: "综合判别", value: "异常融合", color: palette.violet, icon: "biomarker" as const },
        ].map((step, index) => {
          const active = pulse(frame, 240 - index * 22);
          return (
            <div key={step.label} style={{ height: 122, borderRadius: 18, background: "rgba(255,255,255,0.88)", border: `1px solid ${step.color}33`, padding: "15px 10px", display: "grid", gridTemplateRows: "30px 24px 1fr", gap: 5, alignItems: "center", justifyItems: "center", textAlign: "center", overflow: "hidden", boxShadow: `0 0 ${10 + active * 18}px ${step.color}22` }}>
              <SvgIcon name={step.icon} size={28} color={step.color} />
              <div style={{ color: step.color, fontSize: 16, lineHeight: 1, fontWeight: 900 }}>{step.label}</div>
              <div style={{ color: palette.text, fontSize: 13, lineHeight: 1.18, fontWeight: 740, maxWidth: "100%" }}>{step.value}</div>
            </div>
          );
        })}
      </div>
      <PromptStrip frame={promptFrame} />
    </section>
  );
};

const OutputPanel = () => {
  const frame = useCurrentFrame();

  return (
    <section style={{ position: "absolute", left: 1280, top: 190, width: 540, height: 746, padding: 26, ...panelStyle, borderRadius: 28 }}>
      <SectionTitle eyebrow="输出层" title="高置信度诊断输出" />
      <div style={{ marginTop: 16, borderRadius: 18, background: "rgba(248,251,255,0.94)", border: "1px solid rgba(123,154,186,0.22)", padding: 15 }}>
        {outputRows.map((row, index) => {
          const active = pulse(frame, 250 - index * 20);
          return (
            <div key={row.label} style={{ height: 62, display: "grid", gridTemplateColumns: "44px 122px 1fr", gap: 10, alignItems: "center", borderBottom: index === outputRows.length - 1 ? "none" : "1px solid rgba(123,154,186,0.16)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: `${row.color}16`, color: row.color, display: "grid", placeItems: "center", boxShadow: `0 0 ${8 + active * 12}px ${row.color}22` }}>
                <SvgIcon name={row.icon} size={25} color={row.color} />
              </div>
              <div style={{ color: row.color, fontSize: 18, fontWeight: 860 }}>
                {row.label}
              </div>
              <div style={{ color: palette.ink, fontSize: 19, fontWeight: 860 }}>
                {row.value}
                {row.width > 0 ? (
                  <div style={{ marginTop: 5, height: 5, borderRadius: 99, background: "rgba(112,134,154,0.16)", overflow: "hidden" }}>
                    <div style={{ width: `${row.width}%`, height: "100%", borderRadius: 99, background: row.color, boxShadow: `0 0 ${8 + active * 12}px ${row.color}` }} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <OutputBadge icon="diagnosis" label="诊断摘要" value="自动进入报告首页" color={palette.blue} />
        <OutputBadge icon="target" label="影像标注" value="可疑区域同步展示" color={palette.coral} />
        <OutputBadge icon="recommend" label="临床建议" value="辅助医生下一步判断" color={palette.amber} />
        <OutputBadge icon="doctor" label="医生复核" value="保留最终判定权" color={palette.teal} />
      </div>
    </section>
  );
};

const OutputBadge = ({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) => (
  <div style={{ height: 88, borderRadius: 18, background: `${color}12`, border: `1px solid ${color}30`, display: "grid", gridTemplateColumns: "48px 1fr", gap: 11, alignItems: "center", padding: "0 14px" }}>
    <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.76)", display: "grid", placeItems: "center", boxShadow: `0 0 18px ${color}20` }}>
      <SvgIcon name={icon} size={30} color={color} />
    </div>
    <div>
      <div style={{ color, fontSize: 17, fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 4, color: palette.ink, fontSize: 14.5, lineHeight: 1.2, fontWeight: 760 }}>{value}</div>
    </div>
  </div>
);

const DataFlow = () => {
  const frame = useCurrentFrame();
  const dot = (start: number, end: number, offset: number) => start + (((frame * 2.2 + offset) % 100) / 100) * (end - start);

  return (
    <svg width={AI_ENGINE_LOOP_WIDTH} height={AI_ENGINE_LOOP_HEIGHT} viewBox={`0 0 ${AI_ENGINE_LOOP_WIDTH} ${AI_ENGINE_LOOP_HEIGHT}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      <defs>
        <linearGradient id="pipeGradient" x1="0" x2="1">
          <stop offset="0%" stopColor={palette.teal} stopOpacity="0.25" />
          <stop offset="45%" stopColor={palette.blue} stopOpacity="0.92" />
          <stop offset="100%" stopColor={palette.coral} stopOpacity="0.78" />
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M395 330 V724" stroke={palette.blue} strokeWidth="7" opacity="0.26" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M395 330 V724" stroke={palette.blue} strokeWidth="3" opacity="0.72" strokeLinecap="round" />
      {[358, 431, 504, 577, 650, 723].map((y, index) => (
        <path key={y} d={`M372 ${y - 1} H395`} fill="none" stroke={modalities[index].color} strokeWidth="4" opacity="0.72" strokeLinecap="round" />
      ))}
      <path d="M395 500 H455" fill="none" stroke="url(#pipeGradient)" strokeWidth="24" opacity="0.2" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M395 500 H455" fill="none" stroke={palette.blue} strokeWidth="7" opacity="0.9" strokeLinecap="round" />
      <polygon points="450,500 434,489 434,511" fill={palette.blue} />
      <circle cx={dot(395, 455, 0)} cy={500} r={7} fill={palette.blue} filter="url(#softGlow)" />
      <path d="M1235 500 H1280" fill="none" stroke="url(#pipeGradient)" strokeWidth="26" opacity="0.24" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M1235 500 H1280" fill="none" stroke={palette.blue} strokeWidth="8" opacity="0.92" strokeLinecap="round" />
      <polygon points="1275,500 1259,489 1259,511" fill={palette.blue} />
      <circle cx={dot(1235, 1280, 42)} cy={500} r={8} fill={palette.coral} filter="url(#softGlow)" />
    </svg>
  );
};

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div>
    <div style={{ color: palette.blue, fontSize: 16, fontWeight: 840 }}>{eyebrow}</div>
    <div style={{ marginTop: 6, color: palette.ink, fontSize: 31, lineHeight: 1.12, fontWeight: 900 }}>{title}</div>
  </div>
);

export const AiDiagnosisEngineLoop: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.bg, color: palette.text, fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', overflow: "hidden" }}>
    <Background />
    <Header />
    <DataFlow />
    <ModalityInputs />
    <ProcessingCenter />
    <OutputPanel />
  </AbsoluteFill>
);
