import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import {
  type DispatchTracking,
  dispatchRouteResponseSchema,
  type RouteCoordinate,
} from "./types";

const ROUTING_SERVICE_URL = "https://router.project-osrm.org";
const ROAD_ROUTE_STALE_TIME_MS = 24 * 60 * 60 * 1000;

const fetchDispatchRoadRoute = async (
  dispatch: DispatchTracking,
  signal: AbortSignal
): Promise<RouteCoordinate[]> => {
  const coordinates = [
    `${dispatch.agency.longitude},${dispatch.agency.latitude}`,
    `${dispatch.destination.longitude},${dispatch.destination.latitude}`,
  ].join(";");
  const url = new URL(`/route/v1/driving/${coordinates}`, ROUTING_SERVICE_URL);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error("Rute jalan unit respons tidak dapat dimuat");
  }

  const result = dispatchRouteResponseSchema.parse(await response.json());
  const [route] = result.routes;
  if (!route) {
    throw new Error("Rute jalan unit respons tidak ditemukan");
  }

  return route.geometry.coordinates;
};

export function useReportDispatchQuery(reportId: string | null) {
  return useQuery(
    trpc.dispatch.getReportDispatch.queryOptions(
      reportId ? { reportId } : skipToken
    )
  );
}

export function useAgencyBoardQuery(enabled = true) {
  return useQuery({
    ...trpc.dispatch.listAgencyBoard.queryOptions(),
    enabled,
  });
}

export function useDispatchRoadRouteQuery(dispatch: DispatchTracking | null) {
  return useQuery({
    enabled: Boolean(dispatch) && typeof window !== "undefined",
    meta: { suppressGlobalErrorToast: true },
    queryFn: ({ signal }) => {
      if (!dispatch) {
        throw new Error("Dispatch diperlukan untuk memuat rute jalan");
      }
      return fetchDispatchRoadRoute(dispatch, signal);
    },
    queryKey: [
      "dispatch-road-route",
      dispatch?.id ?? null,
      dispatch?.agency.latitude ?? null,
      dispatch?.agency.longitude ?? null,
      dispatch?.destination.latitude ?? null,
      dispatch?.destination.longitude ?? null,
    ],
    retry: 1,
    staleTime: ROAD_ROUTE_STALE_TIME_MS,
  });
}

export function useCreateDispatchMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.create.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.pathKey(),
          }),
        ]);
      },
    })
  );
}

export function useCloseReportMutation(
  onReportClosed: (reportId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.closeReport.mutationOptions({
      onSuccess: async (result) => {
        onReportClosed(result.reportId);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActive.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActiveMapPoints.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listArchived.pathKey(),
          }),
        ]);
      },
    })
  );
}

export function useResolveDispatchMutation(
  onReportResolved: (reportId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.resolve.mutationOptions({
      onSuccess: async (dispatch) => {
        onReportResolved(dispatch.reportId);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActive.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActiveMapPoints.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listArchived.pathKey(),
          }),
        ]);
      },
    })
  );
}
