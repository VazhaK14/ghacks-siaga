import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { hasCompletedReporterProfile } from "./modules/profile/domain/profile-completion";

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

export const reporterProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "REPORTER") {
    throw new TRPCError({
      cause: "Not a reporter",
      code: "FORBIDDEN",
      message: "Reporter access required",
    });
  }
  return next({ ctx });
});

export const completedReporterProcedure = reporterProcedure.use(
  async ({ ctx, next }) => {
    const isProfileComplete = await hasCompletedReporterProfile(
      ctx.session.user.id
    );
    if (!isProfileComplete) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Lengkapi profil darurat sebelum menggunakan layanan SOS.",
      });
    }
    return next({ ctx });
  }
);
