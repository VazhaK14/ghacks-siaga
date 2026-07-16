import { z } from "zod";

const reportCategorySchema = z.enum([
  "UNCATEGORIZED",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const activeReportStatusSchema = z.enum([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
  "DISPATCH_PENDING",
  "DISPATCHED",
  "HELP_EN_ROUTE",
  "HELP_ARRIVED",
]);

const terminalReportStatusSchema = z.enum(["RESOLVED", "CLOSED", "CANCELLED"]);

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

export const listActiveReportsInputSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(25).default(10),
});

export const listArchivedReportsInputSchema = z.object({
  category: reportCategorySchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  query: z.string().trim().max(100).optional(),
  status: terminalReportStatusSchema.optional(),
});

export const reportIdInputSchema = z.object({
  reportId: z.string().min(1),
});

const reportListItemSchema = z.object({
  address: z.string().nullable(),
  category: reportCategorySchema,
  createdAt: z.iso.datetime(),
  id: z.string(),
  incidentType: incidentTypeSchema.nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  status: activeReportStatusSchema,
  summary: z.string().nullable(),
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

export const activeReportPageSchema = z.object({
  activeCount: z.number().int().nonnegative(),
  items: z.array(reportListItemSchema),
  nextCursor: z.string().nullable(),
});

export const archivedReportPageSchema = z.object({
  items: z.array(
    z.object({
      address: z.string().nullable(),
      assignedOperator: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .nullable(),
      category: reportCategorySchema,
      createdAt: z.iso.datetime(),
      id: z.string(),
      incidentType: incidentTypeSchema.nullable(),
      latestDispatch: z
        .object({
          agencyName: z.string().nullable(),
          status: z.string(),
          unitCode: z.string().nullable(),
        })
        .nullable(),
      reporter: z.object({
        id: z.string(),
        name: z.string(),
      }),
      status: terminalReportStatusSchema,
      summary: z.string().nullable(),
      terminalAt: z.iso.datetime(),
      title: z.string().nullable(),
    })
  ),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const reportMapPointsSchema = z.array(
  z.object({
    category: reportCategorySchema,
    id: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    status: activeReportStatusSchema,
    title: z.string().nullable(),
    updatedAt: z.iso.datetime(),
  })
);

export const reportDetailSchema = z.object({
  activeChannel: z.enum(["VOICE", "CHAT"]).nullable(),
  address: z.string().nullable(),
  assignedOperator: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  category: reportCategorySchema,
  contactPhone: z.string().nullable(),
  createdAt: z.iso.datetime(),
  extractedData: z.unknown(),
  handlingMode: z.enum(["AI", "HUMAN"]),
  id: z.string(),
  incidentType: incidentTypeSchema.nullable(),
  latestAnalysis: z
    .object({
      category: reportCategorySchema,
      confidenceScore: z.number().nullable(),
      createdAt: z.iso.datetime(),
      incidentType: incidentTypeSchema.nullable(),
      modelVersion: z.string().nullable(),
      recommendation: z.string().nullable(),
      summary: z.string(),
    })
    .nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  recommendation: z.string().nullable(),
  reporter: z.object({
    email: z.string(),
    emergencyContactName: z.string().nullable(),
    emergencyContactPhone: z.string().nullable(),
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  status: activeReportStatusSchema,
  statusHistory: z.array(
    z.object({
      actorType: z.enum(["REPORTER", "AI_AGENT", "OPERATOR", "SYSTEM"]),
      createdAt: z.iso.datetime(),
      fromStatus: z.string().nullable(),
      id: z.string(),
      note: z.string().nullable(),
      toStatus: z.string(),
    })
  ),
  summary: z.string().nullable(),
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

const reportStatusHistoryItemSchema = z.object({
  actorType: z.enum(["REPORTER", "AI_AGENT", "OPERATOR", "SYSTEM"]),
  createdAt: z.iso.datetime(),
  fromStatus: z.string().nullable(),
  id: z.string(),
  note: z.string().nullable(),
  toStatus: z.string(),
});

export const archivedReportDetailSchema = z.object({
  address: z.string().nullable(),
  assignedOperator: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  category: reportCategorySchema,
  closedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  dispatches: z.array(
    z.object({
      acknowledgedAt: z.iso.datetime().nullable(),
      agency: z
        .object({
          name: z.string(),
          type: z.string(),
        })
        .nullable(),
      arrivedAt: z.iso.datetime().nullable(),
      completedAt: z.iso.datetime().nullable(),
      dispatchedByOperator: z.object({
        id: z.string(),
        name: z.string(),
      }),
      enRouteAt: z.iso.datetime().nullable(),
      id: z.string(),
      requestedAt: z.iso.datetime(),
      status: z.string(),
      unitCode: z.string().nullable(),
    })
  ),
  id: z.string(),
  incidentType: incidentTypeSchema.nullable(),
  reporter: z.object({
    email: z.email(),
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  resolvedAt: z.iso.datetime().nullable(),
  status: terminalReportStatusSchema,
  statusHistory: z.array(reportStatusHistoryItemSchema),
  summary: z.string().nullable(),
  terminalAt: z.iso.datetime(),
  title: z.string().nullable(),
});
