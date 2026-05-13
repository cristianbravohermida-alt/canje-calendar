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
        bg: "#f7f4ee",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#5c5c5c",
          muted: "#8a8a8a",
        },
        border: {
          DEFAULT: "#e6e1d6",
          soft: "#efebdf",
        },
        urgent: {
          DEFAULT: "#d64545",
          bg: "#fbe5e5",
          fg: "#a82828",
        },
        important: {
          DEFAULT: "#d9962a",
          bg: "#fbeed2",
          fg: "#8a5f0e",
        },
        personal: {
          DEFAULT: "#c9a82b",
          bg: "#f8efc8",
          fg: "#7a6311",
        },
        noise: {
          DEFAULT: "#9b9b9b",
          bg: "#ececec",
          fg: "#5c5c5c",
        },
        ok: "#1f7a3e",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
