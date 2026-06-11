import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "buildcycle-gray": {
          50: "#f8f6f3",
          100: "#efebe5",
          200: "#ddd5c9",
          300: "#c9bba7",
          400: "#b59d82",
          500: "#a68a6c",
          600: "#99795d",
          700: "#7f634e",
          800: "#685144",
          900: "#564439",
          950: "#2e231d",
        },
        "buildcycle-orange": {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
