import { protectedProcedure, publicProcedure, router } from "../index";
import { dispatchRouter } from "../modules/dispatch/presentation/router";
import { offlineCallRouter } from "../modules/offline-call/router";
import { overviewRouter } from "../modules/overview/presentation/router";
import { profileRouter } from "../modules/profile/presentation/router";
import { pushRouter } from "../modules/push/presentation/router";
import { reportRouter } from "../modules/report/presentation/router";

export const appRouter = router({
  dispatch: dispatchRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  offlineCall: offlineCallRouter,
  overview: overviewRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
  profile: profileRouter,
  push: pushRouter,
  report: reportRouter,
});
export type AppRouter = typeof appRouter;
