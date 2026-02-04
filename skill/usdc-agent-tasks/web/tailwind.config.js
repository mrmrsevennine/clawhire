/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brutal: {
          pink: '#FF6B9D',
          yellow: '#FFE66D',
          green: '#A8E6CF',
          blue: '#4ECDC4',
          orange: '#FF8A5C',
          purple: '#C3AED6',
          black: '#1a1a1a',
          bg: '#F5F0E8',
        },
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0 #1a1a1a',
        'brutal-lg': '6px 6px 0 #1a1a1a',
        'brutal-xl': '8px 8px 0 #1a1a1a',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
