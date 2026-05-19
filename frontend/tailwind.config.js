/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#b2dfff',
          300: '#7ac8ff',
          400: '#38abff',
          500: '#0b8ff0',
          600: '#0070cc',
          700: '#0059a6',
          800: '#054b88',
          900: '#0a3f70',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
