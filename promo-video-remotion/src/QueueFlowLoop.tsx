import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const LOOP_WIDTH = 1920;
export const LOOP_HEIGHT = 1080;
export const LOOP_FPS = 30;
export const LOOP_TOTAL_FRAMES = 12 * LOOP_FPS;

const palette = {
  bg: "#f4f8fc",
  panel: "rgba(255,255,255,0.9)",
  panelStrong: "rgba(255,255,255,0.96)",
  ink: "#16324f",
  text: "#1b3552",
  muted: "#6f8399",
  line: "#bad2e8",
  blue: "#1e66d0",
  blueSoft: "#dceaff",
  teal: "#1f8a70",
  tealSoft: "#dff5ee",
  amber: "#f3a11a",
  amberSoft: "#fff1d6",
  coral: "#e86a5b",
  coralSoft: "#ffe3de",
  cyan: "#4aa9f5",
  cyanSoft: "#e0f4ff",
  shadow: "0 26px 60px rgba(56, 92, 134, 0.14)",
};

const highlightEase = Easing.bezier(0.22, 1, 0.36, 1);
const cycleFrames = 240;
const centers = [16, 48, 80, 112, 148, 182, 214, 232];

type IconProps = {
  color: string;
};

type NodeDefinition = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  color: string;
  tint: string;
  icon: (props: IconProps) => ReactNode;
};

type ConnectorDefinition = {
  from: [number, number];
  to: [number, number];
  color: string;
  delay: number;
  width?: number;
};

const clampLines = (lines: number): CSSProperties => ({
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
});

const loopDistance = (frame: number, center: number) => {
  const phase = frame % cycleFrames;
  const raw = Math.abs(phase - center);
  return Math.min(raw, cycleFrames - raw);
};

const emphasis = (frame: number, center: number, width = 34) =>
  interpolate(loopDistance(frame, center), [0, width], [1, 0], {
    easing: highlightEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const travel = (frame: number, delay: number, duration = 72) => {
  const phase = (frame + delay) % duration;
  return phase / duration;
};

const cardStyle = (tint: string, intensity: number, color: string): CSSProperties => ({
  position: "absolute",
  borderRadius: 30,
  background: `linear-gradient(180deg, ${palette.panelStrong}, ${palette.panel})`,
  border: `1px solid rgba(27,53,82,${0.08 + intensity * 0.08})`,
  boxShadow: `${palette.shadow}, 0 0 ${16 + intensity * 34}px ${tint}`,
  overflow: "hidden",
  outline: `1px solid rgba(255,255,255,${0.56 + intensity * 0.14})`,
  outlineOffset: -1,
  color,
});

const capsuleStyle = (background: string, color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 12px",
  borderRadius: 999,
  background,
  color,
  fontFamily: '"SF Mono", "SFMono-Regular", Menlo, monospace',
  fontSize: 16,
  fontWeight: 650,
  lineHeight: 1,
});

const UploadIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <path d="M9 31.5h26" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M22 9v18m0-18-6.5 6.5M22 9l6.5 6.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10.5" y="26.5" width="23" height="8" rx="4" stroke={color} strokeWidth="2.3" />
  </svg>
);

const StorageIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <rect x="8" y="10" width="28" height="10" rx="4" stroke={color} strokeWidth="2.6" />
    <rect x="8" y="24" width="28" height="10" rx="4" stroke={color} strokeWidth="2.6" />
    <circle cx="30" cy="15" r="1.8" fill={color} />
    <circle cx="30" cy="29" r="1.8" fill={color} />
  </svg>
);

const CloudSyncIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <path
      d="M15 31h14a6 6 0 0 0 1.1-11.9A8.5 8.5 0 0 0 13.7 17 6.5 6.5 0 0 0 15 31Z"
      stroke={color}
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="m17 21 3.6-3.6L24.2 21M20.6 17.4v10.8" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m27 25-3.6 3.6L19.8 25M23.4 28.6V17.8" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
  </svg>
);

const QueueIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <rect x="8" y="11" width="28" height="6" rx="3" stroke={color} strokeWidth="2.4" />
    <rect x="8" y="19" width="28" height="6" rx="3" stroke={color} strokeWidth="2.4" />
    <rect x="8" y="27" width="28" height="6" rx="3" stroke={color} strokeWidth="2.4" />
    <path d="M34 14h2.5M34 22h2.5M34 30h2.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const PathIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <path d="M10 12h10a4 4 0 0 1 4 4v3" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M34 32H24a4 4 0 0 1-4-4v-3" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="10" cy="12" r="3" stroke={color} strokeWidth="2.4" />
    <circle cx="34" cy="32" r="3" stroke={color} strokeWidth="2.4" />
    <path d="m26 17 4 4-4 4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AiIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <rect x="11" y="11" width="22" height="22" rx="6" stroke={color} strokeWidth="2.6" />
    <path d="M22 6.5v4M22 33.5v4M6.5 22h4M33.5 22h4M12.5 12.5 10 10M34 34l-2.5-2.5M31.5 12.5 34 10M10 34l2.5-2.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M18 25.5v-7h4.6c2 0 3.4 1.4 3.4 3.3 0 2-1.4 3.7-3.4 3.7H18Zm2.7-2.2h1.5c.8 0 1.5-.7 1.5-1.6 0-.9-.7-1.5-1.5-1.5h-1.5v3.1Z" fill={color} />
  </svg>
);

const TraceIcon = ({ color }: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
    <rect x="10" y="8" width="24" height="28" rx="4" stroke={color} strokeWidth="2.5" />
    <path d="M16 17h12M16 23h8M16 29h6" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <path d="m27.5 29.5 2.2 2.2 4.8-5.4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const nodes: NodeDefinition[] = [
  {
    id: "upload",
    x: 72,
    y: 232,
    w: 288,
    h: 194,
    title: "影像上传",
    subtitle: "提交病例影像与基础信息",
    color: palette.blue,
    tint: "rgba(30,102,208,0.18)",
    icon: UploadIcon,
  },
  {
    id: "local",
    x: 380,
    y: 232,
    w: 288,
    h: 194,
    title: "本地持久化",
    subtitle: "先写入本地影像目录，保证保底可用",
    color: palette.teal,
    tint: "rgba(31,138,112,0.16)",
    icon: StorageIcon,
  },
  {
    id: "cloud",
    x: 688,
    y: 232,
    w: 288,
    h: 194,
    title: "图仓同步",
    subtitle: "异步同步远程图仓，失败不回滚上传",
    color: palette.cyan,
    tint: "rgba(74,169,245,0.16)",
    icon: CloudSyncIcon,
  },
  {
    id: "queue",
    x: 996,
    y: 232,
    w: 288,
    h: 194,
    title: "异步队列",
    subtitle: "创建 AnalysisTask，默认 3 路并发",
    color: palette.amber,
    tint: "rgba(243,161,26,0.18)",
    icon: QueueIcon,
  },
  {
    id: "path",
    x: 996,
    y: 490,
    w: 288,
    h: 198,
    title: "路径准备",
    subtitle: "远程 URL 优先，不可用时回退本地",
    color: palette.teal,
    tint: "rgba(31,138,112,0.16)",
    icon: PathIcon,
  },
  {
    id: "ai",
    x: 688,
    y: 490,
    w: 288,
    h: 198,
    title: "AI 分析",
    subtitle: "减少 Base64 转换，提升调用效率",
    color: palette.blue,
    tint: "rgba(30,102,208,0.16)",
    icon: AiIcon,
  },
  {
    id: "trace",
    x: 380,
    y: 490,
    w: 288,
    h: 198,
    title: "状态追踪",
    subtitle: "超时、重试、错误日志全链路可查",
    color: palette.coral,
    tint: "rgba(232,106,91,0.16)",
    icon: TraceIcon,
  },
];

const connectors: ConnectorDefinition[] = [
  { from: [360, 329], to: [380, 329], color: palette.blue, delay: 0 },
  { from: [668, 329], to: [688, 329], color: palette.teal, delay: 12 },
  { from: [976, 329], to: [996, 329], color: palette.cyan, delay: 24 },
  { from: [1140, 426], to: [1140, 490], color: palette.amber, delay: 36 },
  { from: [996, 589], to: [976, 589], color: palette.teal, delay: 48 },
  { from: [688, 589], to: [668, 589], color: palette.blue, delay: 60 },
];

