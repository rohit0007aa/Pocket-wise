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
        bg: {
          main: "#071510",
          secondary: "#0D2017",
          card: "#14291E",
        },
        accent: {
          emerald: "#40E8A1",
          lime: "#D5FA72",
        },
        text: {
          main: "#F4F8F5",
          muted: "#91A99B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 30px -8px rgba(64, 232, 161, 0.25)",
        "glow-lime": "0 0 24px -6px rgba(213, 250, 114, 0.22)",
        card: "0 12px 32px -12px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
