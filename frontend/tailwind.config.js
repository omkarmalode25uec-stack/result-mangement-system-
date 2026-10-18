/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sanjivani: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1d4ed8', // official primary blue
          700: '#1e40af',
          800: '#1e3a8a', // academic deep navy
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
