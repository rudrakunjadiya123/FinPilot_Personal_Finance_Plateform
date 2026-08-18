/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        'ink-faint': 'var(--color-ink-faint)',
        paper: 'var(--color-paper)',
        'paper-raised': 'var(--color-paper-raised)',
        'paper-sunken': 'var(--color-paper-sunken)',
        sidebar: 'var(--color-sidebar)',

        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
          glow: 'var(--color-accent-glow)',
        },

        positive: {
          DEFAULT: 'var(--color-positive)',
          soft: 'var(--color-positive-soft)',
        },
        negative: {
          DEFAULT: 'var(--color-negative)',
          soft: 'var(--color-negative-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },

        border: {
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },

        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
          6: 'var(--chart-6)',
        },

        // Legacy aliases for backward compat during migration
        teal: {
          50:  'var(--color-accent-soft)',
          100: 'var(--color-accent-soft)',
          500: 'var(--color-accent)',
          600: 'var(--color-accent)',
          700: 'var(--color-accent)',
          900: 'var(--color-ink)',
        },
        gold: {
          100: 'var(--color-warning-soft)',
          500: 'var(--color-warning)',
          700: 'var(--color-warning)',
        },
        rust: {
          100: 'var(--color-negative-soft)',
          500: 'var(--color-negative)',
          700: 'var(--color-negative)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
}
