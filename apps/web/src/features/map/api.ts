import {
  skipToken,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { useOperationalLiveEvents } from "@/features/live-updates/api";
import type { OperationalLiveEvent } from "@/features/live-updates/types";
import { trpc } from "@/utils/trpc";

import { REPORT_PAGE_SIZE } from "./content";
import type { LiveConnectionStatus } from "./types";

export function useActiveReportsQuery() {
  return useInfiniteQuery(
    trpc.report.listActive.infiniteQueryOptions(
      { limit: REPORT_PAGE_SIZE },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );
}

export function useReportDetailQuery(reportId: string | null) {
  return useQuery(
    trpc.report.getDetail.queryOptions(reportId ? { reportId } : skipToken, {
      meta: { suppressGlobalErrorToast: true },
      retry: false,
    })
  );
}

export function useReportMapPointsQuery() {
  return useQuery(trpc.report.listActiveMapPoints.queryOptions());
}

export function useReportLiveUpdates(
  onReportRemoved: (reportId: string) => void
): LiveConnectionStatus {
  const queryClient = useQueryClient();
  const handleEvent = useCallback(
    async (event: OperationalLiveEvent): Promise<void> => {
      if (event.type === "report.removed" && event.reportId) {
        onReportRemoved(event.reportId);
      }
      const isTerminalEvent =
        event.type === "report.removed" || event.type === "dispatch.completed";
      const includeActiveDetail = !isTerminalEvent;
      const reportInvalidations = includeActiveDetail
        ? [
            queryClient.invalidateQueries({
              queryKey: trpc.report.pathKey(),
            }),
          ]
        : [
            queryClient.invalidateQueries({
              queryKey: trpc.report.listActive.pathKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.report.listActiveMapPoints.pathKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.report.listArchived.pathKey(),
            }),
          ];
      await Promise.all([
        ...reportInvalidations,
        queryClient.invalidateQueries({
          queryKey: trpc.dispatch.pathKey(),
        }),
      ]);
    },
    [onReportRemoved, queryClient]
  );

  return useOperationalLiveEvents(handleEvent);
}
