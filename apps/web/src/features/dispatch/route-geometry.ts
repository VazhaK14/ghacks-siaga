type RouteCoordinate = [longitude: number, latitude: number];

interface DispatchRouteEndpoints {
  agency: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  status?: string;
}

const MAX_MERCATOR_LATITUDE = 85.051_129;

const clampLatitude = (latitude: number): number =>
  Math.min(MAX_MERCATOR_LATITUDE, Math.max(-MAX_MERCATOR_LATITUDE, latitude));

const latitudeToMercatorY = (latitude: number): number => {
  const latitudeRadians = (clampLatitude(latitude) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
};

const mercatorYToLatitude = (mercatorY: number): number =>
  (Math.atan(Math.exp(mercatorY)) * 2 - Math.PI / 2) * (180 / Math.PI);

const interpolate = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;

const getProjectedSegmentLength = (
  start: RouteCoordinate,
  end: RouteCoordinate
): number => {
  const longitudeDelta = ((end[0] - start[0]) * Math.PI) / 180;
  const mercatorLatitudeDelta =
    latitudeToMercatorY(end[1]) - latitudeToMercatorY(start[1]);

  return Math.hypot(longitudeDelta, mercatorLatitudeDelta);
};

const interpolateProjectedSegment = (
  start: RouteCoordinate,
  end: RouteCoordinate,
  progress: number
): RouteCoordinate => {
  const startMercatorY = latitudeToMercatorY(start[1]);
  const endMercatorY = latitudeToMercatorY(end[1]);

  return [
    interpolate(start[0], end[0], progress),
    mercatorYToLatitude(interpolate(startMercatorY, endMercatorY, progress)),
  ];
};

export const buildDispatchRouteCoordinates = (
  dispatch: DispatchRouteEndpoints
): RouteCoordinate[] => {
  const start: RouteCoordinate = [
    dispatch.agency.longitude,
    dispatch.agency.latitude,
  ];
  const end: RouteCoordinate = [
    dispatch.destination.longitude,
    dispatch.destination.latitude,
  ];
  const longitudeDelta = end[0] - start[0];
  const latitudeDelta = end[1] - start[1];
  const midpoint: RouteCoordinate = [
    (start[0] + end[0]) / 2 - latitudeDelta * 0.12,
    (start[1] + end[1]) / 2 + longitudeDelta * 0.12,
  ];

  const outboundRoute: RouteCoordinate[] = [start, midpoint, end];
  const isReturning =
    dispatch.status === "RETURNING_TO_BASE" ||
    dispatch.status === "RETURNED_TO_BASE";

  return isReturning ? outboundRoute.reverse() : outboundRoute;
};

export const getCoordinateAlongRoute = (
  coordinates: RouteCoordinate[],
  progress: number
): RouteCoordinate => {
  const [firstCoordinate] = coordinates;
  if (!firstCoordinate) {
    return [0, 0];
  }

  const lastCoordinate = coordinates.at(-1) ?? firstCoordinate;
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  if (normalizedProgress === 0) {
    return firstCoordinate;
  }
  if (normalizedProgress === 1) {
    return lastCoordinate;
  }

  const segments = coordinates.slice(1).map((end, index) => {
    const start = coordinates[index] ?? firstCoordinate;
    return {
      end,
      length: getProjectedSegmentLength(start, end),
      start,
    };
  });
  const routeLength = segments.reduce(
    (totalLength, segment) => totalLength + segment.length,
    0
  );

  if (routeLength === 0) {
    return firstCoordinate;
  }

  const targetDistance = routeLength * normalizedProgress;
  let traversedDistance = 0;

  for (const segment of segments) {
    const segmentEndDistance = traversedDistance + segment.length;
    if (targetDistance <= segmentEndDistance) {
      const segmentProgress =
        segment.length > 0
          ? (targetDistance - traversedDistance) / segment.length
          : 0;
      return interpolateProjectedSegment(
        segment.start,
        segment.end,
        segmentProgress
      );
    }
    traversedDistance = segmentEndDistance;
  }

  return lastCoordinate;
};
