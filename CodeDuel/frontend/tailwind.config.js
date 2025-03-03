/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f3ff',
        'neon-purple': '#9d00ff',
        'dark-bg': '#0a0a0a',
        'card-bg': '#1a1a1a',
      },
    },
  },
  plugins: [],
} 