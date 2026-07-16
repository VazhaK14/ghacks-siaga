import { z } from "zod";

const dashboardPeriodSchema = z.enum(["24H", "7D", "30D"]);
const reportCategorySchema = z.enum([
  "UNCATEGORIZED",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
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
const agencyTypeSchema = z.enum([
  "POLICE",
  "FIRE_DEPARTMENT",
  "AMBULANCE",
  "SAR",
  "OTHER",
]);

export const dashboardOverviewInputSchema = z.object({
  period: dashboardPeriodSchema.default("24H"),
});

export const dashboardOverviewSchema = z.object({
  attentionQueue: z.array(
    z.object({
      address: z.string().nullable(),
      ageMinutes: z.number().int().nonnegative(),
      category: reportCategorySchema,
      createdAt: z.iso.datetime(),
      id: z.string(),
      incidentType: incidentTypeSchema.nullable(),
      status: z.string(),
      title: z.string().nullable(),
    })
  ),
  flow: z.array(
    z.object({
      bucketStart: z.iso.datetime(),
      incoming: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
    })
  ),
  generatedAt: z.iso.datetime(),
  incidentBreakdown: z.array(
    z.object({
      count: z.number().int().nonnegative(),
      incidentType: z.union([incidentTypeSchema, z.literal("UNCLASSIFIED")]),
    })
  ),
  period: dashboardPeriodSchema,
  recentActivity: z.array(
    z.object({
      category: reportCategorySchema,
      createdAt: z.iso.datetime(),
      id: z.string(),
      note: z.string().nullable(),
      reportId: z.string(),
      reportTitle: z.string().nullable(),
      toStatus: z.string(),
    })
  ),
  summary: z.object({
    activeTotal: z.number().int().nonnegative(),
    availableUnits: z.number().int().nonnegative(),
    awaitingReview: z.number().int().nonnegative(),
    incomingDeltaPercent: z.number().int().nullable(),
    incomingInPeriod: z.number().int().nonnegative(),
    medianResponseDeltaPercent: z.number().int().nullable(),
    medianResponseSeconds: z.number().int().nonnegative().nullable(),
    resolvedDeltaPercent: z.number().int().nullable(),
    resolvedInPeriod: z.number().int().nonnegative(),
    totalUnits: z.number().int().nonnegative(),
    urgentActive: z.number().int().nonnegative(),
  }),
  unitReadiness: z.array(
    z.object({
      activeDispatches: z.number().int().nonnegative(),
      available: z.number().int().nonnegative(),
      busy: z.number().int().nonnegative(),
      offline: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      type: agencyTypeSchema,
    })
  ),
});
