import { env } from "@siaga-app/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./get-server-url";

// Mirrors the access-control roles defined in packages/auth/src/index.ts —
// keep the two in sync. Gives `authClient.admin.*` correct
// "REPORTER" | "OPERATOR" typing instead of the plugin's default.
const statement = {
  user: ["create", "list", "set-role", "ban", "get", "update"],
} as const;

const ac = createAccessControl(statement);

const reporterRole = ac.newRole({ user: [] });
const operatorRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "get", "update"],
});

export const authClient = createAuthClient({
  baseURL: `${getServerUrl(env.VITE_SERVER_URL)}/api/auth/citizen`,
  plugins: [
    adminClient({
      ac,
      roles: { OPERATOR: operatorRole, REPORTER: reporterRole },
    }),
  ],
});
