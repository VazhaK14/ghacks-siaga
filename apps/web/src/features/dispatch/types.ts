import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ReportDispatchOverview =
  RouterOutputs["dispatch"]["getReportDispatch"];
export type DispatchTracking = NonNullable<
  ReportDispatchOverview["activeDispatch"]
>;
export type DispatchAgencyRecommendation =
  ReportDispatchOverview["recommendations"][number];
export type AgencyBoardItem =
  RouterOutputs["dispatch"]["listAgencyBoard"][number];
export type DispatchAgency = DispatchTracking["agency"];
export type DispatchAgencyType = DispatchAgency["type"];
export type DispatchAgencyAvailability = DispatchAgency["availability"];
export type DispatchStatus = DispatchTracking["status"];
