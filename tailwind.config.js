/**
 * Design tokens live here and in styles/globals.css.
 * Colors reference CSS variables so the whole theme can be
 * changed by editing the :root block in globals.css.
 */

/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens. Values defined in styles/globals.css.
        base: "rgb(var(--c-base) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        raised: "rgb(var(--c-raised) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--c-accent-ink) / <alpha-value>)",
        // Flair tokens: gradients, particles, glows. Not for body text.
        star: "rgb(var(--c-star) / <alpha-value>)",
        plasma: "rgb(var(--c-plasma) / <alpha-value>)",
        nebula: "rgb(var(--c-nebula) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: {
        content: "72rem",
        prose: "42rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { transform: "translateY(12px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        "fade-in": "fade-in 600ms ease-out both",
      },
      animationDelay: {
        none: "0s",
        100: "100ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "animation-delay": (value) => ({ animationDelay: value }),
        },
        { values: theme("animationDelay") }
      );
    }),
  ],
};
