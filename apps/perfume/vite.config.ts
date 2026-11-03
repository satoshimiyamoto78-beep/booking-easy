import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  // Stand-alone app: don't inherit the monorepo root's PostCSS config (Tailwind runs via its Vite plugin).
  css: { postcss: { plugins: [] } },
});
