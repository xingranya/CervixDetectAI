import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const REPORT_LOOP_WIDTH = 1920;
export const REPORT_LOOP_HEIGHT = 1080;
export const REPORT_LOOP_FPS = 30;
export const REPORT_LOOP_TOTAL_FRAMES = 12 * REPORT_LOOP_FPS;

const palette = {
  bg: "#f7fbff",
  ink: "#12304f",
  text: "#274860",
  muted: "#6e8498",
  panel: "rgba(255,255,255,0.9)",
  line: "#bcd4e8",
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

const showAt = (frame: number, start: number) => {
  void frame;
  void start;
  return 1;
};

const pulse = (frame: number, offset: number, duration = 160) => {
  const local = (frame + offset) % duration;
  return Math.min(
    ramp(local, 8, 34, easePop),
    interpolate(local, [86, 126], [1, 0], {
      easing: easeSoft,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
};

const panelStyle = (show: number): CSSProperties => ({
  borderRadius: 24,
  background: palette.panel,
  border: "1px solid rgba(123,154,186,0.24)",
  boxShadow: palette.shadow,
  overflow: "hidden",
  opacity: show,
  transform: `translateY(${(1 - show) * 24}px)`,
});

const nodes = [
  { label: "患者就诊", icon: "患", x: 118, color: palette.blue, soft: palette.blueSoft },
  { label: "影像上传", icon: "像", x: 438, color: palette.teal, soft: palette.tealSoft },
  { label: "AI 智能分析", icon: "析", x: 758, color: palette.amber, soft: palette.amberSoft },
  { label: "医生人工复核", icon: "核", x: 1078, color: palette.coral, soft: palette.coralSoft },
  { label: "PDF 报告归档", icon: "档", x: 1398, color: palette.blue, soft: palette.blueSoft },
];

const resultRows = [
  { label: "诊断结论", value: "HSIL 风险提示", color: palette.blue, width: 0 },
  { label: "风险等级", value: "高风险", color: palette.coral, width: 86 },
  { label: "置信度", value: "92.4%", color: palette.teal, width: 92 },
  { label: "可疑区域", value: "4 处坐标", color: palette.amber, width: 72 },
  { label: "生物标志物", value: "p16 / Ki-67", color: palette.violet, width: 0 },
];

const trendPoints = [
  { x: 42, risk: 112, confidence: 84 },
  { x: 114, risk: 96, confidence: 92 },
  { x: 186, risk: 124, confidence: 76 },
  { x: 258, risk: 76, confidence: 66 },
  { x: 330, risk: 88, confidence: 56 },
  { x: 402, risk: 48, confidence: 48 },
];

const pathFrom = (key: "risk" | "confidence") =>
  trendPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point[key]}`).join(" ");

const Background = () => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 78) * 18;
  const driftY = Math.cos(frame / 88) * 14;

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
      <div style={{ position: "absolute", left: -220, top: -220, width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,102,208,0.16), rgba(30,102,208,0) 70%)", filter: "blur(18px)" }} />
      <div style={{ position: "absolute", right: -150, top: 90, width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle, rgba(31,138,112,0.14), rgba(31,138,112,0) 72%)", filter: "blur(18px)" }} />
      <div style={{ position: "absolute", left: 560, bottom: -330, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,165,29,0.12), rgba(240,165,29,0) 74%)", filter: "blur(20px)" }} />
    </AbsoluteFill>
  );
};

const Header = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 4);

  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 48, display: "grid", gridTemplateColumns: "1fr 444px", gap: 38, alignItems: "start", opacity: show, transform: `translateY(${(1 - show) * 22}px)` }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: 999, background: "rgba(30,102,208,0.1)", color: palette.blue, fontSize: 17, fontWeight: 820 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: palette.blue, boxShadow: "0 0 18px rgba(30,102,208,0.55)" }} />
          第 3 页 · 病例数据闭环
        </div>
        <h1 style={{ margin: "14px 0 0", color: palette.ink, fontSize: 62, lineHeight: 1.05, fontWeight: 900, letterSpacing: 0 }}>
          从 AI 结果到医生归档报告的数据闭环
        </h1>
      </div>
      <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.84)", border: "1px solid rgba(123,154,186,0.24)", boxShadow: "0 16px 38px rgba(64,94,125,0.1)", padding: "20px 24px", color: palette.text, fontSize: 21, lineHeight: 1.42, fontWeight: 640 }}>
        正向链路生成报告，回流数据形成历史趋势与高质量标注沉淀，支撑下一次诊疗与 AI 能力优化。
      </div>
    </div>
  );
};

const BusinessLoop = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 32);
  const y = 238;
  const nodeW = 220;
  const nodeH = 108;
  const forwardDraw = 1;
  const feedbackDraw = 1;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: show }}>
      <svg width={REPORT_LOOP_WIDTH} height={REPORT_LOOP_HEIGHT} viewBox={`0 0 ${REPORT_LOOP_WIDTH} ${REPORT_LOOP_HEIGHT}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {nodes.slice(0, -1).map((node, index) => {
          const startX = node.x + nodeW;
          const endX = nodes[index + 1].x;
          const yy = y + nodeH / 2;
          const localDraw = Math.min(1, Math.max(0, forwardDraw * 5 - index));
          const active = pulse(frame, 320 - index * 19);
          const dotX = startX + (endX - startX) * (((frame * 2.1 + index * 24) % 100) / 100);

          return (
            <g key={node.label}>
              <line x1={startX} y1={yy} x2={endX} y2={yy} stroke={palette.line} strokeWidth={4} strokeLinecap="round" />
              <line x1={startX} y1={yy} x2={startX + (endX - startX) * localDraw} y2={yy} stroke={node.color} strokeWidth={5} strokeLinecap="round" opacity={0.5 + active * 0.3} />
              <circle cx={dotX} cy={yy} r={5.4} fill={node.color} opacity={0.7} />
            </g>
          );
        })}

        <path
          d="M 1508 352 C 1320 420 980 424 866 352"
          fill="none"
          stroke={palette.amber}
          strokeWidth={4}
          strokeDasharray="12 12"
          strokeDashoffset={180 * (1 - feedbackDraw)}
          opacity={0.72}
        />
        <path
          d="M 1508 352 C 1260 478 458 478 228 352"
          fill="none"
          stroke={palette.teal}
          strokeWidth={4}
          strokeDasharray="12 12"
          strokeDashoffset={260 * (1 - feedbackDraw)}
          opacity={0.72}
        />
        <polygon points="862,352 880,344 878,364" fill={palette.amber} opacity={feedbackDraw} />
        <polygon points="224,352 242,344 240,364" fill={palette.teal} opacity={feedbackDraw} />
      </svg>

      {nodes.map((node, index) => {
        const enter = showAt(frame, 42 + index * 7);
        const active = pulse(frame, 320 - index * 20);

        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: node.x,
              top: y,
              width: nodeW,
              height: nodeH,
              borderRadius: 22,
              background: "rgba(255,255,255,0.92)",
              border: `1px solid rgba(35,67,96,${0.08 + active * 0.08})`,
              boxShadow: `0 18px 42px rgba(62,96,128,0.1), 0 0 ${10 + active * 22}px ${node.soft}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 18px",
              opacity: enter,
              transform: `translateY(${(1 - enter) * 26 - active * 4}px)`,
            }}
          >
            <div style={{ width: 54, height: 54, borderRadius: 17, background: node.soft, color: node.color, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 860 }}>
              {node.icon}
            </div>
            <div style={{ color: palette.ink, fontSize: 25, lineHeight: 1.15, fontWeight: 880 }}>{node.label}</div>
          </div>
        );
      })}

      <LoopTag left={842} top={388} color={palette.amber} show={feedbackDraw} text="高质量标注反哺 AI" />
      <LoopTag left={178} top={416} color={palette.teal} show={feedbackDraw} text="历史趋势回到患者" />
    </div>
  );
};

const LoopTag = ({ left, top, color, text, show }: { left: number; top: number; color: string; text: string; show: number }) => (
  <div style={{ position: "absolute", left, top, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.9)", border: `1px solid ${color}33`, color, fontSize: 16, fontWeight: 820, opacity: show, transform: `translateY(${(1 - show) * 12}px)` }}>
    {text}
  </div>
);

const StructuredPanel = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 92);

  return (
    <section style={{ position: "absolute", left: 72, top: 468, width: 540, height: 500, padding: 26, ...panelStyle(show) }}>
      <SectionTitle eyebrow="对应：AI 智能分析 / 结果节点" title="结构化数据沉淀" />
      <div style={{ marginTop: 20, borderRadius: 18, background: "rgba(248,251,255,0.9)", border: "1px solid rgba(123,154,186,0.2)", padding: 16 }}>
        {resultRows.map((row, index) => {
          const enter = showAt(frame, 112 + index * 7);
          const active = pulse(frame, 260 - index * 18);
          return (
            <div
              key={row.label}
              style={{
                height: 54,
                display: "grid",
                gridTemplateColumns: "128px 1fr",
                alignItems: "center",
                borderBottom: index === resultRows.length - 1 ? "none" : "1px solid rgba(123,154,186,0.16)",
                opacity: enter,
                transform: `translateX(${(1 - enter) * -18}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: row.color, fontSize: 18, fontWeight: 820 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, boxShadow: `0 0 ${8 + active * 14}px ${row.color}` }} />
                {row.label}
              </div>
              <div style={{ color: palette.ink, fontSize: 21, fontWeight: 840 }}>
                {row.value}
                {row.width > 0 ? (
                  <div style={{ marginTop: 7, height: 6, borderRadius: 99, background: "rgba(112,134,154,0.16)", overflow: "hidden" }}>
                    <div style={{ width: `${row.width}%`, height: "100%", borderRadius: 99, background: row.color, boxShadow: `0 0 ${8 + active * 12}px ${row.color}` }} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <FeatureBadge color={palette.teal} label="自动同步至报告模板" />
    </section>
  );
};

const CollaborationPanel = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 124);
  const active = pulse(frame, 120, 150);

  return (
    <section style={{ position: "absolute", left: 690, top: 468, width: 540, height: 500, padding: 26, ...panelStyle(show) }}>
      <SectionTitle eyebrow="对应：医生复核 / 报告生成节点" title="人机协同报告构建" />
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputBlock color={palette.blue} title="AI 结构化数据" items={["结论", "风险", "坐标", "标志物"]} />
        <InputBlock color={palette.coral} title="医生修改意见" items={["复核", "签署", "补充", "确认"]} />
      </div>
      <div style={{ margin: "14px auto 0", width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `22px solid ${palette.teal}`, filter: `drop-shadow(0 0 ${8 + active * 12}px rgba(31,138,112,0.28))` }} />
      <div style={{ marginTop: 12, borderRadius: 18, background: "linear-gradient(135deg, rgba(30,102,208,0.08), rgba(31,138,112,0.12))", border: "1px solid rgba(30,102,208,0.18)", padding: 15 }}>
        <div style={{ color: palette.ink, fontSize: 23, fontWeight: 880 }}>生成医生归档报告</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {["首页摘要", "影像对比", "临床建议"].map((item) => (
            <div key={item} style={{ height: 34, borderRadius: 12, background: "rgba(255,255,255,0.72)", color: palette.blue, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 780 }}>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12, borderRadius: 16, background: palette.amberSoft, border: "1px solid rgba(240,165,29,0.26)", padding: "10px 14px", color: palette.ink, fontSize: 16, lineHeight: 1.28, fontWeight: 720 }}>
        技术亮点：页面标注与最终 PDF 采用同源坐标系，确保可疑区域 1:1 还原。
      </div>
    </section>
  );
};

const InputBlock = ({ color, title, items }: { color: string; title: string; items: string[] }) => (
  <div style={{ height: 112, borderRadius: 18, background: "rgba(255,255,255,0.78)", border: `1px solid ${color}33`, padding: 13 }}>
    <div style={{ color, fontSize: 18, fontWeight: 840 }}>{title}</div>
    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
      {items.map((item) => (
        <div key={item} style={{ height: 28, borderRadius: 10, background: "rgba(245,249,253,0.9)", color: palette.text, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 720 }}>
          {item}
        </div>
      ))}
    </div>
  </div>
);

const ArchivePanel = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 154);

  return (
    <section style={{ position: "absolute", left: 1308, top: 468, width: 540, height: 500, padding: 26, ...panelStyle(show) }}>
      <SectionTitle eyebrow="对应：归档 / 回流节点" title="管档与趋势洞察" />
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "174px 1fr", gap: 18, alignItems: "stretch" }}>
        <ArchiveBadge />
        <TrendBlock />
      </div>
      <div style={{ marginTop: 20, borderRadius: 18, background: "rgba(255,255,255,0.78)", border: "1px solid rgba(123,154,186,0.2)", padding: 17 }}>
        <div style={{ color: palette.ink, fontSize: 21, fontWeight: 860 }}>闭环价值</div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <ValueRow color={palette.teal} text="基于归档数据形成患者 6 次随访趋势" />
          <ValueRow color={palette.amber} text="医生复核后的高质量标注反哺 AI 分析" />
          <ValueRow color={palette.blue} text="下一次诊疗自动带入历史记录与报告依据" />
        </div>
      </div>
    </section>
  );
};

