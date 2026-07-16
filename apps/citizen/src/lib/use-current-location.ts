import { useCallback, useEffect, useRef, useState } from "react";

import type { IncidentLocation } from "@/features/emergency/types";

const COORDINATE_DECIMAL_PLACES = 5;
const GEOLOCATION_TIMEOUT_MS = 15_000;

export type LocationStatus =
  | "denied"
  | "disabled"
  | "error"
  | "locating"
  | "ready";

interface CurrentLocationState {
  location: IncidentLocation | null;
  refreshLocation: () => void;
  status: LocationStatus;
}

interface UseCurrentLocationOptions {
  onLocationResolved: (location: IncidentLocation) => void;
  watch?: boolean;
}

const toIncidentLocation = (
  position: GeolocationPosition
): IncidentLocation => {
  const { accuracy, latitude, longitude } = position.coords;
  return {
    accuracy,
    address: `Koordinat ${latitude.toFixed(
      COORDINATE_DECIMAL_PLACES
    )}, ${longitude.toFixed(COORDINATE_DECIMAL_PLACES)}`,
    latitude,
    longitude,
  };
};

const getErrorStatus = (error: GeolocationPositionError): LocationStatus => {
  if (error.code === error.PERMISSION_DENIED) {
    return "denied";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "disabled";
  }
  return "error";
};

export const useCurrentLocation = ({
  onLocationResolved,
  watch = false,
}: UseCurrentLocationOptions): CurrentLocationState => {
  const [location, setLocation] = useState<IncidentLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("locating");
  const callbackRef = useRef(onLocationResolved);
  callbackRef.current = onLocationResolved;

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const resolvedLocation = toIncidentLocation(position);
    setLocation(resolvedLocation);
    setStatus("ready");
    callbackRef.current(resolvedLocation);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setStatus(getErrorStatus(error));
  }, []);

  const refreshLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("disabled");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: GEOLOCATION_TIMEOUT_MS,
    });
  }, [handleError, handlePosition]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    if (!(watch && "geolocation" in navigator)) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: GEOLOCATION_TIMEOUT_MS,
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleError, handlePosition, watch]);

  return { location, refreshLocation, status };
};
