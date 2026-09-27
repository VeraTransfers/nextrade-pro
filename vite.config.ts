import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