const ArchiveBadge = () => {
  const frame = useCurrentFrame();
  const active = pulse(frame, 80);

  return (
    <div style={{ borderRadius: 20, background: "linear-gradient(180deg, #ffffff, #f3f8fe)", border: "1px solid rgba(123,154,186,0.22)", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: 96, height: 126, borderRadius: 14, background: "white", border: "1px solid rgba(30,102,208,0.22)", boxShadow: "0 12px 26px rgba(60,94,128,0.1)", position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: 18, right: 14, height: 10, borderRadius: 99, background: palette.blueSoft }} />
        <div style={{ position: "absolute", left: 14, top: 42, width: 52, height: 8, borderRadius: 99, background: "rgba(31,138,112,0.22)" }} />
        <div style={{ position: "absolute", left: 14, top: 62, width: 64, height: 8, borderRadius: 99, background: "rgba(240,165,29,0.22)" }} />
        <div style={{ position: "absolute", right: 10, bottom: 12, width: 54, height: 54, borderRadius: "50%", border: `4px solid rgba(230,95,80,${0.72 + active * 0.2})`, color: palette.coral, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 880, transform: `rotate(-14deg) scale(${0.96 + active * 0.04})` }}>
          归档
        </div>
      </div>
      <div style={{ marginTop: 12, color: palette.blue, fontSize: 18, fontWeight: 860 }}>医生版 PDF</div>
    </div>
  );
};

