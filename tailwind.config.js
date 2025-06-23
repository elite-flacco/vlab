/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom Color Palette
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#00ff9f',
          light: '#66ffcc',
          dark: '#00cc7a',
        },
        background: {
          DEFAULT: '#0f0f0f',
        },
        foreground: {
          DEFAULT: '#ffffff',
          dim: '#a0a0a0',
          dark: '#707070',
        },
        secondary: {
          DEFAULT: '#1f1f1f',
        },
        success: { DEFAULT: '#22c55e' },
        warning: { DEFAULT: '#facc15' },
        error: { DEFAULT: '#ff4b4b' },
        destructive: { DEFAULT: '#ff4b4b' },
        border: { DEFAULT: '#2a2a2a' },
      },

      // Font Families
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        mono: ['Share Tech Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },

      // Breakpoints (Mobile-first)
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // Box Shadows
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 159, 0.2)',
      },

      // Transitions
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },

      // Animations
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 255, 159, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 159, 0.4)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    // Add form plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};