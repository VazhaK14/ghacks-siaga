import { describe, expect, it } from "bun:test";

import {
  buildDispatchRouteCoordinates,
  getCoordinateAlongRoute,
} from "./route-geometry.ts";

const dispatch = {
  agency: {
    latitude: -6.2,
    longitude: 106.8,
  },
  destination: {
    latitude: -6.18,
    longitude: 106.84,
  },
};

describe("dispatch route geometry", () => {
  it("uses the same endpoints for the route and animation", () => {
    const coordinates = buildDispatchRouteCoordinates(dispatch);

    expect(getCoordinateAlongRoute(coordinates, 0)).toEqual([
      dispatch.agency.longitude,
      dispatch.agency.latitude,
    ]);
    expect(getCoordinateAlongRoute(coordinates, 1)).toEqual([
      dispatch.destination.longitude,
      dispatch.destination.latitude,
    ]);
  });

  it("follows the offset route instead of cutting directly to the destination", () => {
    const coordinates = buildDispatchRouteCoordinates(dispatch);
    const halfwayCoordinate = getCoordinateAlongRoute(coordinates, 0.5);
    const directHalfwayLatitude =
      (dispatch.agency.latitude + dispatch.destination.latitude) / 2;
    const directHalfwayLongitude =
      (dispatch.agency.longitude + dispatch.destination.longitude) / 2;

    expect(halfwayCoordinate[0]).not.toBeCloseTo(directHalfwayLongitude, 5);
    expect(halfwayCoordinate[1]).not.toBeCloseTo(directHalfwayLatitude, 5);
  });

  it("clamps animation progress to the route bounds", () => {
    const coordinates = buildDispatchRouteCoordinates(dispatch);

    expect(getCoordinateAlongRoute(coordinates, -1)).toEqual(coordinates[0]);
    expect(getCoordinateAlongRoute(coordinates, 2)).toEqual(coordinates.at(-1));
  });
});
