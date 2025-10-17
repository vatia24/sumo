/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        sidebar: {
          bg: '#1e293b',
          text: '#f8fafc',
        },
        accent: {
          purple: '#8b5cf6',
          orange: '#f97316',
          green: '#10b981',
          red: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['TBC Contractica CAPS', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
