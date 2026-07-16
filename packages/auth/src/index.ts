import { expo } from "@better-auth/expo";
import { createPrismaClient } from "@siaga-app/db";
import { env } from "@siaga-app/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
  const prisma = createPrismaClient();

  return betterAuth({
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [expo()],
    secret: env.BETTER_AUTH_SECRET,

    trustedOrigins: [...env.CORS_ORIGIN, "siaga-app://", "exp://"],
  });
}

export const auth = createAuth();
