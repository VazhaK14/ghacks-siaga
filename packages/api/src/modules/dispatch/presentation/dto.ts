import { z } from "zod";

const dispatchAgencyTypeSchema = z.enum([
  "POLICE",
  "FIRE_DEPARTMENT",
  "AMBULANCE",
  "SAR",
  "OTHER",
]);

const dispatchAgencyAvailabilitySchema = z.enum([
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
]);

const dispatchStatusSchema = z.enum([
  "REQUESTED",
  "ACKNOWLEDGED",
  "EN_ROUTE",
  "ARRIVED",
  "RETURNING_TO_BASE",
  "RETURNED_TO_BASE",
  "COMPLETED",
  "CANCELLED",
]);

const incidentTypeSchema = z.enum([
  "CRIME",
  "FIRE",
  "MEDICAL",
  "TRAFFIC_ACCIDENT",
  "NATURAL_DISASTER",
  "DOMESTIC_VIOLENCE",
  "MISSING_PERSON",
  "OTHER",
]);

const agencySchema = z.object({
  address: z.string().nullable(),
  availability: dispatchAgencyAvailabilitySchema,
  contactPhone: z.string().nullable(),
  id: z.string(),
  jurisdiction: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  type: dispatchAgencyTypeSchema,
});

export const dispatchTrackingSchema = z.object({
  acknowledgedAt: z.iso.datetime().nullable(),
  agency: agencySchema,
  arrivedAt: z.iso.datetime().nullable(),
  canResolve: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
  currentLatitude: z.number(),
  currentLongitude: z.number(),
  destination: z.object({
    address: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    title: z.string().nullable(),
  }),
  enRouteAt: z.iso.datetime().nullable(),
  estimatedArrivalAt: z.iso.datetime().nullable(),
  estimatedReturnAt: z.iso.datetime().nullable(),
  id: z.string(),
  notes: z.string().nullable(),
  progressPercent: z.number().min(0).max(100),
  reportId: z.string(),
  requestedAt: z.iso.datetime(),
  returnedAt: z.iso.datetime().nullable(),
  returnStartedAt: z.iso.datetime().nullable(),
  status: dispatchStatusSchema,
  unitCode: z.string().nullable(),
});

export const reportDispatchOverviewSchema = z.object({
  activeDispatch: dispatchTrackingSchema.nullable(),
  canDispatch: z.boolean(),
  dispatchBlockReason: z.string().nullable(),
  incidentType: incidentTypeSchema.nullable(),
  recommendations: z.array(
    agencySchema.extend({
      distanceKm: z.number().nonnegative(),
      etaMinutes: z.number().int().positive(),
      matchReason: z.string(),
      recommended: z.boolean(),
    })
  ),
  reportId: z.string(),
});

export const agencyBoardSchema = z.array(
  agencySchema.extend({
    activeDispatch: dispatchTrackingSchema.nullable(),
  })
);

export const reportDispatchInputSchema = z.object({
  reportId: z.string().min(1),
});

export const createDispatchInputSchema = z.object({
  agencyId: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
  reportId: z.string().min(1),
});

export const dispatchIdInputSchema = z.object({
  dispatchId: z.string().min(1),
});
