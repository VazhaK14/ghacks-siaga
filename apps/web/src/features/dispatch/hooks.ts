import { useEffect, useState } from "react";

import {
  buildDispatchRouteCoordinates,
  getCoordinateAlongRoute,
} from "./route-geometry";
import type { DispatchTracking } from "./types";

const ANIMATION_UPDATE_INTERVAL_MS = 100;

export function useAnimatedDispatchTracking(
  dispatch: DispatchTracking | null
): DispatchTracking | null {
  const [animationTime, setAnimationTime] = useState(() => Date.now());

  useEffect(() => {
    if (dispatch?.status !== "EN_ROUTE") {
      return;
    }

    let animationFrame = 0;
    let lastUpdate = 0;
    const updateAnimation = (timestamp: number) => {
      if (timestamp - lastUpdate >= ANIMATION_UPDATE_INTERVAL_MS) {
        setAnimationTime(Date.now());
        lastUpdate = timestamp;
      }
      animationFrame = requestAnimationFrame(updateAnimation);
    };
    animationFrame = requestAnimationFrame(updateAnimation);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [dispatch?.status]);

  if (
    dispatch?.status !== "EN_ROUTE" ||
    !dispatch.enRouteAt ||
    !dispatch.estimatedArrivalAt
  ) {
    return dispatch;
  }

  const startedAt = new Date(dispatch.enRouteAt).getTime();
  const arrivalAt = new Date(dispatch.estimatedArrivalAt).getTime();
  const duration = arrivalAt - startedAt;
  const progress =
    duration > 0
      ? Math.min(1, Math.max(0, (animationTime - startedAt) / duration))
      : 1;
  const [currentLongitude, currentLatitude] = getCoordinateAlongRoute(
    buildDispatchRouteCoordinates(dispatch),
    progress
  );

  return {
    ...dispatch,
    currentLatitude,
    currentLongitude,
    progressPercent: Math.round(progress * 100),
  };
}
