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

const interactionModeSchema = z.enum(["VOICE", "TEXT", "SILENT"]);
const responderPreferenceSchema = z.enum(["AI", "OPERATOR"]);

const reporterReportStatusSchema = z.union([
  activeReportStatusSchema,
  terminalReportStatusSchema,
]);

const reporterMessageSchema = z.object({
  content: z.string(),
  createdAt: z.iso.datetime(),
  id: z.string(),
  senderType: z.enum(["REPORTER", "AI_AGENT", "OPERATOR", "SYSTEM"]),
  sequence: z.number().int().nonnegative(),
  type: z.enum([
    "REPORTER_TEXT",
    "OPERATOR_TEXT",
    "AI_TEXT",
    "TRANSCRIPT_FINAL",
    "SYSTEM",
  ]),
});

const reporterReportListItemSchema = z.object({
  category: reportCategorySchema,
  createdAt: z.iso.datetime(),
  id: z.string(),
  incidentType: incidentTypeSchema.nullable(),
  interactionMode: interactionModeSchema.nullable(),
  status: reporterReportStatusSchema,
  summary: z.string().nullable(),
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

export const reporterReportDetailSchema = reporterReportListItemSchema.extend({
  acknowledgements: z.array(z.enum(["HELP_VISIBLE", "WITH_RESPONDER"])),
  address: z.string().nullable(),
  assignedOperator: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  callSession: z
    .object({
      id: z.string(),
      status: z.enum([
        "CREATED",
        "CONNECTING",
        "ACTIVE",
        "ENDING",
        "ENDED",
        "FAILED",
      ]),
    })
    .nullable(),
  cancellationRequest: z
    .object({
      createdAt: z.iso.datetime(),
      reason: z.string(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    })
    .nullable(),
  latestDispatch: z
    .object({
      agencyName: z.string().nullable(),
      estimatedArrivalAt: z.iso.datetime().nullable(),
      status: z.string(),
      unitCode: z.string().nullable(),
    })
    .nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  messages: z.array(reporterMessageSchema),
  recommendation: z.string().nullable(),
  recordingStatus: z
    .enum([
      "NOT_STARTED",
      "RECORDING",
      "FINALIZING",
      "UPLOADING",
      "READY",
      "FAILED_FINAL",
      "DELETED",
    ])
    .nullable(),
  responderPreference: responderPreferenceSchema,
});

export const createReporterReportInputSchema = z
  .object({
    address: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().min(16).max(100),
    incidentType: incidentTypeSchema.optional(),
    interactionMode: interactionModeSchema,
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    responderPreference: responderPreferenceSchema,
  })
  .superRefine((input, context) => {
    if ((input.latitude === undefined) !== (input.longitude === undefined)) {
      context.addIssue({
        code: "custom",
        message: "Latitude dan longitude harus dikirim bersama",
        path: ["latitude"],
      });
    }
  });

export const reporterReportIdInputSchema = z.object({
  reportId: z.string().min(1),
});

export const updateReporterLocationInputSchema =
  reporterReportIdInputSchema.extend({
    address: z.string().trim().max(500).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });

export const appendReporterTextInputSchema = reporterReportIdInputSchema.extend(
  {
    content: z.string().trim().min(1).max(5000),
    idempotencyKey: z.string().min(16).max(100),
  }
);

export const switchReporterModeInputSchema = reporterReportIdInputSchema.extend(
  {
    interactionMode: interactionModeSchema,
  }
);

export const requestReporterCancellationInputSchema =
  reporterReportIdInputSchema.extend({
    reason: z.string().trim().min(3).max(500),
  });

export const acknowledgeReporterInputSchema =
  reporterReportIdInputSchema.extend({
    type: z.enum(["HELP_VISIBLE", "WITH_RESPONDER"]),
  });

export const reporterReportListSchema = z.array(reporterReportListItemSchema);

export const liveKitConnectionSchema = z.object({
  available: z.boolean(),
  message: z.string().nullable(),
  token: z.string().nullable(),
  url: z.url().nullable(),
});

const editableReportDetailSchema = z
  .object({
    address: z.string().trim().max(500).nullable(),
    category: reportCategorySchema,
    extractedData: z.json(),
    incidentType: incidentTypeSchema.nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    recommendation: z.string().trim().max(2000).nullable(),
    summary: z.string().trim().max(5000).nullable(),
    title: z.string().trim().max(250).nullable(),
  })
  .superRefine((detail, context) => {
    if ((detail.latitude === null) !== (detail.longitude === null)) {
      context.addIssue({
        code: "custom",
        message: "Latitude dan longitude harus diisi atau dikosongkan bersama",
        path: ["latitude"],
      });
    }
  });

export const updateReportDetailInputSchema = z.object({
  detail: editableReportDetailSchema,
  expectedUpdatedAt: z.iso.datetime(),
  reportId: z.string().min(1),
});

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
  acknowledgements: z.array(z.enum(["HELP_VISIBLE", "WITH_RESPONDER"])),
  acousticSignals: z.array(
    z.object({
      code: z.string(),
      confidence: z.number().min(0).max(1),
      createdAt: z.iso.datetime(),
      endedAt: z.iso.datetime(),
      id: z.string(),
      startedAt: z.iso.datetime(),
      status: z.enum(["INFERRED", "CONFIRMED", "REJECTED"]),
    })
  ),
  activeChannel: z.enum(["VOICE", "CHAT"]).nullable(),
  address: z.string().nullable(),
  assignedOperator: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  callSession: z
    .object({
      id: z.string(),
      status: z.enum([
        "CREATED",
        "CONNECTING",
        "ACTIVE",
        "ENDING",
        "ENDED",
        "FAILED",
      ]),
    })
    .nullable(),
  canClose: z.boolean(),
  cancellationRequest: z
    .object({
      createdAt: z.iso.datetime(),
      reason: z.string(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    })
    .nullable(),
  canEdit: z.boolean(),
  canTakeOver: z.boolean(),
  category: reportCategorySchema,
  closeBlockReason: z.string().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: z.iso.datetime(),
  editBlockReason: z.string().nullable(),
  extractedData: z.unknown(),
  handlingMode: z.enum(["AI", "HUMAN"]),
  id: z.string(),
  incidentType: incidentTypeSchema.nullable(),
  interactionMode: interactionModeSchema.nullable(),
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
  messages: z.array(reporterMessageSchema),
  recommendation: z.string().nullable(),
  recording: z
    .object({
      id: z.string(),
      status: z.enum([
        "NOT_STARTED",
        "RECORDING",
        "FINALIZING",
        "UPLOADING",
        "READY",
        "FAILED_FINAL",
        "DELETED",
      ]),
    })
    .nullable(),
  reporter: z.object({
    email: z.string(),
    emergencyContactName: z.string().nullable(),
    emergencyContactPhone: z.string().nullable(),
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  responderPreference: responderPreferenceSchema,
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
  takeoverBlockReason: z.string().nullable(),
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
  closureNote: z.string().nullable(),
  closureReason: z
    .enum(["PRANK_CALL", "INCOMPLETE_REPORT", "OTHER"])
    .nullable(),
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
