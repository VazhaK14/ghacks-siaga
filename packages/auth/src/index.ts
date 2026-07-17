import { createPrismaClient } from "@siaga-app/db";
import { env } from "@siaga-app/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";

// Role keys must match the Prisma `UserRole` enum values exactly
// (case-sensitive): admin()'s setRole/createUser endpoints look up
// `opts.roles[role]` against the raw role string, and the value written to
// the `role` column is passed through verbatim to Prisma, whose enum
// requires an exact match to "REPORTER" / "OPERATOR".
const statement = {
  user: ["create", "list", "set-role", "ban", "get", "update"],
} as const;

const ac = createAccessControl(statement);

const reporterRole = ac.newRole({ user: [] });
const operatorRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "get", "update"],
});

interface CreateAuthOptions {
  basePath: string;
  cookiePrefix: string;
  disableSignUp: boolean;
  secret: string;
}

export function createAuth({
  basePath,
  cookiePrefix,
  disableSignUp,
  secret,
}: CreateAuthOptions) {
  const prisma = createPrismaClient();

  return betterAuth({
    advanced: {
      cookiePrefix,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        secure: env.NODE_ENV === "production",
      },
    },
    basePath,
    baseURL: new URL(env.BETTER_AUTH_URL).origin,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      disableSignUp,
      enabled: true,
    },
    plugins: [
      admin({
        ac,
        adminRoles: ["OPERATOR"],
        defaultRole: "REPORTER",
        roles: { OPERATOR: operatorRole, REPORTER: reporterRole },
      }),
    ],
    secret,

    trustedOrigins: [...env.CORS_ORIGIN],
  });
}

export const operatorAuth = createAuth({
  basePath: "/api/auth/operator",
  cookiePrefix: "siaga-operator",
  disableSignUp: true,
  secret: env.BETTER_AUTH_OPERATOR_SECRET ?? env.BETTER_AUTH_SECRET,
});

export const citizenAuth = createAuth({
  basePath: "/api/auth/citizen",
  cookiePrefix: "siaga-citizen",
  disableSignUp: false,
  secret: env.BETTER_AUTH_CITIZEN_SECRET ?? env.BETTER_AUTH_SECRET,
});
