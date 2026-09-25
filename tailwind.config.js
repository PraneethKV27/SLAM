/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        robot: {
          bg: '#0a0d14',
          card: '#101522',
          cardBorder: '#1c2438',
          accent: '#00f0ff',
          accentGlow: 'rgba(0, 240, 255, 0.25)',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          dangerGlow: 'rgba(239, 68, 68, 0.35)',
          muted: '#64748b',
          grid: '#1a2234',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        tech: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.3)',
        'glow-red': '0 0 25px -2px rgba(239, 68, 68, 0.45)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'radar-sweep': 'radar 3s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
