// Claw Marketplace — Design Tokens v3
// PASTEL + BAUHAUS TOUCH + WHITE CLEAN MINIMALIST
// Soft pastels, geometric accents, lots of whitespace

export const colors = {
  // Pastel Blue (Primary — trust, calm)
  blue: {
    50: '#F0F7FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD', // Main pastel
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
  },
  // Pastel Mint (Secondary — growth, USDC)
  mint: {
    50: '#F0FDF9',
    100: '#CCFBEF',
    200: '#99F6E4',
    300: '#5EEAD4', // Main pastel
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
  },
  // Pastel Coral (Accent — warmth, energy)
  coral: {
    50: '#FFF5F5',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF', // Main pastel
    400: '#FB7185',
    500: '#F43F5E',
  },
  // Pastel Sand (Warm neutral accent)
  sand: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FDE68A', // Warm pastel
    300: '#FCD34D',
    400: '#FBBF24',
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
  // Soft pastel gradients
  hero: 'linear-gradient(135deg, #93C5FD 0%, #5EEAD4 50%, #FDA4AF 100%)',
  heroText: 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
  card: 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(94,234,212,0.06) 100%)',
  button: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
  accent: 'linear-gradient(135deg, #93C5FD 0%, #5EEAD4 100%)',
  subtle: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
} as const;

// Bauhaus-inspired geometric shapes config
export const bauhaus = {
  shapes: ['circle', 'triangle', 'square', 'line'] as const,
  pastelColors: ['#93C5FD', '#5EEAD4', '#FDA4AF', '#FDE68A', '#BFDBFE', '#99F6E4'],
} as const;
