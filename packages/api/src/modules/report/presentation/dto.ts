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
    "SUPPLEMENTAL_TEXT",
    "SYSTEM",
  ]),
});

const reportImageAttachmentSchema = z.object({
  bytes: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  format: z.string().min(1),
  height: z.number().int().positive().nullable(),
  id: z.string(),
  originalFilename: z.string(),
  width: z.number().int().positive().nullable(),
});

const reportImageAccessInputSchema = z.object({
  attachmentIds: z.array(z.string().min(1)).min(1).max(20),
  reportId: z.string().min(1),
});

export const reportImageAccessOutputSchema = z.array(
  z.object({
    attachmentId: z.string(),
    expiresAt: z.iso.datetime(),
    url: z.url(),
  })
);

export const reporterImageAccessInputSchema = reportImageAccessInputSchema;
export const operatorImageAccessInputSchema = reportImageAccessInputSchema;

export const prepareReportImageUploadsInputSchema = z.object({
  files: z
    .array(
      z.object({
        bytes: z
          .number()
          .int()
          .positive()
          .max(5 * 1024 * 1024),
        mimeType: z.enum([
          "image/heic",
          "image/heif",
          "image/jpeg",
          "image/png",
          "image/webp",
        ]),
        originalFilename: z.string().trim().min(1).max(255),
      })
    )
    .min(1)
    .max(3),
  reportId: z.string().min(1),
});

export const prepareReportImageUploadsOutputSchema = z.array(
  z.object({
    apiKey: z.string(),
    attachmentId: z.string(),
    cloudName: z.string(),
    deliveryType: z.literal("authenticated"),
    overwrite: z.literal(false),
    publicId: z.string(),
    signature: z.string(),
    timestamp: z.number().int().positive(),
    uploadPreset: z.string(),
  })
);

export const completeReportImageUploadsInputSchema = z.object({
  reportId: z.string().min(1),
  uploads: z
    .array(
      z.object({
        assetId: z.string().min(1),
        attachmentId: z.string().min(1),
        bytes: z
          .number()
          .int()
          .positive()
          .max(5 * 1024 * 1024),
        deliveryType: z.string().min(1),
        format: z.string().min(1).max(10),
        height: z.number().int().positive(),
        publicId: z.string().min(1),
        resourceType: z.string().min(1),
        signature: z.string().min(1),
        version: z.number().int().positive(),
        width: z.number().int().positive(),
      })
    )
    .min(1)
    .max(3),
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
  acousticSignals: z.array(
    z.object({
      code: z.enum([
        "SCREAM",
        "GUNSHOT",
        "EXPLOSION",
        "CRYING",
        "GLASS_BREAKING",
        "AGGRESSIVE_SHOUTING",
      ]),
      confidence: z.number().min(0).max(1),
      createdAt: z.iso.datetime(),
      id: z.string(),
    })
  ),
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
  imageAttachments: z.array(reportImageAttachmentSchema),
  intakeCompletedAt: z.iso.datetime().nullable(),
  intakeCompletionReason: z
    .enum([
      "ENOUGH_INFORMATION",
      "URGENT_PARTIAL",
      "QUESTION_LIMIT",
      "USER_ENDED",
      "TECHNICAL_FAILURE",
      "ACOUSTIC_TRIGGER",
    ])
    .nullable(),
  intakeQuestionCount: z.number().int().nonnegative(),
  intakeStatus: z.enum(["COLLECTING", "FINALIZING", "FINALIZED"]),
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
  missingCriticalFields: z.array(
    z.enum(["INCIDENT", "LOCATION", "IMMEDIATE_DANGER", "PEOPLE_AFFECTED"])
  ),
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
    source: z.enum([
      "CHAT",
      "VOICE_TRANSCRIPT",
      "VOICE_SUPPORT_TRANSCRIPT",
      "SILENT_TRANSCRIPT",
      "SUPPORT_CHAT",
    ]),
  }
);

