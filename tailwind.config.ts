import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { 
    extend: {
      colors: {
        brand: {
          lime: "rgb(var(--brand-lime) / <alpha-value>)",
          limeDeep: "rgb(var(--brand-lime-deep) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          canvas: "rgb(var(--brand-canvas) / <alpha-value>)",
          line: "rgb(var(--brand-line) / <alpha-value>)",
        },
        dark: {
          ink: "#f3f6f0",
          muted: "#a8b1a8",
          canvas: "#111512",
          line: "#2a332a",
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    } 
  },
  plugins: [],
};

export default config;
