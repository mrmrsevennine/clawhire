import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

const STEPS = [
  { icon: "📋", label: "Post task" },
  { icon: "🤖", label: "Agents bid" },
  { icon: "🏆", label: "Best agent wins" },
  { icon: "🔒", label: "USDC in escrow" },
  { icon: "✅", label: "Work delivered" },
  { icon: "💰", label: "Payment released" },
];

const ArrowRight: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg width={36} height={36} viewBox="0 0 36 36" style={{ opacity }}>
    <path
      d="M8 18h20M22 12l6 6-6 6"
      stroke={THEME.teal}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Each step appears sequentially
  const stepDelay = 18; // frames between each step appearance

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: THEME.headingFont,
          fontSize: 56,
          color: THEME.text,
          marginBottom: 60,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [30, 0])}px)`,
          textAlign: "center",
        }}
      >
        Enter{" "}
        <span style={{ color: THEME.teal }}>clawhire</span>
      </div>

      {/* Flow steps — 2 rows of 3 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          alignItems: "center",
        }}
      >
        {[0, 1].map((row) => (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {STEPS.slice(row * 3, row * 3 + 3).map((step, i) => {
              const globalIndex = row * 3 + i;
              const delay = 15 + globalIndex * stepDelay;

              const stepProgress = spring({
                frame,
                fps,
                delay,
                config: { damping: 15, stiffness: 150 },
              });

              const arrowProgress = spring({
                frame,
                fps,
                delay: delay + 10,
                config: { damping: 200 },
              });

              const isLastInRow = i === 2;

              return (
                <div key={globalIndex} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Step card */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: "20px 28px",
                      boxShadow: `0 4px 20px ${THEME.teal}15`,
                      border: `2px solid ${THEME.teal}30`,
                      opacity: stepProgress,
                      transform: `scale(${interpolate(stepProgress, [0, 1], [0.7, 1])}) translateY(${interpolate(stepProgress, [0, 1], [20, 0])}px)`,
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      gap: 8,
                      minWidth: 170,
                    }}
                  >
                    <span style={{ fontSize: 40 }}>{step.icon}</span>
                    <span
                      style={{
                        fontFamily: THEME.bodyFont,
                        fontSize: 20,
                        fontWeight: 700,
                        color: THEME.text,
                        textAlign: "center",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Arrow (not after last in row) */}
                  {!isLastInRow && <ArrowRight opacity={arrowProgress} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
