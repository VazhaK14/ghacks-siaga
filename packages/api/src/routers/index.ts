import { protectedProcedure, publicProcedure, router } from "../index";
import { reportRouter } from "../modules/report/presentation/router";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
  report: reportRouter,
});
export type AppRouter = typeof appRouter;
