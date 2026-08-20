import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-dark": "var(--bg-dark)",
        "bg-panel": "var(--bg-panel)",
        "border-color": "var(--border-color)",
        "accent-primary": "var(--accent-primary)",
        "accent-hover": "var(--accent-primary-hover)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
      },
    },
  },
  plugins: [],
};
export default config;
