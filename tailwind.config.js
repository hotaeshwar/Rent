/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#087F5B', // Primary Emerald
          800: '#064E3B', // Dark Forest
          900: '#064433',
          950: '#022C22',
        },
        surface: '#FFFFFF',
        canvas: '#F8FAF9',
        border: '#E6ECE8',
        ink: {
          primary: '#172B25',
          muted: '#718078',
        },
        status: {
          success: '#16A34A',
          warning: '#E9A23B',
          danger: '#DC5555',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

