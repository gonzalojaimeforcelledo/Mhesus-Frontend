/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF0FC",
          100: "#D7DBF7",
          300: "#8B93E8",
          500: "#3A44C9",
          700: "#14149C",
          900: "#0B0B6B"
        },
        wing: {
          100: "#EAF1FF",
          300: "#B8D4FF",
          500: "#8FB8F5"
        },
        amber: {
          400: "#F2A93B",
          500: "#E5941F"
        },
        emerald: {
          500: "#1FA971",
          600: "#188158"
        },
        crimson: {
          500: "#E5484D"
        },
        ink: {
          900: "rgb(var(--c-ink-900) / <alpha-value>)",
          700: "rgb(var(--c-ink-700) / <alpha-value>)",
          500: "rgb(var(--c-ink-500) / <alpha-value>)",
          300: "rgb(var(--c-ink-300) / <alpha-value>)",
          100: "rgb(var(--c-ink-100) / <alpha-value>)",
          50: "rgb(var(--c-ink-50) / <alpha-value>)"
        },
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        brand: {
          700: "rgb(var(--c-brand-700) / <alpha-value>)",
          900: "rgb(var(--c-brand-900) / <alpha-value>)"
        }
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["\"Roboto Condensed\"", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11,11,107,0.06), 0 8px 24px -12px rgba(11,11,107,0.18)"
      }
    }
  },
  plugins: []
}
