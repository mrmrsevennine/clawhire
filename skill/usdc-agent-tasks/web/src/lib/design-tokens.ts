// Claw Marketplace — Design Tokens
// Premium SaaS aesthetic: Stripe/Linear/Vercel vibes

export const colors = {
  // Primary Palette
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main accent
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Secondary (Cyan - USDC/crypto accent)
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
  },
  // Accent (Purple - premium feel)
  accent: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  // Neutrals
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
  hero: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 50%, #8B5CF6 100%)',
  heroText: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
  card: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(6,182,212,0.05) 100%)',
  button: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  buttonHover: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  subtle: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
  glow: '0 0 40px rgba(99,102,241,0.15)',
  glowCyan: '0 0 40px rgba(6,182,212,0.15)',
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
