import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ArchivedReportListInput = RouterInputs["report"]["listArchived"];
export type ArchivedReportPage = RouterOutputs["report"]["listArchived"];
export type ArchivedReportListItem = ArchivedReportPage["items"][number];
export type ArchivedReportDetail = RouterOutputs["report"]["getArchivedDetail"];
export type ArchivedReportStatus = ArchivedReportListItem["status"];
export type ArchivedReportCategory = ArchivedReportListItem["category"];
