import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    // Vercel functions include node_modules for regular npm deps, but not for
    // workspace packages (symlinked, not published) — bundle only those.
    // (`noExternal: true` bundles isbot's CJS build too, which breaks Vite's
    // SSR module runner in dev with "module is not defined".)
    noExternal: [/^@siaga-app\//],
  },
});
