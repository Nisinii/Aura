/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Updated to use the CSS variable we defined in layout.js
        sans: ['var(--font-poppins)', 'sans-serif'], 
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          black: '#050505',
          violet: '#7c3aed',
          surface: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      }
    },
  },
  plugins: [],
};