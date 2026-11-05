/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          canvas: '#0B1020',
          surface: '#111830',
          ice: '#F8FAFC',
          cyan: '#00D4FF',
          magenta: '#FF2E9F',
          orange: '#FF7A18',
        },
      },
      animation: {
        'neon-pulse': 'neon-pulse 3s infinite ease-in-out',
        'gradient-shift': 'gradient-shift 5s infinite linear',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: 0.7, filter: 'brightness(1.5)' },
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '100%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
