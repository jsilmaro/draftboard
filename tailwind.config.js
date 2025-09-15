/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
             animation: {
         'fade-in': 'fadeIn 0.5s ease-in-out',
         'slide-up': 'slideUp 0.3s ease-out',
         'slide-down': 'slideDown 0.3s ease-out',
         'slide-in': 'slide-in 0.5s ease-out',
         'flow-down': 'flow-down 3s ease-in-out infinite',
       },
             keyframes: {
         fadeIn: {
           '0%': { opacity: '0' },
           '100%': { opacity: '1' },
         },
         slideUp: {
           '0%': { transform: 'translateY(10px)', opacity: '0' },
           '100%': { transform: 'translateY(0)', opacity: '1' },
         },
         slideDown: {
           '0%': { transform: 'translateY(-10px)', opacity: '0' },
           '100%': { transform: 'translateY(0)', opacity: '1' },
         },
         'slide-in': {
           '0%': { transform: 'translateX(-100%)', opacity: '0' },
           '100%': { transform: 'translateX(0)', opacity: '1' },
         },
         'flow-down': {
           '0%': { transform: 'translateY(-100%)', opacity: '0' },
           '50%': { opacity: '0.5' },
           '100%': { transform: 'translateY(100%)', opacity: '0' },
         },
       },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
        '4xl': '0 45px 80px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
} 