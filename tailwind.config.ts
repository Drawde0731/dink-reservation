import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            light: '#A8D5BA',
            DEFAULT: '#A8D5BA',
            dark: '#276749',
          },
          orange: {
            DEFAULT: '#F4A261',
            vivid: '#E76F51',
          },
          cream: '#FFFDF7',
          surface: '#F2FAF5',
          border: '#D4E8DB',
          disabled: '#C5D0C8',
        },
        text: {
          primary: '#24332B',
          muted: '#66736B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
} satisfies Config
