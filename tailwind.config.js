/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        space: {
          950: '#07172B',
          900: '#0B1D36',
          800: '#10243D',
          700: '#1A3456',
          600: '#254773',
        },
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
        },
        science: {
          cyan: '#38BDF8',
          teal: '#24B8A0',
          amber: '#F5B942',
        },
        fireline: {
          500: '#FC3D21',
          600: '#E03217',
        },
        testmatch: {
          500: '#38BDF8',
          600: '#0284C7',
        },
        smokewise: {
          500: '#24B8A0',
          600: '#1A9682',
        },
      },
    },
  },
  plugins: [],
};
