import { useEffect, useState } from "react";

import {
  buildDispatchRouteCoordinates,
  getCoordinateAlongRoute,
} from "./route-geometry";
import type { DispatchTracking, RouteCoordinate } from "./types";

const ANIMATION_UPDATE_INTERVAL_MS = 100;
const ANIMATED_STATUSES = new Set(["EN_ROUTE", "RETURNING_TO_BASE"]);

export function useAnimatedDispatchTracking(
  dispatch: DispatchTracking | null,
  roadRoute?: RouteCoordinate[]
): DispatchTracking | null {
  const [animationTime, setAnimationTime] = useState(() => Date.now());
  const isAnimating = Boolean(
    dispatch && ANIMATED_STATUSES.has(dispatch.status)
  );

  useEffect(() => {
    if (!isAnimating) {
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
  }, [isAnimating]);

  if (!(dispatch && isAnimating)) {
    return dispatch;
  }

  const isReturning = dispatch.status === "RETURNING_TO_BASE";
  const startedAtValue = isReturning
    ? dispatch.returnStartedAt
    : dispatch.enRouteAt;
  const arrivalAtValue = isReturning
    ? dispatch.estimatedReturnAt
    : dispatch.estimatedArrivalAt;
  if (!(startedAtValue && arrivalAtValue)) {
    return dispatch;
  }

  const startedAt = new Date(startedAtValue).getTime();
  const arrivalAt = new Date(arrivalAtValue).getTime();
  const duration = arrivalAt - startedAt;
  const progress =
    duration > 0
      ? Math.min(1, Math.max(0, (animationTime - startedAt) / duration))
      : 1;
  const [currentLongitude, currentLatitude] = getCoordinateAlongRoute(
    buildDispatchRouteCoordinates(dispatch, roadRoute),
    progress
  );

  return {
    ...dispatch,
    currentLatitude,
    currentLongitude,
    progressPercent: Math.round(progress * 100),
  };
}
