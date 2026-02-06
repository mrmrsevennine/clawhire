import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

// Typewriter effect helper
const getTypedText = (frame: number, text: string, charFrames: number): string => {
  const chars = Math.min(text.length, Math.floor(frame / charFrames));
  return text.slice(0, chars);
};

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Heading entrance
  const headingProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const headingOpacity = headingProgress;
  const headingScale = interpolate(headingProgress, [0, 1], [0.9, 1]);

  // Terminal window appearance
  const terminalProgress = spring({
    frame,
    fps,
    delay: 20,
    config: { damping: 200 },
  });

  // Typewriter text in terminal starts at frame 40
  const typeFrame = Math.max(0, frame - 40);
  const line1 = getTypedText(typeFrame, "$ openclaw run complex-audit", 2);
  const line2Text = "⚠ Agent capacity exceeded. Task too complex.";
  const line2Start = 56 + 40; // after line1 finishes
  const line2 = frame > line2Start ? getTypedText(frame - line2Start, line2Text, 2) : "";

  // "What now?" text
  const whatNowDelay = line2Start + line2Text.length * 2 + 15;
  const whatNowProgress = spring({
    frame,
    fps,
    delay: whatNowDelay,
    config: { damping: 15, stiffness: 180 },
  });

  // Blinking cursor
  const cursorOpacity = interpolate(
    frame % 20,
    [0, 10, 20],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        padding: 80,
      }}
    >
      {/* Heading */}
      <div
        style={{
          fontFamily: THEME.headingFont,
          fontSize: 64,
          color: THEME.text,
          marginBottom: 50,
          opacity: headingOpacity,
          transform: `scale(${headingScale})`,
          textAlign: "center",
        }}
      >
        Your agent hits a task it{" "}
        <span style={{ color: THEME.teal }}>can't handle</span>
      </div>

      {/* Terminal window */}
      <div
        style={{
          width: 900,
          opacity: terminalProgress,
          transform: `translateY(${interpolate(terminalProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            background: "#2D2A26",
            borderRadius: "12px 12px 0 0",
            padding: "12px 16px",
            display: "flex",
            gap: 8,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28CA42" }} />
        </div>
        {/* Terminal body */}
        <div
          style={{
            background: "#1A1815",
            borderRadius: "0 0 12px 12px",
            padding: "24px 28px",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 22,
            lineHeight: 1.8,
            color: "#E8E2D9",
            minHeight: 140,
          }}
        >
          <div>
            <span style={{ color: THEME.teal }}>{line1}</span>
            {!line2 && <span style={{ opacity: cursorOpacity }}>▌</span>}
          </div>
          {line2 && (
            <div style={{ color: "#F59E0B" }}>
              {line2}
              <span style={{ opacity: cursorOpacity }}>▌</span>
            </div>
          )}
        </div>
      </div>

      {/* "What now?" */}
      <div
        style={{
          marginTop: 40,
          fontFamily: THEME.headingFont,
          fontSize: 48,
          color: THEME.earth,
          opacity: whatNowProgress,
          transform: `scale(${interpolate(whatNowProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        What now?
      </div>
    </AbsoluteFill>
  );
};
