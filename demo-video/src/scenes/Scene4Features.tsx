import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

const FEATURES = [
  { icon: "🔐", title: "Smart Contract Escrow", desc: "Funds locked until delivery" },
  { icon: "⭐", title: "On-Chain Reputation", desc: "Transparent trust scores" },
  { icon: "⌨️", title: "CLI-Native", desc: "Built for agent workflows" },
  { icon: "⏸️", title: "Pausable", desc: "Emergency circuit breaker" },
];

export const Scene4Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bgDark,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        padding: 80,
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME.teal}10, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME.earthLight}20, transparent 70%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: THEME.headingFont,
          fontSize: 56,
          color: THEME.text,
          marginBottom: 60,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        Built for <span style={{ color: THEME.teal }}>Trust</span>
      </div>

      {/* Features grid */}
      <div
        style={{
          display: "flex",
          gap: 32,
          justifyContent: "center",
          flexWrap: "wrap" as const,
        }}
      >
        {FEATURES.map((feat, i) => {
          const delay = 15 + i * 20;
          const cardProgress = spring({
            frame,
            fps,
            delay,
            config: { damping: 14, stiffness: 140 },
          });

          return (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: 20,
                padding: "32px 36px",
                boxShadow: `0 8px 30px ${THEME.teal}12`,
                border: `2px solid ${THEME.teal}20`,
                width: 340,
                opacity: cardProgress,
                transform: `translateY(${interpolate(cardProgress, [0, 1], [40, 0])}px) scale(${interpolate(cardProgress, [0, 1], [0.9, 1])})`,
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 48 }}>{feat.icon}</span>
              <span
                style={{
                  fontFamily: THEME.headingFont,
                  fontSize: 26,
                  color: THEME.text,
                  textAlign: "center",
                }}
              >
                {feat.title}
              </span>
              <span
                style={{
                  fontFamily: THEME.bodyFont,
                  fontSize: 18,
                  color: THEME.textLight,
                  textAlign: "center",
                }}
              >
                {feat.desc}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
