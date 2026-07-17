import { auth } from "@siaga-app/auth";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
  context: HonoContext;
}

export async function createContext({ context }: CreateContextOptions) {
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
