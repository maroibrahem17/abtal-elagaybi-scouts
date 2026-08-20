import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  base: "/abtal-elagaybi-scouts/",
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
