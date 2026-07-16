import { env } from "@siaga-app/env/web";
import {
  skipToken,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getServerUrl } from "@/lib/get-server-url";
import { trpc } from "@/utils/trpc";

import { REPORT_PAGE_SIZE } from "./content";
import type { LiveConnectionStatus } from "./types";

const REPORT_EVENT_NAMES = [
  "report.created",
  "report.updated",
  "report.removed",
] as const;

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
  const [connectionStatus, setConnectionStatus] =
    useState<LiveConnectionStatus>("connecting");

  useEffect(() => {
    const serverUrl = getServerUrl(env.VITE_SERVER_URL);
    const eventSource = new EventSource(`${serverUrl}/sse/reports/live`, {
      withCredentials: true,
    });

    const invalidateReports = async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: trpc.report.pathKey(),
      });
    };

    const handleConnected = () => {
      setConnectionStatus("connected");
    };

    const handleReportEvent = (event: Event) => {
      setConnectionStatus("connected");
      const messageEvent = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(messageEvent.data) as {
          reportId?: unknown;
          type?: unknown;
        };
        if (
          payload.type === "report.removed" &&
          typeof payload.reportId === "string"
        ) {
          onReportRemoved(payload.reportId);
        }
      } catch {
        setConnectionStatus("unavailable");
      }
      invalidateReports().catch(() => {
        setConnectionStatus("unavailable");
      });
    };

    const handleError = () => {
      setConnectionStatus("reconnecting");
    };

    eventSource.addEventListener("connected", handleConnected);
    for (const eventName of REPORT_EVENT_NAMES) {
      eventSource.addEventListener(eventName, handleReportEvent);
    }
    eventSource.onerror = handleError;

    return () => {
      eventSource.removeEventListener("connected", handleConnected);
      for (const eventName of REPORT_EVENT_NAMES) {
        eventSource.removeEventListener(eventName, handleReportEvent);
      }
      eventSource.close();
    };
  }, [onReportRemoved, queryClient]);

  return connectionStatus;
}
