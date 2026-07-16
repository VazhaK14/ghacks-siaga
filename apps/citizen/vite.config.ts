import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.VERCEL ? "/citizen/" : "/",
  build: { outDir: "build/client" },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      filename: "service-worker.ts",
      injectManifest: {
        globDirectory: "build/client",
        globPatterns: ["**/*.{css,html,ico,js,svg,woff2}"],
      },
      manifest: {
        background_color: "#0d0708",
        description:
          "Aplikasi pelaporan darurat warga yang terhubung ke SIAGA.",
        display: "standalone",
        icons: [
          {
            purpose: "any",
            sizes: "any",
            src: "icons/siaga.svg",
            type: "image/svg+xml",
          },
          {
            purpose: "maskable",
            sizes: "any",
            src: "icons/siaga-maskable.svg",
            type: "image/svg+xml",
          },
        ],
        lang: "id-ID",
        name: "SIAGA",
        orientation: "portrait",
        scope: process.env.VERCEL ? "/citizen/" : "/",
        short_name: "SIAGA",
        start_url: process.env.VERCEL ? "/citizen/" : "/",
        theme_color: "#870000",
      },
      registerType: "autoUpdate",
      srcDir: "src",
      strategies: "injectManifest",
    }),
  ],
  preview: { port: 5176 },
  // Dev port 5176 is already in apps/server's CORS_ORIGIN allow-list, so the
  // citizen app talks to the local API + auth without a server .env change.
  server: { port: 5176 },
  ssr: {
    // Vercel functions include node_modules for regular npm deps, but not for
    // workspace packages (symlinked, not published) — bundle only those.
    noExternal: [/^@siaga-app\//],
  },
});
