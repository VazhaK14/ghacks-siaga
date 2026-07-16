import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  basename: process.env.VERCEL ? "/citizen" : "/",
  // SPA mode: the citizen app is heavily client-interactive (mic, geolocation,
  // service worker) and auth-gated client-side, so server rendering buys little
  // and complicates browser-only APIs. Ships a static client build.
  ssr: false,
} satisfies Config;
