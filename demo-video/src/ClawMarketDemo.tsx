import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { THEME } from "./theme";
import { Scene1LogoReveal } from "./scenes/Scene1LogoReveal";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Features } from "./scenes/Scene4Features";
import { Scene5Stats } from "./scenes/Scene5Stats";
import { Scene6CTA } from "./scenes/Scene6CTA";

export const ClawMarketDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  // Transition duration in frames
  const T = Math.round(0.5 * fps); // 15 frames = 0.5s

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <TransitionSeries>
        {/* Scene 1: Logo Reveal (0-5s) = 150 frames */}
        <TransitionSeries.Sequence durationInFrames={5 * fps}>
          <Scene1LogoReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 2: Problem (5-12s) = 210 frames */}
        <TransitionSeries.Sequence durationInFrames={Math.round(7 * fps)}>
          <Scene2Problem />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 3: Solution Flow (12-18s) = 180 frames */}
        <TransitionSeries.Sequence durationInFrames={6 * fps}>
          <Scene3Solution />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 4: Features (18-24s) = 180 frames */}
        <TransitionSeries.Sequence durationInFrames={6 * fps}>
          <Scene4Features />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 5: Stats (24-28s) = 120 frames */}
        <TransitionSeries.Sequence durationInFrames={4 * fps}>
          <Scene5Stats />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 6: CTA (28-30s) = 60 frames + extra buffer */}
        <TransitionSeries.Sequence durationInFrames={Math.round(2.5 * fps)}>
          <Scene6CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
