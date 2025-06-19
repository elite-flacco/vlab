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
          DEFAULT: '#00ff9f',
          dim: '#00cc7a',
          dark: '#00b36a',
        },
        secondary: {
          DEFAULT: '#1f1f1f',
        },
        success: { DEFAULT: '#22c55e' },
        warning: { DEFAULT: '#facc15' },
        error: { DEFAULT: '#ff4b4b' },
        // Module-specific Colors
        module: {
          DEFAULT: '#00ff9f',
          prd: 'rgba(0, 255, 159, 1.0)',
          roadmap: 'rgba(0, 255, 159, 0.85)',
          tasks: 'rgba(0, 255, 159, 0.7)',
          scratchpad: 'rgba(0, 255, 159, 0.55)',
          prompts: 'rgba(0, 255, 159, 0.4)',
          secrets: 'rgba(0, 255, 159, 0.25)',
        },
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

    },
  },
  plugins: [
    // Add form plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};