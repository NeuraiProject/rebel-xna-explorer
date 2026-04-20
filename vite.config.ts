import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  root: "gui",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "gui/index.html"),
        debug: resolve(__dirname, "gui/debug.html"),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8888",
      "/gui-settings": "http://localhost:8888",
      "/gettype": "http://localhost:8888",
      "/thumbnail": "http://localhost:8888",
      "/gettxoutsetinfo": "http://localhost:8888",
      "/debug": "http://localhost:8888",
      "/memory": "http://localhost:8888",
    },
  },
});
