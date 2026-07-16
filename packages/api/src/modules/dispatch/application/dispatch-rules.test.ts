import { describe, expect, test } from "bun:test";

import type { DispatchAgency, DispatchRecord } from "../domain/entities";
import {
  buildAgencyRecommendations,
  calculateDistanceKm,
  toDispatchTracking,
} from "./dispatch-rules";

const agencies: DispatchAgency[] = [
  {
    address: "Polisi",
    availability: "AVAILABLE",
    contactPhone: "110",
    id: "police-near",
    jurisdiction: "Jakarta",
    latitude: -6.2,
    longitude: 106.82,
    name: "Polisi Terdekat",
    type: "POLICE",
  },
  {
    address: "Ambulans",
    availability: "AVAILABLE",
    contactPhone: "119",
    id: "ambulance-near",
    jurisdiction: "Jakarta",
    latitude: -6.201,
    longitude: 106.821,
    name: "Ambulans Terdekat",
    type: "AMBULANCE",
  },
  {
    address: "Polisi sibuk",
    availability: "BUSY",
    contactPhone: "110",
    id: "police-busy",
    jurisdiction: "Jakarta",
    latitude: -6.199,
    longitude: 106.819,
    name: "Polisi Sibuk",
    type: "POLICE",
  },
];

describe("dispatch rules", () => {
  test("calculates stable distances", () => {
    expect(calculateDistanceKm(-6.2, 106.82, -6.2, 106.82)).toBe(0);
    expect(calculateDistanceKm(-6.2, 106.82, -6.21, 106.83)).toBeGreaterThan(1);
  });

  test("prioritizes matching available agencies before busy agencies", () => {
    const recommendations = buildAgencyRecommendations({
      agencies,
      incidentType: "CRIME",
      latitude: -6.2,
      longitude: 106.82,
    });

    expect(recommendations[0]?.id).toBe("police-near");
    expect(recommendations[1]?.id).toBe("police-busy");
    expect(recommendations[2]?.id).toBe("ambulance-near");
  });

  test("interpolates a unit position from dispatch timestamps", () => {
    const startedAt = new Date("2026-07-16T10:00:00.000Z");
    const dispatch: DispatchRecord = {
      acknowledgedAt: startedAt,
      agency: agencies[0] as DispatchAgency,
      arrivedAt: null,
      completedAt: null,
      destination: {
        address: "Tujuan",
        latitude: -6.22,
        longitude: 106.84,
        title: "Laporan",
      },
      dispatchedByOperatorId: "operator",
      enRouteAt: startedAt,
      estimatedArrivalAt: new Date("2026-07-16T10:00:20.000Z"),
      estimatedReturnAt: null,
      id: "dispatch",
      notes: null,
      reportId: "report",
      requestedAt: startedAt,
      returnedAt: null,
      returnStartedAt: null,
      status: "EN_ROUTE",
      unitCode: "POL-001",
    };

    const tracking = toDispatchTracking(
      dispatch,
      new Date("2026-07-16T10:00:10.000Z")
    );

    expect(tracking.progressPercent).toBe(50);
    expect(tracking.currentLatitude).toBeCloseTo(-6.21);
    expect(tracking.currentLongitude).toBeCloseTo(106.83);
  });

  test("tracks an ambulance returning to base before it can resolve", () => {
    const startedAt = new Date("2026-07-16T10:00:30.000Z");
    const dispatch: DispatchRecord = {
      acknowledgedAt: startedAt,
      agency: agencies[1] as DispatchAgency,
      arrivedAt: startedAt,
      completedAt: null,
      destination: {
        address: "Tujuan",
        latitude: -6.22,
        longitude: 106.84,
        title: "Laporan",
      },
      dispatchedByOperatorId: "operator",
      enRouteAt: startedAt,
      estimatedArrivalAt: startedAt,
      estimatedReturnAt: new Date("2026-07-16T10:00:50.000Z"),
      id: "ambulance-dispatch",
      notes: null,
      reportId: "report",
      requestedAt: startedAt,
      returnedAt: null,
      returnStartedAt: startedAt,
      status: "RETURNING_TO_BASE",
      unitCode: "AMB-001",
    };

    const tracking = toDispatchTracking(
      dispatch,
      new Date("2026-07-16T10:00:40.000Z")
    );

    expect(tracking.canResolve).toBe(false);
    expect(tracking.progressPercent).toBe(50);
    expect(tracking.currentLatitude).toBeCloseTo(-6.2105);
    expect(tracking.currentLongitude).toBeCloseTo(106.8305);

    const returnedTracking = toDispatchTracking(
      {
        ...dispatch,
        returnedAt: new Date("2026-07-16T10:00:50.000Z"),
        status: "RETURNED_TO_BASE",
      },
      new Date("2026-07-16T10:00:50.000Z")
    );

    expect(returnedTracking.canResolve).toBe(true);
    expect(returnedTracking.currentLatitude).toBe(dispatch.agency.latitude);
    expect(returnedTracking.currentLongitude).toBe(dispatch.agency.longitude);
  });
});
