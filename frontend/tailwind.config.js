/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg-primary':    '#0A0A0A',
        'bg-secondary':  '#111111',
        'bg-card':       '#1A1A1A',
        'gold':          '#C9A84C',
        'gold-light':    '#D4B76A',
        'accent-red':    '#E63946',
        'text-primary':  '#F5F5F5',
        'text-muted':    '#8A8A8A',
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'gold':    '0 0 0 1px rgba(201,168,76,0.4)',
        'gold-lg': '0 8px 40px rgba(201,168,76,0.15)',
        'card':    '0 4px 24px rgba(0,0,0,0.6)',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
