import type {
  DispatchAgency,
  DispatchAgencyRecommendation,
  DispatchAgencyType,
  DispatchIncidentType,
  DispatchRecord,
  DispatchTracking,
} from "../domain/entities";

const EARTH_RADIUS_KM = 6371;
const DEMO_TRAVEL_DURATION_MS = 20_000;
const MINUTES_PER_KILOMETER = 2.5;

const INCIDENT_AGENCY_PRIORITY: Record<
  DispatchIncidentType,
  DispatchAgencyType[]
> = {
  CRIME: ["POLICE"],
  DOMESTIC_VIOLENCE: ["POLICE"],
  FIRE: ["FIRE_DEPARTMENT"],
  MEDICAL: ["AMBULANCE"],
  MISSING_PERSON: ["POLICE", "SAR"],
  NATURAL_DISASTER: ["SAR", "AMBULANCE"],
  OTHER: ["POLICE", "OTHER"],
  TRAFFIC_ACCIDENT: ["AMBULANCE", "POLICE"],
};

const MATCH_REASON: Record<DispatchAgencyType, string> = {
  AMBULANCE: "Sesuai untuk respons medis dan evakuasi korban",
  FIRE_DEPARTMENT: "Sesuai untuk kebakaran dan penyelamatan",
  OTHER: "Unit bantuan umum terdekat",
  POLICE: "Sesuai untuk keamanan dan penanganan kepolisian",
  SAR: "Sesuai untuk pencarian dan penyelamatan",
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const calculateDistanceKm = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
): number => {
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const buildAgencyRecommendations = ({
  agencies,
  incidentType,
  latitude,
  longitude,
}: {
  agencies: DispatchAgency[];
  incidentType: DispatchIncidentType | null;
  latitude: number;
  longitude: number;
}): DispatchAgencyRecommendation[] => {
  const priority = INCIDENT_AGENCY_PRIORITY[incidentType ?? "OTHER"];

  return agencies
    .map((agency) => {
      const typeRank = priority.indexOf(agency.type);
      const distanceKm = calculateDistanceKm(
        agency.latitude,
        agency.longitude,
        latitude,
        longitude
      );

      return {
        ...agency,
        distanceKm: Number(distanceKm.toFixed(1)),
        etaMinutes: Math.max(1, Math.round(distanceKm * MINUTES_PER_KILOMETER)),
        matchReason: MATCH_REASON[agency.type],
        recommended: typeRank >= 0,
        typeRank: typeRank >= 0 ? typeRank : priority.length + 1,
      };
    })
    .sort((firstAgency, secondAgency) => {
      if (firstAgency.typeRank !== secondAgency.typeRank) {
        return firstAgency.typeRank - secondAgency.typeRank;
      }
      if (firstAgency.availability !== secondAgency.availability) {
        if (firstAgency.availability === "AVAILABLE") {
          return -1;
        }
        if (secondAgency.availability === "AVAILABLE") {
          return 1;
        }
      }
      return firstAgency.distanceKm - secondAgency.distanceKm;
    })
    .slice(0, 5)
    .map(({ typeRank: _typeRank, ...agency }) => agency);
};

const interpolate = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;

export const toDispatchTracking = (
  dispatch: DispatchRecord,
  now = new Date()
): DispatchTracking => {
  let progress = 0;
  if (
    dispatch.status === "EN_ROUTE" &&
    dispatch.enRouteAt &&
    dispatch.estimatedArrivalAt
  ) {
    const duration =
      dispatch.estimatedArrivalAt.getTime() - dispatch.enRouteAt.getTime();
    const elapsed = now.getTime() - dispatch.enRouteAt.getTime();
    progress = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 1;
  } else if (dispatch.status === "ARRIVED" || dispatch.status === "COMPLETED") {
    progress = 1;
  }

  return {
    acknowledgedAt: dispatch.acknowledgedAt?.toISOString() ?? null,
    agency: dispatch.agency,
    arrivedAt: dispatch.arrivedAt?.toISOString() ?? null,
    canResolve: dispatch.status === "ARRIVED",
    completedAt: dispatch.completedAt?.toISOString() ?? null,
    currentLatitude: interpolate(
      dispatch.agency.latitude,
      dispatch.destination.latitude,
      progress
    ),
    currentLongitude: interpolate(
      dispatch.agency.longitude,
      dispatch.destination.longitude,
      progress
    ),
    destination: dispatch.destination,
    enRouteAt: dispatch.enRouteAt?.toISOString() ?? null,
    estimatedArrivalAt: dispatch.estimatedArrivalAt?.toISOString() ?? null,
    id: dispatch.id,
    notes: dispatch.notes,
    progressPercent: Math.round(progress * 100),
    reportId: dispatch.reportId,
    requestedAt: dispatch.requestedAt.toISOString(),
    status: dispatch.status,
    unitCode: dispatch.unitCode,
  };
};

export const getDemoEstimatedArrivalAt = (requestedAt: Date): Date =>
  new Date(requestedAt.getTime() + DEMO_TRAVEL_DURATION_MS);
