import {
  Accuracy,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  hasServicesEnabledAsync,
  type LocationGeocodedAddress,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import type { IncidentLocation } from "@/features/emergency/types";

const MAXIMUM_CACHED_LOCATION_AGE_MS = 60_000;
const MAXIMUM_CACHED_LOCATION_ACCURACY_METERS = 500;
const COORDINATE_DECIMAL_PLACES = 5;

export type LocationStatus =
  | "denied"
  | "disabled"
  | "error"
  | "locating"
  | "ready";

interface CurrentLocationState {
  location: IncidentLocation | null;
  refreshLocation: () => Promise<void>;
  status: LocationStatus;
}

interface UseCurrentLocationOptions {
  onLocationResolved: (location: IncidentLocation) => void;
}

const removeDuplicateParts = (parts: (string | null)[]): string[] => {
  const uniqueParts: string[] = [];

  for (const part of parts) {
    const normalizedPart = part?.trim();
    if (normalizedPart && !uniqueParts.includes(normalizedPart)) {
      uniqueParts.push(normalizedPart);
    }
  }

  return uniqueParts;
};

const formatAddress = (address: LocationGeocodedAddress): string | null => {
  if (address.formattedAddress) {
    return address.formattedAddress;
  }

  const street = removeDuplicateParts([
    address.name,
    address.streetNumber,
    address.street,
  ]).join(" ");
  const parts = removeDuplicateParts([
    street || null,
    address.district,
    address.city,
    address.subregion,
    address.region,
    address.postalCode,
    address.country,
  ]);

  return parts.length > 0 ? parts.join(", ") : null;
};

const formatCoordinates = (latitude: number, longitude: number): string =>
  `${latitude.toFixed(COORDINATE_DECIMAL_PLACES)}, ${longitude.toFixed(
    COORDINATE_DECIMAL_PLACES
  )}`;

const resolveAddress = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  if (Platform.OS !== "web") {
    const addresses = await reverseGeocodeAsync({ latitude, longitude });
    const formattedAddress = addresses[0] ? formatAddress(addresses[0]) : null;
    if (formattedAddress) {
      return formattedAddress;
    }
  }

  return `Koordinat ${formatCoordinates(latitude, longitude)}`;
};

export const useCurrentLocation = ({
  onLocationResolved,
}: UseCurrentLocationOptions): CurrentLocationState => {
  const [location, setLocation] = useState<IncidentLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("locating");

  const refreshLocation = useCallback(async () => {
    setStatus("locating");

    try {
      const servicesEnabled = await hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus("disabled");
        return;
      }

      const permission = await requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return;
      }

      const cachedPosition = await getLastKnownPositionAsync({
        maxAge: MAXIMUM_CACHED_LOCATION_AGE_MS,
        requiredAccuracy: MAXIMUM_CACHED_LOCATION_ACCURACY_METERS,
      });
      const position =
        cachedPosition ??
        (await getCurrentPositionAsync({ accuracy: Accuracy.Balanced }));
      const { accuracy, latitude, longitude } = position.coords;
      const address = await resolveAddress(latitude, longitude);
      const resolvedLocation: IncidentLocation = {
        accuracy,
        address,
        latitude,
        longitude,
      };

      setLocation(resolvedLocation);
      setStatus("ready");
      onLocationResolved(resolvedLocation);
    } catch {
      setStatus("error");
    }
  }, [onLocationResolved]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return { location, refreshLocation, status };
};
