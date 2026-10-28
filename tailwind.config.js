const { tokens } = require('./src/theme/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base: tokens.colors.bg.base,
        card: tokens.colors.surface.card,
        raised: tokens.colors.surface.raised,
        overlay: tokens.colors.surface.overlay,
        subtle: tokens.colors.border.subtle,
        strong: tokens.colors.border.strong,
        ...tokens.colors.text,
        accent: tokens.colors.accent,
        onAccent: tokens.colors.onAccent,
        danger: tokens.colors.danger,
        warning: tokens.colors.warning,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.radii,
      fontFamily: Object.fromEntries(
        Object.entries(tokens.fontFamily).map(([name, family]) => [
          name,
          [family],
        ]),
      ),
    },
  },
  plugins: [],
};
