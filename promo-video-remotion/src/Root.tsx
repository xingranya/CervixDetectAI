import "./index.css";
import { Composition } from "remotion";
import {
  AI_ENGINE_LOOP_FPS,
  AI_ENGINE_LOOP_HEIGHT,
  AI_ENGINE_LOOP_TOTAL_FRAMES,
  AI_ENGINE_LOOP_WIDTH,
  AiDiagnosisEngineLoop,
} from "./AiDiagnosisEngineLoop";
import { CervixDetectIntro, FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./Composition";
import { LOOP_FPS, LOOP_HEIGHT, LOOP_TOTAL_FRAMES, LOOP_WIDTH, QueueFlowLoop } from "./QueueFlowLoop";
import {
  REPORT_LOOP_FPS,
  REPORT_LOOP_HEIGHT,
  REPORT_LOOP_TOTAL_FRAMES,
  REPORT_LOOP_WIDTH,
  ReportClosureLoop,
} from "./ReportClosureLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CervixDetectAIIntro"
        component={CervixDetectIntro}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CervixDetectAIDiagnosisEngineLoop"
        component={AiDiagnosisEngineLoop}
        durationInFrames={AI_ENGINE_LOOP_TOTAL_FRAMES}
        fps={AI_ENGINE_LOOP_FPS}
        width={AI_ENGINE_LOOP_WIDTH}
        height={AI_ENGINE_LOOP_HEIGHT}
      />
      <Composition
        id="CervixDetectAIQueueFlowLoop"
        component={QueueFlowLoop}
        durationInFrames={LOOP_TOTAL_FRAMES}
        fps={LOOP_FPS}
        width={LOOP_WIDTH}
        height={LOOP_HEIGHT}
      />
      <Composition
        id="CervixDetectAIReportClosureLoop"
        component={ReportClosureLoop}
        durationInFrames={REPORT_LOOP_TOTAL_FRAMES}
        fps={REPORT_LOOP_FPS}
        width={REPORT_LOOP_WIDTH}
        height={REPORT_LOOP_HEIGHT}
      />
    </>
  );
};
