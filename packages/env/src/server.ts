import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function getVercelOrigin() {
  const vercelUrl =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (!vercelUrl) {
    return;
  }
  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

const vercelOrigin = getVercelOrigin();

const runtimeEnv = {
  ...process.env,
  // Public auth base: /api/auth bypasses the rewrite's path strip, so the
  // same URL works for incoming matching and generated callbacks
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ??
    (vercelOrigin ? `${vercelOrigin}/api/auth` : undefined),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? vercelOrigin,
};

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv,
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CORS_ORIGIN: z
      .string()
      .transform((v) => v.split(",").map((s) => s.trim()))
      .pipe(z.array(z.url()).min(1)),
    DATABASE_URL: z.string().min(1),
    LIVEKIT_API_KEY: z.string().min(1).optional(),
    LIVEKIT_API_SECRET: z.string().min(1).optional(),
    LIVEKIT_URL: z.url().optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    OPENROUTER_FALLBACK_MODEL: z
      .string()
      .min(1)
      .default("google/gemma-4-26b-a4b-it:free"),
    OPENROUTER_MODEL: z
      .string()
      .min(1)
      .default("qwen/qwen3-next-80b-a3b-instruct:free"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    VAPID_PUBLIC_KEY: z.string().min(1).optional(),
    VAPID_SUBJECT: z.string().min(1).default("mailto:admin@siaga.local"),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
