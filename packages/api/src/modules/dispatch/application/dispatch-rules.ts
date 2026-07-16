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
const DEMO_RETURN_DURATION_MS = 20_000;
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

interface DispatchPosition {
  currentLatitude: number;
  currentLongitude: number;
  progress: number;
}

const getTimedProgress = (
  startedAt: Date,
  estimatedCompletionAt: Date,
  now: Date
): number => {
  const duration = estimatedCompletionAt.getTime() - startedAt.getTime();
  const elapsed = now.getTime() - startedAt.getTime();
  return duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 1;
};

const getDispatchPosition = (
  dispatch: DispatchRecord,
  now: Date
): DispatchPosition => {
  if (
    dispatch.status === "EN_ROUTE" &&
    dispatch.enRouteAt &&
    dispatch.estimatedArrivalAt
  ) {
    const progress = getTimedProgress(
      dispatch.enRouteAt,
      dispatch.estimatedArrivalAt,
      now
    );
    return {
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
      progress,
    };
  }

  if (
    dispatch.status === "RETURNING_TO_BASE" &&
    dispatch.returnStartedAt &&
    dispatch.estimatedReturnAt
  ) {
    const progress = getTimedProgress(
      dispatch.returnStartedAt,
      dispatch.estimatedReturnAt,
      now
    );
    return {
      currentLatitude: interpolate(
        dispatch.destination.latitude,
        dispatch.agency.latitude,
        progress
      ),
      currentLongitude: interpolate(
        dispatch.destination.longitude,
        dispatch.agency.longitude,
        progress
      ),
      progress,
    };
  }

  const isAtBase =
    dispatch.status === "RETURNED_TO_BASE" ||
    (dispatch.status === "COMPLETED" && dispatch.returnedAt !== null);
  if (isAtBase) {
    return {
      currentLatitude: dispatch.agency.latitude,
      currentLongitude: dispatch.agency.longitude,
      progress: 1,
    };
  }

  const isAtDestination =
    dispatch.status === "ARRIVED" || dispatch.status === "COMPLETED";
  if (isAtDestination) {
    return {
      currentLatitude: dispatch.destination.latitude,
      currentLongitude: dispatch.destination.longitude,
      progress: 1,
    };
  }

  return {
    currentLatitude: dispatch.agency.latitude,
    currentLongitude: dispatch.agency.longitude,
    progress: 0,
  };
};

export const toDispatchTracking = (
  dispatch: DispatchRecord,
  now = new Date()
): DispatchTracking => {
  const { currentLatitude, currentLongitude, progress } = getDispatchPosition(
    dispatch,
    now
  );

  return {
    acknowledgedAt: dispatch.acknowledgedAt?.toISOString() ?? null,
    agency: dispatch.agency,
    arrivedAt: dispatch.arrivedAt?.toISOString() ?? null,
    canResolve:
      dispatch.agency.type === "AMBULANCE"
        ? dispatch.status === "RETURNED_TO_BASE"
        : dispatch.status === "ARRIVED",
    completedAt: dispatch.completedAt?.toISOString() ?? null,
    currentLatitude,
    currentLongitude,
    destination: dispatch.destination,
    enRouteAt: dispatch.enRouteAt?.toISOString() ?? null,
    estimatedArrivalAt: dispatch.estimatedArrivalAt?.toISOString() ?? null,
    estimatedReturnAt: dispatch.estimatedReturnAt?.toISOString() ?? null,
    id: dispatch.id,
    notes: dispatch.notes,
    progressPercent: Math.round(progress * 100),
    reportId: dispatch.reportId,
    requestedAt: dispatch.requestedAt.toISOString(),
    returnedAt: dispatch.returnedAt?.toISOString() ?? null,
    returnStartedAt: dispatch.returnStartedAt?.toISOString() ?? null,
    status: dispatch.status,
    unitCode: dispatch.unitCode,
  };
};

export const getDemoEstimatedArrivalAt = (requestedAt: Date): Date =>
  new Date(requestedAt.getTime() + DEMO_TRAVEL_DURATION_MS);

export const getDemoEstimatedReturnAt = (returnStartedAt: Date): Date =>
  new Date(returnStartedAt.getTime() + DEMO_RETURN_DURATION_MS);
