const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'bright-pulse': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 2px #60a5fa)',
            transform: 'scale(1)'
          },
          '50%': {
            filter: 'drop-shadow(0 0 6px #60a5fa)',
            transform: 'scale(1.1)'
          }
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'bright-pulse': 'bright-pulse 2s ease-in-out infinite',
      },
      colors: {
        gold: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',

        },
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}