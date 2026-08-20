import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === "production" ? "/abtal-elagaybi-scouts/" : "/"),
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
