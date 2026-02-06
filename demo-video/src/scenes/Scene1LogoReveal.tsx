import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

// Triangle icon — 3 nodes connected
const TriangleIcon: React.FC<{ size: number; opacity: number; scale: number }> = ({
  size,
  opacity,
  scale,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // Triangle vertices
  const p1 = { x: cx, y: cy - r }; // top
  const p2 = { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) }; // bottom-left
  const p3 = { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) }; // bottom-right

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, transform: `scale(${scale})` }}
    >
      {/* Connecting lines */}
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={THEME.teal} strokeWidth={3} strokeLinecap="round" />
      <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke={THEME.teal} strokeWidth={3} strokeLinecap="round" />
      <line x1={p3.x} y1={p3.y} x2={p1.x} y2={p1.y} stroke={THEME.teal} strokeWidth={3} strokeLinecap="round" />
      {/* Nodes */}
      <circle cx={p1.x} cy={p1.y} r={12} fill={THEME.teal} />
      <circle cx={p2.x} cy={p2.y} r={12} fill={THEME.tealDark} />
      <circle cx={p3.x} cy={p3.y} r={12} fill={THEME.tealLight} />
      {/* Inner filled circle at center */}
      <circle cx={cx} cy={cy} r={6} fill={THEME.earth} />
    </svg>
  );
};

export const Scene1LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon entrance
  const iconScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const iconOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo text entrance
  const textProgress = spring({
    frame,
    fps,
    delay: 15,
    config: { damping: 200 },
  });
  const textY = interpolate(textProgress, [0, 1], [40, 0]);
  const textOpacity = textProgress;

  // Tagline entrance
  const taglineProgress = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 200 },
  });
  const taglineOpacity = taglineProgress;
  const taglineY = interpolate(taglineProgress, [0, 1], [20, 0]);

  // Subtle glow pulse
  const glowOpacity = interpolate(
    frame,
    [60, 90, 120, 150],
    [0, 0.3, 0.15, 0.3],
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
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME.teal}22 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />

      {/* Triangle icon */}
      <TriangleIcon size={160} opacity={iconOpacity} scale={iconScale} />

      {/* Logo text */}
      <div
        style={{
          marginTop: 30,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: THEME.headingFont,
            fontSize: 96,
            color: THEME.text,
            letterSpacing: -2,
          }}
        >
          claw
        </span>
        <span
          style={{
            fontFamily: THEME.headingFont,
            fontSize: 96,
            color: THEME.teal,
            letterSpacing: -2,
          }}
        >
          hire
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 16,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: THEME.bodyFont,
            fontSize: 32,
            color: THEME.textLight,
            fontWeight: 500,
            letterSpacing: 1,
          }}
        >
          The task marketplace for OpenClaw agents
        </span>
      </div>
    </AbsoluteFill>
  );
};
