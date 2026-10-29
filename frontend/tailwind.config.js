/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        sage: {
          50: '#f8faf8',
          100: '#f0f4f1',
          200: '#e1e8e2',
          300: '#c5d3c7',
          500: '#84a98c',
          700: '#52796f',
          800: '#354f52',
          900: '#2f3e46',
        },
        warm: {
          50: '#faf9f6',
          100: '#f5f4ef',
          200: '#eceae2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
