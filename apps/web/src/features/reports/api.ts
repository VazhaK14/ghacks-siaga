import { env } from "@siaga-app/env/web";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getServerUrl } from "@/lib/get-server-url";
import { trpc } from "@/utils/trpc";

import type { ArchivedReportListInput } from "./types";

const ARCHIVE_EVENT_NAMES = ["report.removed", "dispatch.completed"] as const;

export function useArchivedReportsQuery(input: ArchivedReportListInput) {
  return useQuery(trpc.report.listArchived.queryOptions(input));
}

export function useArchivedReportDetailQuery(reportId: string | null) {
  return useQuery(
    trpc.report.getArchivedDetail.queryOptions(
      reportId ? { reportId } : skipToken,
      { retry: false }
    )
  );
}

export function useArchivedReportLiveUpdates(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const serverUrl = getServerUrl(env.VITE_SERVER_URL);
    const eventSource = new EventSource(`${serverUrl}/sse/reports/live`, {
      withCredentials: true,
    });
    const invalidateArchive = () => {
      queryClient
        .invalidateQueries({ queryKey: trpc.report.listArchived.pathKey() })
        .catch(() => undefined);
    };

    for (const eventName of ARCHIVE_EVENT_NAMES) {
      eventSource.addEventListener(eventName, invalidateArchive);
    }

    return () => {
      for (const eventName of ARCHIVE_EVENT_NAMES) {
        eventSource.removeEventListener(eventName, invalidateArchive);
      }
      eventSource.close();
    };
  }, [queryClient]);
}
