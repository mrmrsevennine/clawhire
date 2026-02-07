import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

const STATS = [
  { value: "51/51", label: "Tests Passing", suffix: " ✅" },
  { value: "3", label: "Smart Contracts", suffix: "" },
  { value: "18", label: "CLI Scripts", suffix: "" },
];

// Animated counter that counts up to target
const AnimatedNumber: React.FC<{
  target: string;
  progress: number;
  suffix: string;
}> = ({ target, progress, suffix }) => {
  // For strings like "34/34" or "600+", just reveal progressively
  const chars = Math.round(target.length * progress);
  const displayed = target.slice(0, chars);

  return (
    <span>
      {displayed}
      {progress >= 1 ? suffix : ""}
    </span>
  );
};

export const Scene5Stats: React.FC = () => {
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
          marginBottom: 70,
          opacity: titleProgress,
          transform: `scale(${interpolate(titleProgress, [0, 1], [0.9, 1])})`,
        }}
      >
        Battle <span style={{ color: THEME.teal }}>Tested</span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 80,
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {STATS.map((stat, i) => {
          const delay = 10 + i * 18;
          const statProgress = spring({
            frame,
            fps,
            delay,
            config: { damping: 12, stiffness: 100 },
          });

          const countProgress = interpolate(
            frame - (delay + 10),
            [0, 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                opacity: statProgress,
                transform: `translateY(${interpolate(statProgress, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: THEME.headingFont,
                  fontSize: 80,
                  color: THEME.teal,
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber
                  target={stat.value}
                  progress={countProgress}
                  suffix={stat.suffix}
                />
              </div>
              <div
                style={{
                  fontFamily: THEME.bodyFont,
                  fontSize: 24,
                  color: THEME.textLight,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decorative line */}
      <div
        style={{
          marginTop: 50,
          height: 3,
          width: interpolate(
            spring({ frame, fps, delay: 50, config: { damping: 200 } }),
            [0, 1],
            [0, 600]
          ),
          background: `linear-gradient(90deg, transparent, ${THEME.teal}, transparent)`,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
