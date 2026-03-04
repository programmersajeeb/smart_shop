import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // ✅ system theme follow করবে না
  darkMode: "class",
  plugins: [daisyui],
  // ✅ DaisyUI থিম একটাই রাখলে আর auto বদলাবে না
  daisyui: {
    themes: ["light"],
  },
};