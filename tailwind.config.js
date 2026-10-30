/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#050408',
          900: '#08070d',
          850: '#0d0b14',
          800: '#141120',
          700: '#1e1a2f',
          600: '#2c2642',
        },
        luxe: {
          bone: '#EDE8E1',
          silver: '#C5BFC9',
          muted: '#847D8D',
          border: 'rgba(255, 255, 255, 0.08)',
          glow: '#9333ea',
          violet: '#a855f7',
          amethyst: '#c084fc',
        }
      },
      letterSpacing: {
        widest: '.2em',
        mega: '.35em',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
