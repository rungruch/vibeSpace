/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  // Enable class-based dark mode. Second value custom selector must include a leading dot.
  // Using '.dark' so adding class="dark" to <html> (done in ThemeProvider) activates dark variants.
  darkMode: ['class', '.dark'],
  theme: {
    extend: {
      fontFamily: {
        'kanit': ['Kanit', 'sans-serif'],
      },
      colors: {
        // Explicit zinc palette to guarantee generation of zinc utilities
        zinc: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Custom colors for better dark mode support
        primary: {
          50: '#f0f9ff',
          500: '#722ed1',
          600: '#5b21b6',
          900: '#312e81',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      }
    },
  },
  plugins: [
        function({ addUtilities }) {
          addUtilities({
            '.drag-none': {
              'user-select': 'none',
              '-webkit-user-drag': 'none',
              '-khtml-user-drag': 'none',
              '-moz-user-drag': 'none',
              '-o-user-drag': 'none',
            },
          });
        },
      ],
}
