import { Audio } from "@remotion/media";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const TOTAL_FRAMES = 20 * FPS;

const palette = {
  bg: "#06111d",
  ink: "#07131f",
  text: "#edf8ff",
  muted: "#b8cddd",
  blue: "#1976d2",
  blueSoft: "#74bcff",
  mint: "#26a69a",
  mintSoft: "#bff7ee",
  red: "#f87171",
  yellow: "#fde047",
  paper: "#eff8ff",
  panel: "rgba(232,245,255,0.09)",
  panelStrong: "rgba(232,245,255,0.16)",
  border: "rgba(144,202,249,0.28)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const popEase = Easing.bezier(0.34, 1.56, 0.64, 1);

const ramp = (frame: number, start: number, end: number, easing = easeOut) =>
  interpolate(frame, [start, end], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const sceneOpacity = (frame: number, start: number, end: number, fade = 12) => {
  const fadeIn = ramp(frame, start, start + fade, easeInOut);
  const fadeOut = interpolate(frame, [end - fade, end], [1, 0], {
    easing: easeInOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(fadeIn, fadeOut);
};

const local = (frame: number, start: number) => frame - start;

const shadow = "0 28px 80px rgba(0,0,0,0.34)";

const fullScene: CSSProperties = {
  backgroundColor: palette.bg,
  color: palette.text,
  fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  overflow: "hidden",
};

type SceneShellProps = {
  children: ReactNode;
  opacity: number;
  zIndex: number;
};

const SceneShell = ({ children, opacity, zIndex }: SceneShellProps) => (
  <AbsoluteFill
    style={{
      ...fullScene,
      opacity,
      zIndex,
      pointerEvents: "none",
    }}
  >
    <Background />
    {children}
  </AbsoluteFill>
);

const Background = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.9;
  const scanY = ((frame * 8) % 1220) - 140;

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(116,188,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(116,188,255,0.045) 1px, transparent 1px)",
          backgroundSize: "74px 74px",
          backgroundPosition: `${-drift}px ${-drift * 0.65}px`,
          maskImage: "radial-gradient(circle at 58% 42%, #000 0%, rgba(0,0,0,0.72) 50%, transparent 88%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          top: 40,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25,118,210,0.35), rgba(25,118,210,0) 70%)",
          filter: "blur(26px)",
          transform: `translate(${Math.sin(frame / 38) * 26}px, ${Math.cos(frame / 46) * 22}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          bottom: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(38,166,154,0.28), rgba(38,166,154,0) 70%)",
          filter: "blur(24px)",
          transform: `translate(${Math.cos(frame / 48) * 32}px, ${Math.sin(frame / 58) * 28}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: scanY,
          width: "100%",
          height: 120,
          background:
            "linear-gradient(180deg, rgba(38,166,154,0), rgba(38,166,154,0.14), rgba(38,166,154,0))",
          opacity: 0.74,
        }}
      />
    </>
  );
};

const Kicker = ({ children, progress }: { children: ReactNode; progress: number }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      width: "fit-content",
      padding: "11px 18px",
      borderRadius: 999,
      border: `1px solid rgba(38,166,154,${0.28 + progress * 0.28})`,
      background: "rgba(38,166,154,0.12)",
      color: palette.mintSoft,
      fontSize: 24,
      fontWeight: 750,
      opacity: progress,
      transform: `translateY(${(1 - progress) * 18}px)`,
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: palette.mint,
        boxShadow: "0 0 22px rgba(38,166,154,0.9)",
      }}
    />
    {children}
  </div>
);

const Title = ({
  children,
  progress,
  size = 86,
  maxWidth = 1040,
}: {
  children: ReactNode;
  progress: number;
  size?: number;
  maxWidth?: number;
}) => (
  <h1
    style={{
      margin: 0,
      maxWidth,
      color: palette.text,
      fontSize: size,
      lineHeight: 1.04,
      fontWeight: 900,
      letterSpacing: 0,
      textShadow: "0 22px 70px rgba(0,0,0,0.35)",
      opacity: progress,
      transform: `translateY(${(1 - progress) * 38}px) scale(${0.985 + progress * 0.015})`,
    }}
  >
    {children}
  </h1>
);