const bulletPhaseCenters = [24, 84, 144, 204];

const Background = () => {
  const frame = useCurrentFrame();
  const waveX = Math.sin(frame / 90) * 28;
  const waveY = Math.cos(frame / 110) * 20;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #f8fbff 0%, #eef5fc 48%, #edf4fb 100%)",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(141,176,210,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(141,176,210,0.11) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          transform: `translate(${waveX}px, ${waveY}px)`,
          opacity: 0.72,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          top: -160,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30,102,208,0.15), rgba(30,102,208,0) 70%)",
          filter: "blur(12px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          top: 120,
          width: 540,
          height: 540,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(31,138,112,0.13), rgba(31,138,112,0) 70%)",
          filter: "blur(12px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 240,
          bottom: -200,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(243,161,26,0.11), rgba(243,161,26,0) 72%)",
          filter: "blur(14px)",
        }}
      />
    </AbsoluteFill>
  );
};

const TitleBlock = () => {
  const frame = useCurrentFrame();
  const glow = 0.4 + 0.6 * emphasis(frame, 40, 50);

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 52,
        width: 1212,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={capsuleStyle("rgba(30,102,208,0.1)", palette.blue)}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: palette.blue,
            boxShadow: `0 0 ${10 + glow * 14}px rgba(30,102,208,0.55)`,
          }}
        />
        PAGE 02 / STORAGE & QUEUE FLOW
      </div>
      <h1
        style={{
          margin: 0,
          color: palette.ink,
          fontSize: 54,
          lineHeight: 1.08,
          fontWeight: 820,
          letterSpacing: "-0.045em",
          textShadow: `0 10px 24px rgba(255,255,255,${0.3 + glow * 0.12})`,
        }}
      >
        稳定可扩展的影像分析任务链路
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: 1180,
          color: palette.muted,
          fontSize: 20,
          lineHeight: 1.55,
          fontWeight: 460,
        }}
      >
        服务层统一封装影像上传、图仓同步、分析前路径准备与异步执行，
        上传接口可快速返回，分析任务在后台稳定推进，关键状态全流程可追踪。
      </p>
    </div>
  );
};

const FlowNode = ({ node, index }: { node: NodeDefinition; index: number }) => {
  const frame = useCurrentFrame();
  const intensity = 0.3 + emphasis(frame, centers[index], 40) * 0.7;
  const Icon = node.icon;
  const drift = Math.sin((frame + index * 8) / 36) * 2;

  return (
    <div
      style={{
        ...cardStyle(node.tint, intensity, node.color),
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        padding: "18px 20px 18px",
        transform: `translateY(${drift - intensity * 3}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${node.tint}, rgba(255,255,255,0))`,
          opacity: 0.46 + intensity * 0.3,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: `linear-gradient(180deg, ${node.tint}, rgba(255,255,255,0.78))`,
              border: `1px solid rgba(255,255,255,${0.64 + intensity * 0.2})`,
              boxShadow: `0 10px 20px rgba(255,255,255,0.3), 0 0 ${16 + intensity * 18}px ${node.tint}`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon color={node.color} />
          </div>
          <div style={{ ...capsuleStyle("rgba(255,255,255,0.82)", node.color), fontSize: 15 }}>0{index + 1}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              ...clampLines(1),
              color: palette.text,
              fontSize: 24,
              lineHeight: 1.18,
              fontWeight: 770,
              letterSpacing: "-0.03em",
            }}
          >
            {node.title}
          </div>
          <div
            style={{
              ...clampLines(2),
              color: palette.muted,
              fontSize: 16,
              lineHeight: 1.48,
              fontWeight: 470,
            }}
          >
            {node.subtitle}
          </div>
        </div>

        {node.id === "queue" ? <QueueSlots intensity={intensity} /> : null}
        {node.id === "path" ? <PathBadges frame={frame} /> : null}
        {node.id === "trace" ? <TraceBadges frame={frame} /> : null}
      </div>
    </div>
  );
};

