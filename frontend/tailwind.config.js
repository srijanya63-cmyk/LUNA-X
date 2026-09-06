/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luna: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          blue: '#0EA5E9',
          teal: '#14B8A6',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          text: '#0F172A',
          subtext: '#475569',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        tech: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(14, 165, 233, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
        'blue-glow': '0 0 20px rgba(14, 165, 233, 0.25)',
        'teal-glow': '0 0 20px rgba(20, 184, 166, 0.25)',
      }
    },
  },
  plugins: [],
}
