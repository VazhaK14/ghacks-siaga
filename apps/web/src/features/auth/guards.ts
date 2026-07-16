import { env } from "@siaga-app/env/web";
import { redirect } from "react-router";

import { getServerUrl } from "@/lib/get-server-url";

import type { SessionCheckResult } from "./types";

async function fetchSession(
  request: Request
): Promise<SessionCheckResult | null> {
  const base = getServerUrl(env.VITE_SERVER_URL);
  const res = await fetch(new URL("/api/auth/get-session", base), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function requireOperatorSession(request: Request) {
  const result = await fetchSession(request);
  if (!result?.user) {
    throw redirect("/login");
  }
  const { user } = result;
  if (user.role !== "OPERATOR") {
    throw redirect("/login?error=not-operator");
  }
  return { session: result.session, user };
}

export async function redirectIfAuthenticated(request: Request) {
  const result = await fetchSession(request);
  if (result?.user?.role === "OPERATOR") {
    throw redirect("/");
  }
}
