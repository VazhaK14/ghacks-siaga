import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const GENERATE_ONLY_DATABASE_URL =
  "postgresql://unused:unused@localhost:5432/unused";

dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? GENERATE_ONLY_DATABASE_URL,
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "bun run prisma/seed.ts",
  },
  schema: path.join("prisma", "schema"),
});