const Body = ({ children, progress, maxWidth = 880 }: { children: ReactNode; progress: number; maxWidth?: number }) => (
  <p
    style={{
      margin: 0,
      maxWidth,
      color: "#d2e4f0",
      fontSize: 32,
      lineHeight: 1.42,
      fontWeight: 420,
      opacity: progress,
      transform: `translateY(${(1 - progress) * 28}px)`,
    }}
  >
    {children}
  </p>
);

const MicroscopeFrame = ({
  image,
  progress,
  scan = 0,
  zoom = 1,
}: {
  image: string;
  progress: number;
  scan?: number;
  zoom?: number;
}) => {
  const frame = useCurrentFrame();
  const breath = Math.sin(frame / 36) * 0.012;

  return (
    <div
      style={{
        position: "relative",
        width: 935,
        height: 595,
        borderRadius: 36,
        overflow: "hidden",
        border: `1px solid rgba(144,202,249,${0.18 + progress * 0.24})`,
        background: "rgba(232,245,255,0.08)",
        boxShadow: shadow,
        opacity: progress,
        transform: `translateX(${(1 - progress) * 78}px) scale(${0.93 + progress * 0.07 + breath})`,
      }}
    >
      <Img
        src={image}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `saturate(${1.05 + scan * 0.3}) contrast(${1.02 + scan * 0.1})`,
          transform: `scale(${1.03 + zoom * 0.06})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 54% 48%, rgba(7,19,31,0) 0%, rgba(7,19,31,0.08) 54%, rgba(7,19,31,0.45) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: `${-110 + scan * 700}px`,
          width: "100%",
          height: 118,
          background:
            "linear-gradient(180deg, rgba(116,188,255,0), rgba(116,188,255,0.72), rgba(38,166,154,0.42), rgba(116,188,255,0))",
          mixBlendMode: "screen",
          opacity: scan > 0 ? 0.98 : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 24,
          padding: "9px 14px",
          borderRadius: 999,
          background: "rgba(7,19,31,0.72)",
          color: palette.mintSoft,
          fontSize: 18,
          fontFamily: "SFMono-Regular, Menlo, monospace",
          letterSpacing: 0,
        }}
      >
        LBC / TCT IMAGE
      </div>
    </div>
  );
};

const DetectionOverlay = ({ progress }: { progress: number }) => {
  const pulse = 1 + Math.sin(useCurrentFrame() / 8) * 0.025;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 214,
          width: 230,
          height: 160,
          borderRadius: 22,
          border: `3px solid ${palette.red}`,
          boxShadow: `0 0 ${24 + progress * 28}px rgba(248,113,113,0.55)`,
          opacity: progress,
          transform: `scale(${(0.72 + progress * 0.28) * pulse})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 663,
          top: 224,
          width: 250,
          padding: "14px 18px",
          borderRadius: 18,
          background: "rgba(7,19,31,0.82)",
          border: "1px solid rgba(248,113,113,0.48)",
          color: palette.text,
          opacity: progress,
          transform: `translateX(${(1 - progress) * 26}px)`,
        }}
      >
        <div style={{ color: palette.red, fontSize: 22, fontWeight: 900 }}>异常细胞簇锁定</div>
        <div style={{ marginTop: 8, fontSize: 34, fontWeight: 900, fontFamily: "SFMono-Regular, Menlo, monospace" }}>
          98.5%
        </div>
        <div style={{ marginTop: 4, color: palette.muted, fontSize: 17 }}>AI 辅助复核建议</div>
      </div>
    </>
  );
};

const Magnifier = ({ image, progress }: { image: string; progress: number }) => (
  <div
    style={{
      position: "absolute",
      right: 92,
      bottom: 82,
      width: 260,
      height: 260,
      borderRadius: "50%",
      border: `4px solid rgba(191,247,238,${0.3 + progress * 0.55})`,
      boxShadow: "0 28px 70px rgba(0,0,0,0.35), 0 0 42px rgba(38,166,154,0.25)",
      opacity: progress,
      transform: `translateY(${(1 - progress) * 42}px) scale(${0.8 + progress * 0.2})`,
      overflow: "hidden",
    }}
  >
    <Img
      src={image}
      style={{
        position: "absolute",
        left: -590,
        top: -300,
        width: 1660,
        height: 914,
        objectFit: "cover",
        filter: "saturate(1.25) contrast(1.12)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle, rgba(232,245,255,0) 45%, rgba(7,19,31,0.35) 100%)",
      }}
    />
  </div>
);