const TrendBlock = () => {
  const draw = 1;
  const riskLength = 420;
  const confidenceLength = 390;

  return (
    <div style={{ borderRadius: 20, background: "rgba(255,255,255,0.78)", border: "1px solid rgba(123,154,186,0.2)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ color: palette.ink, fontSize: 19, fontWeight: 860 }}>6 次随访趋势</div>
        <div style={{ borderRadius: 999, background: palette.blueSoft, color: palette.blue, padding: "7px 10px", fontSize: 14, fontWeight: 820 }}>查看详情</div>
      </div>
      <svg width="100%" height="124" viewBox="0 0 450 142" style={{ marginTop: 8, overflow: "visible" }}>
        {[0, 1, 2].map((row) => (
          <line key={row} x1={30} y1={34 + row * 38} x2={420} y2={34 + row * 38} stroke="rgba(111,131,153,0.16)" strokeWidth={2} />
        ))}
        <path d={pathFrom("risk")} fill="none" stroke={palette.coral} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={riskLength} strokeDashoffset={riskLength * (1 - draw)} />
        <path d={pathFrom("confidence")} fill="none" stroke={palette.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={confidenceLength} strokeDashoffset={confidenceLength * (1 - draw)} opacity={0.84} />
        {trendPoints.map((point) => (
          <circle key={point.x} cx={point.x} cy={point.risk} r={8} fill={palette.coral} opacity={1} />
        ))}
      </svg>
    </div>
  );
};

const ValueRow = ({ color, text }: { color: string; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, color: palette.text, fontSize: 17, fontWeight: 700 }}>
    <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
    {text}
  </div>
);

const FeatureBadge = ({ color, label }: { color: string; label: string }) => (
  <div style={{ marginTop: 18, height: 50, borderRadius: 15, background: "linear-gradient(90deg, rgba(30,102,208,0.1), rgba(31,138,112,0.12))", border: "1px solid rgba(30,102,208,0.18)", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 860 }}>
    {label}
  </div>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div>
    <div style={{ color: palette.blue, fontSize: 16, fontWeight: 840 }}>{eyebrow}</div>
    <div style={{ marginTop: 6, color: palette.ink, fontSize: 31, lineHeight: 1.12, fontWeight: 900 }}>{title}</div>
  </div>
);

const FooterLegend = () => {
  const frame = useCurrentFrame();
  const show = showAt(frame, 210);

  return (
    <div style={{ position: "absolute", left: 72, right: 72, bottom: 38, height: 48, borderRadius: 18, background: "rgba(255,255,255,0.76)", border: "1px solid rgba(123,154,186,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 30, color: palette.text, fontSize: 18, fontWeight: 760, opacity: show }}>
      <LegendItem color={palette.blue} line="实线" text="正向生成：影像到报告" />
      <LegendItem color={palette.teal} line="虚线" text="患者历史趋势回流" />
      <LegendItem color={palette.amber} line="虚线" text="医生标注反哺 AI" />
    </div>
  );
};

const LegendItem = ({ color, line, text }: { color: string; line: string; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <span style={{ width: 34, height: 4, borderRadius: 99, background: line === "实线" ? color : `repeating-linear-gradient(90deg, ${color} 0 8px, transparent 8px 14px)` }} />
    {text}
  </div>
);

export const ReportClosureLoop: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: palette.bg, color: palette.text, fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', overflow: "hidden" }}>
    <Background />
    <Header />
    <BusinessLoop />
    <StructuredPanel />
    <CollaborationPanel />
    <ArchivePanel />
    <FooterLegend />
  </AbsoluteFill>
);
