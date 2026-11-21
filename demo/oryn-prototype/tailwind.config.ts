import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'
import { TYPE_SCALE } from './src/lib/type-scale'

const fontSize = Object.fromEntries(
  Object.entries(TYPE_SCALE).map(([role, s]) => [
    role,
    [`${s.size}px`, { lineHeight: `${s.line}px`, letterSpacing: s.tracking, fontWeight: String(s.weight) }],
  ]),
) as NonNullable<NonNullable<Config['theme']>['fontSize']>

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    // Replaced, not extended: the type scale is the only source of sizes (minimum 11px).
    fontSize,
    // Replaced, not extended: floating shadows only. No hard stage shadows in product UI.
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
    // Radius 0 structural / 4 nested / 6 control / 8 card and dialog.
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      full: '9999px',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'muted-foreground': 'var(--muted-foreground)',
        trace: 'var(--trace)',
        signal: 'var(--signal)',
        arc: 'var(--arc)',
        'arc-ink': 'var(--arc-ink)',
        'arc-mark': 'var(--arc-mark)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        // shadcn semantic aliases, mapped onto the neutral tokens (never onto arc).
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--foreground)' },
        popover: { DEFAULT: 'var(--surface)', foreground: 'var(--foreground)' },
        primary: { DEFAULT: 'var(--foreground)', foreground: 'var(--background)' },
        secondary: { DEFAULT: 'var(--surface-2)', foreground: 'var(--foreground)' },
        muted: { DEFAULT: 'var(--surface-2)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--surface-2)', foreground: 'var(--foreground)' },
        destructive: { DEFAULT: 'var(--danger)', foreground: 'var(--background)' },
        input: 'var(--border)',
        ring: 'var(--foreground)',
      },
      borderColor: { DEFAULT: 'var(--border)' },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-serif)'],
      },
      transitionDuration: { DEFAULT: '150ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  },
  plugins: [
    animate,
    // .type-<role> = family + size + line height + tracking + weight + tabular numerals.
    plugin(({ addComponents }) => {
      addComponents(
        Object.fromEntries(
          Object.entries(TYPE_SCALE).map(([role, s]) => [
            `.type-${role}`,
            {
              fontFamily: `var(--font-${s.family})`,
              fontSize: `${s.size}px`,
              lineHeight: `${s.line}px`,
              letterSpacing: s.tracking,
              fontWeight: String(s.weight),
              fontVariantNumeric: 'tabular-nums',
            },
          ]),
        ),
      )
    }),
  ],
}

export default config
