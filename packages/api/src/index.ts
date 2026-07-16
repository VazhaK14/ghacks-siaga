import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

const { procedure, router } = t;

export { router };

export const publicProcedure = procedure;

export const protectedProcedure = procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      cause: "No session",
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "OPERATOR") {
    throw new TRPCError({
      cause: "Not an operator",
      code: "FORBIDDEN",
      message: "Operator access required",
    });
  }
  return next({ ctx });
});
