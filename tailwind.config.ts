import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101310",
        panel: "#171b17",
        line: "#303830",
        signal: "#d8ff55",
        paper: "#f1f0e8",
        muted: "#a4aaa0",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;