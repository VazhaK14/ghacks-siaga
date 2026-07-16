import { expo } from "@better-auth/expo";
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
    plugins: [
      expo(),
      admin({
        ac,
        adminRoles: ["OPERATOR"],
        defaultRole: "REPORTER",
        roles: { OPERATOR: operatorRole, REPORTER: reporterRole },
      }),
    ],
    secret: env.BETTER_AUTH_SECRET,

    trustedOrigins: [...env.CORS_ORIGIN, "siaga-app://", "exp://"],
  });
}

export const auth = createAuth();
