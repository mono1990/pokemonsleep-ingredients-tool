/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sleepblue: '#8CC6E7',
        sleepyello: '#FFF4CC',
        sleepgreen: '#C8E6C9',
        sleeppink: '#F8BBD0',
      }
    },
  },
  plugins: [],
}

