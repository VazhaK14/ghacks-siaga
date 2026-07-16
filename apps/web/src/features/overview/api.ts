import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useOperationalLiveEvents } from "@/features/live-updates/api";
import { trpc } from "@/utils/trpc";
import type { DashboardPeriod } from "./types";

export function useDashboardOverviewQuery(period: DashboardPeriod) {
  return useQuery(trpc.overview.getDashboard.queryOptions({ period }));
}

export function useDashboardLiveUpdates() {
  const queryClient = useQueryClient();
  const handleEvent = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: trpc.overview.pathKey(),
    });
  }, [queryClient]);

  return useOperationalLiveEvents(handleEvent);
}
