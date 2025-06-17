/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom Color Palette
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#3b82f6',
          light: '#3b82f6',
          dark: '#3b82f6',
        },
        // Secondary Colors
        secondary: {
          DEFAULT: '#64748b',
        },
        // Success Colors
        success: {
          DEFAULT: '#22c55e',
        },
        // Warning Colors
        warning: {
          DEFAULT: '#f59e0b', // Main warning
        },
        // Error Colors
        error: {
          DEFAULT: '#ef4444', // Main error
        },
        // Module-specific Colors
        module: {
          prd: '#3b82f6',
          roadmap: '#10b981',
          tasks: '#f59e0b',
          scratchpad: '#eab308',
          prompts: '#8b5cf6',
          secrets: '#ef4444',
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