const QueueSlots = ({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  const slots = [0, 18, 36];

  return (
    <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
      {slots.map((offset, index) => {
        const active = 0.42 + 0.58 * emphasis(frame, 112 + offset, 22);
        return (
          <div
            key={offset}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 13,
              background: `linear-gradient(90deg, rgba(243,161,26,${0.14 + active * 0.22}), rgba(255,255,255,0.86))`,
              border: `1px solid rgba(243,161,26,${0.2 + active * 0.34})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.amber,
              fontFamily: '"SF Mono", "SFMono-Regular", Menlo, monospace',
              fontSize: 13,
              fontWeight: 680,
              boxShadow: `0 0 ${8 + active * 16}px rgba(243,161,26,${0.1 + active * 0.14})`,
              opacity: 0.76 + intensity * 0.22,
            }}
          >
            槽位 {index + 1}
          </div>
        );
      })}
    </div>
  );
};

const PathBadges = ({ frame }: { frame: number }) => {
  const remote = 0.45 + 0.55 * emphasis(frame, 148, 28);
  const fallback = 0.42 + 0.58 * emphasis(frame, 182, 28);

  return (
    <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
      <div
        style={{
          ...capsuleStyle(`rgba(31,138,112,${0.12 + remote * 0.18})`, palette.teal),
          boxShadow: `0 0 ${8 + remote * 14}px rgba(31,138,112,0.16)`,
          fontSize: 13,
          padding: "7px 10px",
        }}
      >
        URL FIRST
      </div>
      <div
        style={{
          ...capsuleStyle(`rgba(232,106,91,${0.1 + fallback * 0.18})`, palette.coral),
          boxShadow: `0 0 ${8 + fallback * 14}px rgba(232,106,91,0.16)`,
          fontSize: 13,
          padding: "7px 10px",
        }}
      >
        LOCAL FALLBACK
      </div>
    </div>
  );
};

const TraceBadges = ({ frame }: { frame: number }) => {
  const items = [
    { label: "timeout", color: palette.coral, center: 206 },
    { label: "retry", color: palette.amber, center: 218 },
    { label: "log", color: palette.blue, center: 230 },
  ];

  return (
    <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const glow = 0.38 + 0.62 * emphasis(frame, item.center, 20);
        return (
          <div
            key={item.label}
            style={{
              ...capsuleStyle("rgba(255,255,255,0.78)", item.color),
              textTransform: "uppercase",
              boxShadow: `0 0 ${6 + glow * 16}px rgba(28,51,77,0.08)`,
              fontSize: 13,
              padding: "7px 10px",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 ${8 + glow * 10}px ${item.color}`,
              }}
            />
            {item.label}
          </div>
        );
      })}
    </div>
  );
};

