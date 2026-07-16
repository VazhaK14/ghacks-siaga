import { useCallback } from "react";

import { useCurrentLocation } from "@/lib/use-current-location";

import { useUpdateReporterLocationMutation } from "./api";
import type { IncidentLocation } from "./types";

export const useLiveLocationReporting = (reportId: string | null) => {
  const updateLocation = useUpdateReporterLocationMutation();
  const handleLocationResolved = useCallback(
    (location: IncidentLocation) => {
      if (!reportId) {
        return;
      }
      updateLocation.mutate({
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        reportId,
      });
    },
    [reportId, updateLocation]
  );

  return useCurrentLocation({
    onLocationResolved: handleLocationResolved,
    watch: Boolean(reportId),
  });
};
