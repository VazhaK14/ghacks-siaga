import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type DashboardOverview = RouterOutputs["overview"]["getDashboard"];
export type DashboardPeriod = NonNullable<
  RouterInputs["overview"]["getDashboard"]["period"]
>;
