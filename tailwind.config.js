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
        background: '#F5F0E8',
        foreground: '#2C2416',
        primary: {
          DEFAULT: '#4A6741',
          light: '#6B8F62',
          dark: '#344D2F',
        },
        secondary: {
          DEFAULT: '#8B7355',
          light: '#A89070',
          dark: '#6E5A3E',
        },
        accent: {
          gold: '#C8A84B',
          cream: '#EAF0E6',
          warm: '#F5F0E8',
          earth: '#D4C4A0',
        },
        muted: {
          DEFAULT: '#EAF0E6',
          foreground: '#7A7060',
        },
        border: 'rgba(74, 103, 65, 0.15)',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2C2416',
        },
        dark: {
          DEFAULT: '#2C2416',
          secondary: '#3D3220',
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
        forest: '0 20px 60px -15px rgba(74, 103, 65, 0.2)',
        'forest-lg': '0 40px 80px -20px rgba(74, 103, 65, 0.25)',
        warm: '0 20px 60px -15px rgba(74, 103, 65, 0.2)',
        'warm-lg': '0 40px 80px -20px rgba(74, 103, 65, 0.25)',
        card: '0 4px 24px -4px rgba(44, 36, 22, 0.08)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #2C2416 0%, #3D3220 100%)',
        'gradient-forest': 'linear-gradient(135deg, #344D2F 0%, #4A6741 100%)',
        'gradient-sienna': 'linear-gradient(135deg, #4A6741 0%, #C8A84B 100%)',
        'gradient-hero': 'linear-gradient(to bottom, rgba(245,240,232,0.15) 0%, rgba(245,240,232,0.85) 100%)',
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