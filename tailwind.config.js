/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF6F0',
        foreground: '#2A1F1A',
        primary: {
          DEFAULT: '#C4785A',
          light: '#D4957A',
          dark: '#A85E43',
        },
        secondary: {
          DEFAULT: '#8B6E7F',
          light: '#A68899',
          dark: '#6E5465',
        },
        accent: {
          gold: '#D4A853',
          cream: '#F2EBE1',
          warm: '#FAF6F0',
        },
        muted: {
          DEFAULT: '#F2EBE1',
          foreground: '#7A6E68',
        },
        border: 'rgba(196, 120, 90, 0.15)',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2A1F1A',
        },
        dark: {
          DEFAULT: '#2A1F1A',
          secondary: '#3D2E27',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '0.85' }],
        '12xl': ['12rem', { lineHeight: '0.85' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      boxShadow: {
        warm: '0 20px 60px -15px rgba(196, 120, 90, 0.2)',
        'warm-lg': '0 40px 80px -20px rgba(196, 120, 90, 0.25)',
        card: '0 4px 24px -4px rgba(42, 31, 26, 0.08)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #2A1F1A 0%, #3D2E27 100%)',
        'gradient-sienna': 'linear-gradient(135deg, #C4785A 0%, #D4A853 100%)',
        'gradient-hero': 'linear-gradient(to bottom, rgba(250,246,240,0.15) 0%, rgba(250,246,240,0.85) 100%)',
      },
      animation: {
        'float-slow': 'float-slow 7s ease-in-out infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(8deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};