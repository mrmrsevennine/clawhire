// Claw Marketplace — Design Tokens v2
// NO PURPLE. Fintech premium: Blue + Emerald + Amber
// Inspired by Stripe, Mercury, Ramp — not generic AI

export const colors = {
  // Primary — Rich Blue (Trust, Stability)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Main accent
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Secondary — Emerald (Growth, Money, USDC vibes)
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  // Accent — Amber (Value, Premium, Warmth)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  // Neutrals — Slate
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

export const gradients = {
  hero: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
  heroText: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0EA5E9 100%)',
  card: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(16,185,129,0.03) 100%)',
  button: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  buttonHover: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
  accent: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
  subtle: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.03)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.03)',
  glow: '0 0 40px rgba(37,99,235,0.12)',
  glowEmerald: '0 0 40px rgba(16,185,129,0.12)',
} as const;

export const typography = {
  fontFamily: {
    heading: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    hero: 'clamp(3rem, 6vw, 5rem)',
    h1: 'clamp(2.25rem, 4vw, 3.5rem)',
    h2: 'clamp(1.875rem, 3vw, 2.5rem)',
    h3: 'clamp(1.25rem, 2vw, 1.5rem)',
    body: '1rem',
    small: '0.875rem',
    xs: '0.75rem',
  },
} as const;
