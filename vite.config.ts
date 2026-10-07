import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const server = "http://localhost:" + (process.env.EXPLORER_PORT || "8888");

export default defineConfig({
  root: "gui",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    //Not "assets": /assets is the page that lists the Neurai assets
    assetsDir: "static",
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
      "/api": server,
      "/gui-settings": server,
      "/gettype": server,
      "/thumbnail": server,
      "/debug": server,
      "/memory": server,
    },
  },
  test: {
    root: ".",
    include: ["*.test.js", "shared/**/*.test.js", "gui/**/*.test.ts"],
  },
});
