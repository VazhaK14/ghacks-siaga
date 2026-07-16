import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { z } from "zod";

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

export const routeCoordinateSchema = z.tuple([z.number(), z.number()]);

export const dispatchRouteResponseSchema = z.object({
  code: z.literal("Ok"),
  routes: z
    .array(
      z.object({
        geometry: z.object({
          coordinates: z.array(routeCoordinateSchema).min(2),
          type: z.literal("LineString"),
        }),
      })
    )
    .min(1),
});

export type RouteCoordinate = z.infer<typeof routeCoordinateSchema>;
