import type { operatorAuth } from "@siaga-app/auth";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
  auth: typeof operatorAuth;
  context: HonoContext;
}

export async function createContext({ auth, context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    auth: null,
    requestIp:
      context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      context.req.header("cf-connecting-ip") ??
      context.req.header("x-real-ip") ??
      "unknown",
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
