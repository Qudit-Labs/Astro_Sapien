/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060913',
          900: '#0b1021',
          800: '#131c36',
          700: '#1e2c52',
        },
        fireline: {
          500: '#f97316',
          600: '#ea580c',
        },
        testmatch: {
          500: '#38bdf8',
          600: '#0284c7',
        },
        smokewise: {
          500: '#a855f7',
          600: '#9333ea',
        }
      }
    },
  },
  plugins: [],
}
