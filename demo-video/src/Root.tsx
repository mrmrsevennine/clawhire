import { Composition } from "remotion";
import { ClawMarketDemo } from "./ClawMarketDemo";

// 36 seconds at 30fps = 1080 frames
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawMarketDemo"
        component={ClawMarketDemo}
        durationInFrames={1080}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
