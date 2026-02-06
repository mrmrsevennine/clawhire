/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Boho/organic palette — warm cream base with teal accent
        cream: {
          50: '#FFFDF8',
          100: '#FFF9EE',
          200: '#FFF3DC',
          300: '#FFECC8',
          400: '#FFE0A3',
        },
        sand: {
          100: '#F5F0E8',
          200: '#EBE4D8',
          300: '#D9CFC0',
          400: '#C4B8A5',
          500: '#A69B8A',
          600: '#8A7F6F',
        },
        bark: {
          700: '#4A3F35',
          800: '#3A3129',
          900: '#2A231D',
          950: '#1A1610',
        },
        // Teal accent stays — but warmer/turquoise
        accent: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        status: {
          open: '#14B8A6',
          claimed: '#A69B8A',
          submitted: '#D97706',
          approved: '#059669',
          disputed: '#DC2626',
        },
        usdc: { 400: '#5EEAD4', 500: '#14B8A6', 600: '#0D9488' },
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'organic': '2rem',
        'blob': '60% 40% 50% 50% / 50% 60% 40% 50%',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
