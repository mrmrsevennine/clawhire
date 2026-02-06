import { Composition } from "remotion";
import { ClawMarketDemo } from "./ClawMarketDemo";

// 30 seconds at 30fps = 900 frames
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawMarketDemo"
        component={ClawMarketDemo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