export const appendAcousticSignalInputSchema =
  reporterReportIdInputSchema.extend({
    code: z.enum([
      "SCREAM",
      "GUNSHOT",
      "EXPLOSION",
      "CRYING",
      "GLASS_BREAKING",
      "AGGRESSIVE_SHOUTING",
    ]),
    confidence: z.number().min(0.8).max(1),
    endedAt: z.iso.datetime(),
    modelId: z.string().min(1).max(100),
    modelVersion: z.string().max(100).optional(),
    startedAt: z.iso.datetime(),
  });

export const synthesizeSpeechInputSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

export const realtimeTranscriptionAccessSchema = z.object({
  available: z.boolean(),
  message: z.string().nullable(),
  modelId: z.literal("scribe_v2_realtime"),
  token: z.string().nullable(),
});

export const synthesizedSpeechSchema = z.object({
  audioBase64: z.string().nullable(),
  available: z.boolean(),
  message: z.string().nullable(),
  mimeType: z.literal("audio/mpeg"),
});

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

const operatorCallSummarySchema = z.object({
  callerCondition: z.string(),
  confidencePercent: z.number().int().min(0).max(100),
  followUp: z.string(),
  keyPoints: z.array(z.string()),
  summary: z.string(),
});

export const operatorCallStateSchema = z.object({
  answeredAt: z.iso.datetime().nullable(),
  callSessionId: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  expiresAt: z.iso.datetime(),
  operator: z.object({ id: z.string(), name: z.string() }),
  reporter: z.object({ id: z.string(), name: z.string() }),
  reportId: z.string(),
  ringingAt: z.iso.datetime(),
  status: z.enum(["CONNECTING", "ACTIVE", "ENDED", "FAILED"]),
  summary: operatorCallSummarySchema.nullable(),
});

export const callSessionIdInputSchema = z.object({
  callSessionId: z.string().uuid(),
});

export const startOperatorCallOutputSchema = z.object({
  call: operatorCallStateSchema,
  connection: liveKitConnectionSchema,
  notification: z.object({
    message: z.string().nullable(),
    status: z.enum(["DELIVERED", "FAILED", "UNAVAILABLE"]),
  }),
});

export const acceptOperatorCallOutputSchema = z.object({
  call: operatorCallStateSchema,
  connection: liveKitConnectionSchema,
});

export const endOperatorCallInputSchema = callSessionIdInputSchema.extend({
  transcript: z
    .array(
      z.object({
        speaker: z.enum(["OPERATOR", "REPORTER"]),
        text: z.string().trim().min(1).max(2000),
        timestampMs: z.number().int().nonnegative(),
      })
    )
    .max(200),
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

export const reviewAcousticSignalInputSchema = reportIdInputSchema.extend({
  signalId: z.string().min(1),
  status: z.enum(["CONFIRMED", "REJECTED"]),
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
        isGuest: z.boolean(),
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
  imageAttachments: z.array(reportImageAttachmentSchema),
  incidentType: incidentTypeSchema.nullable(),
  intakeCompletedAt: z.iso.datetime().nullable(),
  intakeCompletionReason: z
    .enum([
      "ENOUGH_INFORMATION",
      "URGENT_PARTIAL",
      "QUESTION_LIMIT",
      "USER_ENDED",
      "TECHNICAL_FAILURE",
      "ACOUSTIC_TRIGGER",
    ])
    .nullable(),
  intakeQuestionCount: z.number().int().nonnegative(),
  intakeStatus: z.enum(["COLLECTING", "FINALIZING", "FINALIZED"]),
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
  missingCriticalFields: z.array(z.string()),
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
    isGuest: z.boolean(),
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
  imageAttachments: z.array(reportImageAttachmentSchema),
  incidentType: incidentTypeSchema.nullable(),
  reporter: z.object({
    email: z.string(),
    id: z.string(),
    isGuest: z.boolean(),
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
