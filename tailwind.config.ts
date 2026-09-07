import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { 
    extend: {
      colors: {
        brand: {
          lime: "#b2de4f",
          limeDeep: "#83b92d",
          ink: "#111312",
          muted: "#6c716d",
          canvas: "#f8faf7",
          line: "#e6e9e5",
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
