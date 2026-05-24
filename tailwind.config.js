/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          soft: 'var(--paper-soft)',
          sunk: 'var(--paper-sunk)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          mute: 'var(--ink-mute)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          line: 'var(--accent-line)',
        },
        mark: {
          DEFAULT: 'var(--mark)',
          line: 'var(--mark-line)',
        },
        rule: {
          DEFAULT: 'var(--rule)',
          soft: 'var(--rule-soft)',
        },
        err: 'var(--err)',
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        jp: 'var(--font-jp)',
        'jp-sans': 'var(--font-jp-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
}
