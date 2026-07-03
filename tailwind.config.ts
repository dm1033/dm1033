import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f5c4f",
          50: "#ecfdf6",
          100: "#d1faea",
          500: "#0f9d75",
          600: "#0f7a5f",
          700: "#0f5c4f",
          900: "#0a3a32",
        },
        hazard: {
          DEFAULT: "#f4b400",
          dark: "#b88a00",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
