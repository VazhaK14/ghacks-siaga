import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";

// Must run before `../src/index` is evaluated: that module validates
// process.env at import time, and ESM hoists imports above top-level code,
// so a dynamic import is required to sequence this after dotenv.config().
dotenv.config({ path: "../../apps/server/.env" });

const { createPrismaClient } = await import("../src/index");

// Bootstrap-only credentials — CHANGE IN PRODUCTION. Rotate/replace via the
// future admin-managed operator account screen once it exists.
const OPERATOR_EMAIL = "operator@siaga.app";
const OPERATOR_PASSWORD = "Siaga-Operator-2026!";
const OPERATOR_NAME = "Default Operator";

async function main() {
  const prisma = createPrismaClient();

  const existing = await prisma.user.findUnique({
    where: { email: OPERATOR_EMAIL },
  });
  if (existing) {
    console.log(`[seed] Operator ${OPERATOR_EMAIL} already exists, skipping.`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await hashPassword(OPERATOR_PASSWORD);
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      accounts: {
        create: {
          accountId: userId,
          id: randomUUID(),
          password: hashedPassword,
          providerId: "credential",
        },
      },
      email: OPERATOR_EMAIL,
      emailVerified: true,
      id: userId,
      name: OPERATOR_NAME,
      role: "OPERATOR",
    },
  });

  console.log(`[seed] Created operator account: ${OPERATOR_EMAIL}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