const DataParticle = ({ index, progress }: { index: number; progress: number }) => {
  const angle = index * 0.72;
  const x = 980 + Math.cos(angle) * (160 + (index % 5) * 42) + progress * (390 + (index % 4) * 20);
  const y = 530 + Math.sin(angle) * (140 + (index % 7) * 28) + Math.sin(progress * Math.PI + index) * 52;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 5 + (index % 3) * 2,
        height: 5 + (index % 3) * 2,
        borderRadius: "50%",
        background: index % 3 === 0 ? palette.mint : palette.blueSoft,
        opacity: progress * 0.78,
        boxShadow: "0 0 18px currentColor",
      }}
    />
  );
};

const CaptionBar = () => {
  const frame = useCurrentFrame();
  const captions = [
    { start: 10, end: 116, text: "云端 AI 降低宫颈癌筛查门槛" },
    { start: 116, end: 246, text: "上传液基细胞学影像，自动锁定可疑细胞簇" },
    { start: 246, end: 364, text: "基层机构无需重设备，即插即用接入 SaaS" },
    { start: 364, end: 498, text: "报告、随访、通知串联成持续服务闭环" },
    { start: 498, end: 600, text: "按次、按年、定制化交付，低成本复制筛查服务" },
  ];
  const active = captions.find((item) => frame >= item.start && frame < item.end);
  if (!active) {
    return null;
  }
  const inOut = Math.min(ramp(frame, active.start, active.start + 10), ramp(active.end - frame, 0, 10));

  return (
    <div
      style={{
        position: "absolute",
        left: 420,
        right: 420,
        bottom: 58,
        zIndex: 30,
        minHeight: 56,
        display: "grid",
        placeItems: "center",
        padding: "11px 28px",
        borderRadius: 999,
        border: "1px solid rgba(191,247,238,0.24)",
        background: "rgba(7,19,31,0.72)",
        color: palette.text,
        fontSize: 28,
        fontWeight: 760,
        lineHeight: 1.25,
        boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
        opacity: inOut,
        transform: `translateY(${(1 - inOut) * 16}px)`,
      }}
    >
      {active.text}
    </div>
  );
};

