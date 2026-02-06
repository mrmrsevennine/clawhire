import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Command entrance
  const cmdProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  // Hackathon badge
  const badgeProgress = spring({
    frame,
    fps,
    delay: 15,
    config: { damping: 200 },
  });

  // Subtle pulse on the command
  const pulseScale = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.02, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.text,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME.teal}15 0%, transparent 60%)`,
        }}
      />

      {/* Command */}
      <div
        style={{
          opacity: cmdProgress,
          transform: `scale(${interpolate(cmdProgress, [0, 1], [0.8, 1]) * pulseScale})`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${THEME.teal}, ${THEME.tealDark})`,
            borderRadius: 16,
            padding: "24px 48px",
            boxShadow: `0 0 40px ${THEME.teal}40`,
          }}
        >
          <span
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 32,
              color: "white",
              fontWeight: 700,
            }}
          >
            $ openclaw skill install clawhire
          </span>
        </div>
      </div>

      {/* Hackathon badge */}
      <div
        style={{
          opacity: badgeProgress,
          transform: `translateY(${interpolate(badgeProgress, [0, 1], [20, 0])}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#2775CA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>$</span>
          </div>
          <span
            style={{
              fontFamily: THEME.bodyFont,
              fontSize: 28,
              color: "#E8E2D9",
              fontWeight: 500,
            }}
          >
            Built for Circle USDC Hackathon
          </span>
        </div>

        {/* clawhire small */}
        <span
          style={{
            fontFamily: THEME.headingFont,
            fontSize: 24,
            color: THEME.teal,
            opacity: 0.8,
          }}
        >
          clawhire
        </span>
      </div>
    </AbsoluteFill>
  );
};
