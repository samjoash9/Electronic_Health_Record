/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
        body: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        h6: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        h5: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        h4: ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em', fontWeight: '700' }],
        h2: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1: ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-l': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '900' }],
        'display-xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em', fontWeight: '900' }],
      },
    },
  },
  plugins: [],
};
