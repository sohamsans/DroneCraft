/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#0f172a",
        surfaceBorder: "#1e293b",
        surfaceHover: "#1e293b",
        cyanGlow: "#06b6d4",
        emeraldGlow: "#10b981",
        amberGlow: "#f59e0b",
        crimsonGlow: "#f43f5e",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
      boxShadow: {
        glowCyan: "0 0 20px -5px rgba(6, 182, 212, 0.4)",
        glowEmerald: "0 0 20px -5px rgba(16, 185, 129, 0.4)",
        glowCrimson: "0 0 20px -5px rgba(244, 63, 94, 0.4)",
      }
    },
  },
  plugins: [],
};