const TimelineAudio = () => (
  <>
    <Audio
      src={staticFile("audio/business-bed.wav")}
      volume={(f) =>
        interpolate(f, [0, 35, 520, 600], [0, 0.2, 0.18, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    <Sequence from={8}>
      <Audio src={staticFile("voiceover/business-20s.mp3")} volume={0.98} />
    </Sequence>
    <Sequence from={86}>
      <Audio src={staticFile("audio/scan-sweep.wav")} volume={0.36} />
    </Sequence>
    <Sequence from={138}>
      <Audio src={staticFile("audio/lock.wav")} volume={0.34} />
    </Sequence>
    <Sequence from={242}>
      <Audio src={staticFile("audio/whoosh.wav")} volume={0.26} />
    </Sequence>
    <Sequence from={386}>
      <Audio src={staticFile("audio/report-ding.wav")} volume={0.32} />
    </Sequence>
  </>
);

const FlowBeams = ({ progress }: { progress: number }) => (
  <svg
    viewBox="0 0 710 360"
    style={{
      position: "absolute",
      left: 790,
      top: 360,
      width: 710,
      height: 360,
      overflow: "visible",
      opacity: progress,
    }}
  >
    {[
      "M 18 260 C 180 150, 306 214, 496 72",
      "M 10 174 C 176 116, 304 128, 546 136",
      "M 24 92 C 178 120, 330 64, 604 218",
    ].map((d, index) => {
      const dash = 720;
      return (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={index === 1 ? "rgba(191,247,238,0.62)" : "rgba(116,188,255,0.44)"}
          strokeWidth={index === 1 ? 8 : 5}
          strokeLinecap="round"
          strokeDasharray={`${dash * 0.16} ${dash * 0.84}`}
          strokeDashoffset={dash * (1 - progress) - index * 120}
        />
      );
    })}
    <circle cx={24 + progress * 520} cy={174 - Math.sin(progress * Math.PI) * 44} r={10} fill={palette.mintSoft} />
  </svg>
);

const MicroscopeBusinessHero = ({ image }: { image: string }) => {
  const frame = useCurrentFrame();
  const o = sceneOpacity(frame, 0, 122, 10);
  const k = ramp(frame, 8, 24);
  const title = ramp(frame, 16, 40);
  const body = ramp(frame, 36, 58);
  const imageIn = ramp(frame, 4, 34, popEase);
  const stat = ramp(frame, 58, 82, popEase);

  return (
    <SceneShell opacity={o} zIndex={1}>
      <div style={{ position: "absolute", left: 104, top: 104, display: "flex", flexDirection: "column", gap: 28 }}>
        <Kicker progress={k}>20 秒商务路演版</Kicker>
        <Title progress={title} size={88} maxWidth={780}>
          云端 AI 降低宫颈癌筛查门槛
        </Title>
        <Body progress={body} maxWidth={780}>
          面向基层医疗机构，上传影像即可获得辅助分析、医生归档报告和后续随访服务。
        </Body>
      </div>
      <div style={{ position: "absolute", right: 92, top: 138 }}>
        <MicroscopeFrame image={image} progress={imageIn} zoom={ramp(frame, 52, 120) * 0.55} />
      </div>
      {[
        ["低硬件门槛", "云端推理"],
        ["即插即用", "SaaS 交付"],
        ["辅助复核", "医生工作流"],
      ].map(([value, label], index) => {
        const p = ramp(frame, 70 + index * 7, 92 + index * 7, popEase) * stat;
        return (
          <div
            key={value}
            style={{
              position: "absolute",
              left: 104 + index * 248,
              bottom: 116,
              width: 218,
              padding: "22px 24px",
              borderRadius: 22,
              border: `1px solid ${palette.border}`,
              background: palette.panel,
              opacity: p,
              transform: `translateY(${(1 - p) * 28}px)`,
            }}
          >
            <div style={{ color: palette.text, fontSize: 30, fontWeight: 900 }}>{value}</div>
            <div style={{ color: palette.muted, fontSize: 21, marginTop: 8 }}>{label}</div>
          </div>
        );
      })}
    </SceneShell>
  );
};

const AIScanValue = ({ image }: { image: string }) => {
  const frame = useCurrentFrame();
  const o = sceneOpacity(frame, 100, 258, 12);
  const f = local(frame, 100);
  const scan = ramp(f, 8, 56, easeInOut);
  const lock = ramp(f, 38, 58, popEase);
  const value = ramp(f, 60, 86);

  return (
    <SceneShell opacity={o} zIndex={2}>
      <div style={{ position: "absolute", left: 92, top: 128 }}>
        <MicroscopeFrame image={image} progress={ramp(f, 0, 24, popEase)} scan={scan} zoom={0.8} />
        <DetectionOverlay progress={lock} />
        <Magnifier image={image} progress={lock} />
      </div>
      <div style={{ position: "absolute", right: 118, top: 168, display: "flex", flexDirection: "column", gap: 24 }}>
        <Kicker progress={ramp(f, 16, 34)}>AI 辅助筛查</Kicker>
        <Title progress={ramp(f, 30, 52)} size={76} maxWidth={620}>
          先筛查，再复核，效率进入基层
        </Title>
        <Body progress={value} maxWidth={600}>
          识别可疑细胞簇，输出风险提示与置信度，把病理医生的复核压力前移到云端。
        </Body>
        <div
          style={{
            width: 570,
            height: 16,
            borderRadius: 999,
            background: "rgba(144,202,249,0.16)",
            overflow: "hidden",
            opacity: value,
          }}
        >
          <div
            style={{
              width: `${ramp(f, 82, 118, easeOut) * 86}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${palette.blue}, ${palette.mint}, ${palette.yellow})`,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            opacity: value,
            transform: `translateY(${(1 - value) * 22}px)`,
          }}
        >
          {["自动预筛", "医生复核", "结构化报告"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(232,245,255,0.1)",
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontSize: 22,
                fontWeight: 720,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};

const CloudSaaSFlow = () => {
  const frame = useCurrentFrame();
  const o = sceneOpacity(frame, 236, 378, 12);
  const f = local(frame, 236);
  const flow = ramp(f, 18, 106, easeInOut);
  const cloud = ramp(f, 32, 62, popEase);

  return (
    <SceneShell opacity={o} zIndex={3}>
      <FlowBeams progress={flow} />
      {Array.from({ length: 44 }, (_, index) => (
        <DataParticle key={index} index={index} progress={flow} />
      ))}
      <div style={{ position: "absolute", left: 122, top: 150, display: "flex", flexDirection: "column", gap: 24 }}>
        <Kicker progress={ramp(f, 4, 22)}>SaaS 降本增效</Kicker>
        <Title progress={ramp(f, 18, 40)} size={82} maxWidth={760}>
          不买重设备，也能接入智能筛查
        </Title>
        <Body progress={ramp(f, 44, 70)} maxWidth={790}>
          平台按次、按年与定制化交付，降低基层机构试用门槛，也让服务能持续运营。
        </Body>
      </div>
      <div
        style={{
          position: "absolute",
          right: 170,
          top: 180,
          width: 520,
          height: 520,
          borderRadius: "50%",
          border: `2px solid rgba(116,188,255,${0.18 + cloud * 0.34})`,
          background:
            "radial-gradient(circle, rgba(25,118,210,0.24), rgba(38,166,154,0.14) 46%, rgba(232,245,255,0.04) 68%, rgba(232,245,255,0) 72%)",
          boxShadow: "0 0 90px rgba(25,118,210,0.22)",
          opacity: cloud,
          transform: `scale(${0.72 + cloud * 0.28}) rotate(${frame * 0.08}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 244,
          top: 310,
          width: 380,
          padding: 34,
          borderRadius: 30,
          border: `1px solid ${palette.border}`,
          background: "rgba(7,19,31,0.72)",
          boxShadow: shadow,
          opacity: cloud,
          transform: `translateY(${(1 - cloud) * 38}px)`,
        }}
      >
        <div style={{ color: palette.blueSoft, fontSize: 24, fontFamily: "SFMono-Regular, Menlo, monospace" }}>CLOUD AI PLATFORM</div>
        <div style={{ marginTop: 16, color: palette.text, fontSize: 46, fontWeight: 900 }}>即插即用</div>
        <div style={{ marginTop: 12, color: "#edf8ff", fontSize: 32, lineHeight: 1.34, fontWeight: 560 }}>影像上传、任务队列、报告生成、权益发放统一接入。</div>
      </div>
      {["按次试用", "包月服务", "年度订阅", "定制交付"].map((label, index) => {
        const p = ramp(f, 74 + index * 6, 96 + index * 6, popEase);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 144 + index * 245,
              bottom: 134,
              padding: "20px 26px",
              borderRadius: 18,
              background: index === 0 ? "rgba(38,166,154,0.18)" : "rgba(232,245,255,0.1)",
              border: `1px solid ${index === 0 ? "rgba(38,166,154,0.5)" : palette.border}`,
              color: palette.text,
              fontSize: 28,
              fontWeight: 850,
              opacity: p,
              transform: `translateY(${(1 - p) * 42}px)`,
            }}
          >
            {label}
          </div>
        );
      })}
    </SceneShell>
  );
};

const BusinessLoop = () => {
  const frame = useCurrentFrame();
  const o = sceneOpacity(frame, 356, 504, 12);
  const f = local(frame, 356);
  const report = ramp(f, 12, 38, popEase);
  const trend = ramp(f, 52, 88, easeInOut);
  const notify = ramp(f, 74, 104, popEase);

  return (
    <SceneShell opacity={o} zIndex={4}>
      <div
        style={{
          position: "absolute",
          left: 124,
          top: 158,
          width: 610,
          height: 650,
          padding: 38,
          borderRadius: 34,
          background: palette.paper,
          color: palette.ink,
          boxShadow: shadow,
          opacity: report,
          transform: `translateX(${(1 - report) * -72}px) rotate(${(1 - report) * -2}deg)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>医生归档报告</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 22 }}>AI 结论 / 置信度 / 趋势</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(248,113,113,0.16)", color: "#b91c1c", fontSize: 20, fontWeight: 850 }}>
            辅助筛查
          </div>
        </div>
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                height: 52,
                borderRadius: 12,
                background: "rgba(25,118,210,0.1)",
                transform: `scaleX(${ramp(f, 34 + item * 4, 52 + item * 4)})`,
                transformOrigin: "left center",
              }}
            />
          ))}
        </div>
        <svg viewBox="0 0 560 210" style={{ width: "100%", height: 210, marginTop: 32, borderRadius: 18, background: "rgba(25,118,210,0.08)" }}>
          <path
            d="M 34 170 C 132 128, 188 152, 250 108 S 370 60, 430 88 S 500 134, 536 54"
            fill="none"
            stroke={palette.blue}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={760}
            strokeDashoffset={760 * (1 - trend)}
          />
        </svg>
        <div style={{ marginTop: 18, color: "#334155", fontSize: 26, lineHeight: 1.3 }}>报告完成后自动触达随访与通知，机构获得持续服务入口。</div>
      </div>
      <div style={{ position: "absolute", right: 128, top: 158, display: "flex", flexDirection: "column", gap: 22 }}>
        <Kicker progress={ramp(f, 16, 34)}>商业闭环</Kicker>
        <Title progress={ramp(f, 30, 54)} size={74} maxWidth={660}>
          一次筛查，延展为机构服务
        </Title>
        <Body progress={ramp(f, 54, 76)} maxWidth={640}>
          报告、随访、通知和套餐权益串联，平台不只是工具，而是可持续运营的筛查服务。
        </Body>
      </div>
      {[
        ["报告完成", "医生复核"],
        ["高风险提醒", "站内通知"],
        ["随访计划", "持续服务"],
      ].map(([title, subtitle], index) => {
        const p = ramp(f, 80 + index * 8, 104 + index * 8, popEase) * notify;
        return (
          <div
            key={title}
            style={{
              position: "absolute",
              right: 150,
              top: 578 + index * 104,
              width: 390,
              padding: "15px 22px",
              borderRadius: 20,
              background: "rgba(232,245,255,0.11)",
              border: `1px solid ${palette.border}`,
              opacity: p,
              transform: `translateX(${(1 - p) * 48}px)`,
            }}
          >
            <div style={{ color: palette.text, fontSize: 27, fontWeight: 900 }}>{title}</div>
            <div style={{ color: palette.muted, fontSize: 20, marginTop: 5 }}>{subtitle}</div>
          </div>
        );
      })}
    </SceneShell>
  );
};

const FinalBusinessMap = ({ progress }: { progress: number }) => {
  const frame = useCurrentFrame();
  const nodes = [
    { label: "影像上传", x: 318, y: 92, color: palette.blueSoft },
    { label: "AI分析", x: 492, y: 244, color: palette.mintSoft },
    { label: "医生报告", x: 384, y: 456, color: palette.paper },
    { label: "随访触达", x: 132, y: 454, color: palette.mintSoft },
    { label: "订阅交付", x: 42, y: 220, color: palette.yellow },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 190,
        width: 640,
        height: 640,
        opacity: progress,
        transform: `scale(${0.82 + progress * 0.18}) rotate(${Math.sin(frame / 70) * 1.4}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid rgba(116,188,255,${0.22 + progress * 0.36})`,
          background:
            "radial-gradient(circle, rgba(38,166,154,0.18), rgba(25,118,210,0.13) 48%, rgba(232,245,255,0.05) 68%, rgba(232,245,255,0) 73%)",
          boxShadow: "0 0 95px rgba(38,166,154,0.18)",
        }}
      />
      <svg viewBox="0 0 640 640" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path
          d="M 320 320 L 350 126 M 320 320 L 520 278 M 320 320 L 418 486 M 320 320 L 182 484 M 320 320 L 90 256"
          fill="none"
          stroke="rgba(191,247,238,0.34)"
          strokeWidth={4}
          strokeDasharray={620}
          strokeDashoffset={620 * (1 - progress)}
          strokeLinecap="round"
        />
        <circle cx="320" cy="320" r="214" fill="none" stroke="rgba(116,188,255,0.2)" strokeWidth={3} strokeDasharray="10 18" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 236,
          top: 236,
          width: 168,
          height: 168,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(38,166,154,0.94), rgba(25,118,210,0.92))",
          border: "1px solid rgba(191,247,238,0.5)",
          color: palette.text,
          boxShadow: "0 0 55px rgba(38,166,154,0.42)",
          fontSize: 32,
          fontWeight: 950,
          textAlign: "center",
          lineHeight: 1.12,
        }}
      >
        云端
        <br />
        AI平台
      </div>
      {nodes.map((node, index) => {
        const p = ramp(local(frame, 486), 54 + index * 6, 76 + index * 6, popEase) * progress;
        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: 148,
              height: 78,
              display: "grid",
              placeItems: "center",
              borderRadius: 999,
              border: `1px solid ${palette.border}`,
              background: "rgba(7,19,31,0.72)",
              color: node.color,
              fontSize: 24,
              fontWeight: 900,
              boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
              opacity: p,
              transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + p * 0.1})`,
            }}
          >
            {node.label}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 214,
          bottom: 68,
          width: 212,
          padding: "13px 18px",
          borderRadius: 999,
          background: "rgba(253,224,71,0.14)",
          border: "1px solid rgba(253,224,71,0.4)",
          color: palette.yellow,
          fontSize: 24,
          fontWeight: 900,
          textAlign: "center",
          opacity: progress,
        }}
      >
        规模化商业闭环
      </div>
    </div>
  );
};

const FinalPitch = () => {
  const frame = useCurrentFrame();
  const o = sceneOpacity(frame, 486, 600, 12);
  const f = local(frame, 486);
  const logo = ramp(f, 10, 34, popEase);
  const title = ramp(f, 22, 48, easeOut);

  return (
    <SceneShell opacity={o} zIndex={5}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 44%, rgba(38,166,154,0.18), rgba(25,118,210,0.12) 34%, rgba(7,19,31,0) 72%)",
        }}
      />
      <div style={{ position: "absolute", left: 150, top: 150, display: "flex", alignItems: "center", gap: 28, opacity: logo, transform: `scale(${0.9 + logo * 0.1})` }}>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 112,
            height: 112,
            borderRadius: 30,
            border: `1px solid ${palette.border}`,
            background: "rgba(232,245,255,0.1)",
            boxShadow: "0 24px 70px rgba(25,118,210,0.28)",
          }}
        >
          <Img src={staticFile("logo.svg")} style={{ width: 82, height: 82, objectFit: "contain" }} />
        </div>
        <div style={{ color: palette.text, fontSize: 46, fontWeight: 900 }}>CervixDetectAI</div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 330 }}>
        <Title progress={title} size={92} maxWidth={1040}>
          用 SaaS 模式，把智能筛查带到更多基层机构
        </Title>
        <Body progress={ramp(f, 58, 82)} maxWidth={980}>
          云端 AI、医生归档、随访触达和订阅交付，构成可规模化的宫颈癌筛查服务平台。
        </Body>
      </div>
      <FinalBusinessMap progress={title} />
      <div style={{ position: "absolute", left: 150, bottom: 128, display: "flex", gap: 18 }}>
        {["低门槛接入", "降低筛查成本", "持续服务收入", "医疗闭环交付"].map((label, index) => {
          const p = ramp(f, 84 + index * 5, 104 + index * 5, popEase);
          return (
            <div
              key={label}
              style={{
                padding: "18px 24px",
                borderRadius: 999,
                background: index === 1 ? "rgba(38,166,154,0.2)" : "rgba(232,245,255,0.11)",
                border: `1px solid ${index === 1 ? "rgba(38,166,154,0.55)" : palette.border}`,
                color: palette.text,
                fontSize: 28,
                fontWeight: 850,
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
};

export const CervixDetectIntro = () => {
  const image = staticFile("tct-source.png");
  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      <MicroscopeBusinessHero image={image} />
      <AIScanValue image={image} />
      <CloudSaaSFlow />
      <BusinessLoop />
      <FinalPitch />
      <TimelineAudio />
      <CaptionBar />
    </AbsoluteFill>
  );
};
