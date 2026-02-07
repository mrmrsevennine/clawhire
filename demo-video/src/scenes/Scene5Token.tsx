import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

export const Scene5Token: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  const FLOW_STEPS = [
    { icon: "💰", label: "Task Fee", sub: "2.5% of every task" },
    { icon: "→", label: "", sub: "" },
    { icon: "📊", label: "RevenueShare", sub: "50/50 split" },
    { icon: "→", label: "", sub: "" },
    { icon: "🏦", label: "$HIRE Stakers", sub: "Earn real USDC" },
  ];

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
      {/* Title */}
      <div
        style={{
          fontFamily: THEME.headingFont,
          fontSize: 56,
          color: THEME.text,
          marginBottom: 20,
          opacity: titleProgress,
          transform: `scale(${interpolate(titleProgress, [0, 1], [0.9, 1])})`,
        }}
      >
        Stake <span style={{ color: THEME.teal }}>$HIRE</span>. Earn USDC.
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: THEME.bodyFont,
          fontSize: 26,
          color: THEME.textLight,
          marginBottom: 60,
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Real yield from real platform fees. No inflation.
      </div>

      {/* Flow diagram */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {FLOW_STEPS.map((step, i) => {
          const delay = 20 + i * 12;
          const progress = spring({ frame, fps, delay, config: { damping: 14, stiffness: 100 } });

          if (step.icon === "→") {
            return (
              <div
                key={i}
                style={{
                  opacity: progress,
                  fontFamily: THEME.bodyFont,
                  fontSize: 40,
                  color: THEME.teal,
                }}
              >
                →
              </div>
            );
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
                background: `linear-gradient(135deg, ${THEME.teal}10, ${THEME.teal}05)`,
                border: `2px solid ${THEME.teal}30`,
                borderRadius: 24,
                padding: "28px 36px",
                minWidth: 200,
              }}
            >
              <div style={{ fontSize: 48 }}>{step.icon}</div>
              <div
                style={{
                  fontFamily: THEME.headingFont,
                  fontSize: 28,
                  color: THEME.text,
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontFamily: THEME.bodyFont,
                  fontSize: 18,
                  color: THEME.textLight,
                }}
              >
                {step.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live proof badge */}
      <div
        style={{
          marginTop: 50,
          opacity: interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: `${THEME.teal}15`,
          border: `1px solid ${THEME.teal}40`,
          borderRadius: 50,
          padding: "12px 28px",
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: THEME.teal }} />
        <span style={{ fontFamily: THEME.bodyFont, fontSize: 20, color: THEME.teal, fontWeight: 600 }}>
          Verified on Base Sepolia — 10,000 $HIRE staked, USDC claimed
        </span>
      </div>
    </AbsoluteFill>
  );
};
