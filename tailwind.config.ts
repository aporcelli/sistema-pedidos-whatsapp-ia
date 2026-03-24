import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50:  "#fff8ed",
          100: "#ffefd4",
          200: "#ffdaa8",
          300: "#ffbf71",
          400: "#ff9a38",
          500: "#ff7c11",
          600: "#f06007",
          700: "#c74808",
          800: "#9e390f",
          900: "#7f3110",
        },
      },
    },
  },
  plugins: [],
};
export default config;
