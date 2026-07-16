import { useCallback, useEffect, useRef } from "react";

import { useCurrentLocation } from "@/features/location/use-current-location";

import { useUpdateReporterLocationMutation } from "./api";
import type { IncidentLocation } from "./types";

const LOCATION_UPDATE_INTERVAL_MS = 45_000;

export function useLiveLocationReporting(reportId: string | null) {
  const updateLocation = useUpdateReporterLocationMutation();
  const reportIdRef = useRef(reportId);
  reportIdRef.current = reportId;

  const handleLocationResolved = useCallback(
    (location: IncidentLocation) => {
      const activeReportId = reportIdRef.current;
      if (!activeReportId) {
        return;
      }
      updateLocation.mutate({
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        reportId: activeReportId,
      });
    },
    [updateLocation]
  );

  const { refreshLocation } = useCurrentLocation({
    onLocationResolved: handleLocationResolved,
  });

  useEffect(() => {
    if (!reportId) {
      return;
    }

    const interval = setInterval(() => {
      refreshLocation();
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [reportId, refreshLocation]);
}
