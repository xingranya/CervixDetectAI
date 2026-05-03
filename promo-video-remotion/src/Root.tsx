import "./index.css";
import { Composition } from "remotion";
import { CervixDetectIntro, FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CervixDetectAIIntro"
      component={CervixDetectIntro}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