const ConnectorLayer = () => {
  const frame = useCurrentFrame();

  return (
    <svg
      width={LOOP_WIDTH}
      height={LOOP_HEIGHT}
      viewBox={`0 0 ${LOOP_WIDTH} ${LOOP_HEIGHT}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connectors.map((connector, index) => {
        const lineGlow = 0.32 + 0.68 * emphasis(frame, centers[index], 36);
        const dotT = travel(frame, connector.delay);
        const dotX = connector.from[0] + (connector.to[0] - connector.from[0]) * dotT;
        const dotY = connector.from[1] + (connector.to[1] - connector.from[1]) * dotT;
        const pulseT = travel(frame, connector.delay + 20, 86);
        const pulseX = connector.from[0] + (connector.to[0] - connector.from[0]) * pulseT;
        const pulseY = connector.from[1] + (connector.to[1] - connector.from[1]) * pulseT;

        return (
          <g key={`${connector.from.join("-")}-${connector.to.join("-")}`}>
            <line
              x1={connector.from[0]}
              y1={connector.from[1]}
              x2={connector.to[0]}
              y2={connector.to[1]}
              stroke={palette.line}
              strokeWidth={connector.width ?? 8}
              strokeLinecap="round"
            />
            <line
              x1={connector.from[0]}
              y1={connector.from[1]}
              x2={connector.to[0]}
              y2={connector.to[1]}
              stroke={connector.color}
              strokeOpacity={0.24 + lineGlow * 0.42}
              strokeWidth={(connector.width ?? 8) - 3}
              strokeLinecap="round"
              filter="url(#softGlow)"
            />
            <circle cx={dotX} cy={dotY} r={7} fill={connector.color} opacity={0.92} filter="url(#softGlow)" />
            <circle cx={pulseX} cy={pulseY} r={4} fill="#ffffff" opacity={0.95} />
          </g>
        );
      })}

      <path
        d="M524 688 C524 735 460 744 392 760"
        stroke={palette.coral}
        strokeOpacity="0.2"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

const StatusRibbon = () => {
  const frame = useCurrentFrame();
  const cards = [
    {
      label: "创建后返回",
      value: "任务 ID",
      meta: "用于后续状态查询",
      accent: "01",
      color: palette.blue,
      bg: palette.blueSoft,
      center: 132,
      mono: true,
    },
    {
      label: "前端轮询状态",
      value: "轮询中",
      meta: "进度持续可见",
      accent: "02",
      color: palette.teal,
      bg: palette.tealSoft,
      center: 164,
      mono: false,
    },
    {
      label: "异常自动补偿",
      value: "自动重试",
      meta: "失败后进入补偿",
      accent: "03",
      color: palette.amber,
      bg: palette.amberSoft,
      center: 196,
      mono: false,
    },
    {
      label: "默认并发能力",
      value: "3 路并发",
      meta: "后台统一调度吞吐",
      accent: "04",
      color: palette.coral,
      bg: palette.coralSoft,
      center: 228,
      mono: false,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 760,
        width: 1212,
        height: 295,
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(247,251,255,0.91))",
        border: "1px solid rgba(27,53,82,0.08)",
        boxShadow: "0 18px 42px rgba(56,92,134,0.12)",
        padding: "20px 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          top: 20,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(30,102,208,0.16), rgba(31,138,112,0.12), rgba(243,161,26,0.10), rgba(232,106,91,0.12), rgba(30,102,208,0.06))",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(30,102,208,0.14), rgba(255,255,255,0.95))",
              border: "1px solid rgba(30,102,208,0.16)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 12px 24px rgba(56,92,134,0.08)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "2px solid rgba(30,102,208,0.84)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 5,
                  right: 5,
                  top: 11,
                  height: 2,
                  background: "rgba(30,102,208,0.84)",
                  boxShadow: "8px 0 0 rgba(31,138,112,0.84)",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                ...capsuleStyle("rgba(30,102,208,0.08)", palette.blue),
                fontSize: 13,
                width: "fit-content",
                borderRadius: 16,
                padding: "6px 12px",
              }}
            >
              回传链路
            </div>
            <div style={{ color: palette.text, fontSize: 26, fontWeight: 790, letterSpacing: "-0.03em" }}>
              任务回传与执行反馈
            </div>
            <div style={{ color: palette.muted, fontSize: 16, lineHeight: 1.5, maxWidth: 770 }}>
              上传接口快速返回，前端拿到任务标识后即可轮询进度；后台统一记录执行、重试与失败原因。
            </div>
          </div>
        </div>

        <div
          style={{
            ...capsuleStyle("rgba(255,255,255,0.88)", palette.blue),
            fontSize: 14,
            padding: "10px 15px",
            borderRadius: 18,
            border: "1px solid rgba(30,102,208,0.12)",
            boxShadow: "0 10px 20px rgba(56,92,134,0.06)",
            flexShrink: 0,
          }}
        >
          前端 ↔ 后台
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 2 }}>
        {cards.map((card) => {
          const glow = 0.38 + 0.62 * emphasis(frame, card.center, 22);
          return (
            <div
              key={card.label}
              style={{
                position: "relative",
                borderRadius: 18,
                padding: "14px 14px 13px",
                background: `linear-gradient(180deg, ${card.bg}, rgba(255,255,255,0.92))`,
                border: `1px solid rgba(27,53,82,${0.06 + glow * 0.08})`,
                boxShadow: `0 8px 18px rgba(56,92,134,0.05), 0 0 ${8 + glow * 14}px rgba(255,255,255,0.18)`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 5,
                  bottom: 0,
                  background: `linear-gradient(180deg, ${card.color}, rgba(255,255,255,0.12))`,
                  opacity: 0.88,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: card.color,
                  fontFamily: '"SF Mono", "SFMono-Regular", Menlo, monospace',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  opacity: 0.72,
                }}
              >
                {card.accent}
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(255,255,255,0.66)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 10,
                  boxShadow: `0 6px 14px rgba(56,92,134,0.06), 0 0 ${6 + glow * 10}px rgba(255,255,255,0.14)`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: card.color,
                    boxShadow: `0 0 ${8 + glow * 8}px ${card.color}`,
                  }}
                />
              </div>
              <div style={{ color: palette.muted, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{card.label}</div>
              <div
                style={{
                  color: card.color,
                  fontFamily: card.mono
                    ? '"SF Mono", "SFMono-Regular", Menlo, monospace'
                    : '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
                  fontSize: card.mono ? 22 : 21,
                  fontWeight: card.mono ? 720 : 760,
                  textShadow: `0 0 ${6 + glow * 8}px rgba(255,255,255,0.24)`,
                  marginBottom: 6,
                  letterSpacing: card.mono ? "0" : "-0.02em",
                }}
              >
                {card.value}
              </div>
              <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>{card.meta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InfoPanel = () => {
  const frame = useCurrentFrame();
  const items = [
    {
      title: "本地 + 图仓双路径",
      body: "上传结果不依赖单一外部服务，远程同步失败仍可回退本地链路。",
      color: palette.teal,
      bg: palette.tealSoft,
    },
    {
      title: "远程 URL 优先",
      body: "AI 阶段优先走远程地址，减少 Base64 转换与额外 I/O 开销。",
      color: palette.blue,
      bg: palette.blueSoft,
    },
    {
      title: "异步队列执行",
      body: "创建任务后立即返回 taskId，默认 3 路并发，不阻塞上传接口。",
      color: palette.amber,
      bg: palette.amberSoft,
    },
    {
      title: "稳定性可追踪",
      body: "超时、重试、错误日志与任务状态分层记录，支持运维快速定位。",
      color: palette.coral,
      bg: palette.coralSoft,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 72,
        top: 168,
        width: 488,
        bottom: 82,
        borderRadius: 34,
        background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(249,252,255,0.9))",
        border: "1px solid rgba(27,53,82,0.08)",
        boxShadow: palette.shadow,
        padding: "24px 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: palette.text, fontSize: 28, fontWeight: 780, letterSpacing: "-0.03em" }}>
            核心价值说明
          </div>
          <div style={{ color: palette.muted, fontSize: 17, lineHeight: 1.5 }}>
            把稳定性、效率与可追踪性压缩成评委一眼能读懂的四个技术卖点。
          </div>
        </div>
        <div style={{ ...capsuleStyle("rgba(30,102,208,0.08)", palette.blue), fontSize: 15 }}>LOOP / 12s</div>
      </div>

      {items.map((item, index) => {
        const highlight = 0.38 + 0.62 * emphasis(frame, bulletPhaseCenters[index], 26);
        return (
          <div
            key={item.title}
            style={{
              borderRadius: 24,
              padding: "16px 16px 15px",
              background: `linear-gradient(180deg, ${item.bg}, rgba(255,255,255,0.88))`,
              border: `1px solid rgba(27,53,82,${0.06 + highlight * 0.09})`,
              boxShadow: `0 10px 22px rgba(56,92,134,0.05), 0 0 ${8 + highlight * 18}px rgba(255,255,255,0.22)`,
              transform: `translateX(${highlight * 3}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: item.color,
                  boxShadow: `0 0 ${8 + highlight * 12}px ${item.color}`,
                }}
              />
              <div style={{ color: palette.text, fontSize: 22, fontWeight: 740 }}>{item.title}</div>
            </div>
            <div
              style={{
                ...clampLines(2),
                color: palette.muted,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const QueueFlowLoop = () => {
  return (
    <AbsoluteFill
      style={{
        width: LOOP_WIDTH,
        height: LOOP_HEIGHT,
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        color: palette.text,
      }}
    >
      <Background />
      <TitleBlock />
      <ConnectorLayer />
      {nodes.map((node, index) => (
        <FlowNode key={node.id} node={node} index={index} />
      ))}
      <StatusRibbon />
      <InfoPanel />
    </AbsoluteFill>
  );
};
