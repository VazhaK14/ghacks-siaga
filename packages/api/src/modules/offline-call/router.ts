import { createHash, createHmac } from "node:crypto";

import prisma from "@siaga-app/db";
import { env } from "@siaga-app/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { operatorProcedure, publicProcedure, router } from "../../index";
import type { CallTranscriptSegment } from "../report/domain/operator-call";
import { GeminiCallSummaryGenerator } from "../report/infrastructure/gemini-call-summary-generator";
import { publishReportLiveEvent } from "../report/presentation/live-events";
import { publishOfflineCallLiveEvent } from "./live-events";
import { createOfflineCallConnection } from "./livekit";
import { consumeOfflineCallStart } from "./rate-limit";

const MISSED_AFTER_MS = 90_000;
const UNCONVERTED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set(["CANCELLED", "ENDED", "FAILED", "MISSED"]);
const summaryGenerator = new GeminiCallSummaryGenerator();

const callStatusSchema = z.enum([
  "WAITING",
  "ACTIVE",
  "ENDED",
  "CANCELLED",
  "MISSED",
  "FAILED",
]);
const connectionSchema = z.object({
  available: z.boolean(),
  message: z.string().nullable(),
  token: z.string().nullable(),
  url: z.string().nullable(),
});
const callSummarySchema = z.object({
  callerCondition: z.string(),
  confidencePercent: z.number().int().min(0).max(100),
  followUp: z.string(),
  keyPoints: z.array(z.string()),
  summary: z.string(),
});
const callDetailSchema = z.object({
  acceptedAt: z.date().nullable(),
  assignedOperatorId: z.string().nullable(),
  convertedReportId: z.string().nullable(),
  createdAt: z.date(),
  durationSeconds: z.number().int().nullable(),
  endedAt: z.date().nullable(),
  finalizedAt: z.date().nullable(),
  id: z.string(),
  isDemo: z.boolean(),
  latitude: z.number().nullable(),
  locationAccuracy: z.number().nullable(),
  longitude: z.number().nullable(),
  status: callStatusSchema,
  summary: callSummarySchema.nullable(),
  updatedAt: z.date(),
});
const publicAccessSchema = z.object({
  accessToken: z.string().min(32).max(256),
  callId: z.string().min(1),
});
const transcriptSegmentSchema = z.object({
  speaker: z.enum(["OPERATOR", "REPORTER"]),
  text: z.string().trim().min(1).max(2000),
  timestampMs: z.number().int().nonnegative(),
});
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

const hashValue = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const deriveAccessToken = (requestIpHash: string, idempotencyKey: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${requestIpHash}:${idempotencyKey}`)
    .digest("hex");

const callSelect = {
  acceptedAt: true,
  assignedOperatorId: true,
  callerCondition: true,
  confidencePercent: true,
  convertedReport: { select: { id: true } },
  createdAt: true,
  durationSeconds: true,
  endedAt: true,
  finalizedAt: true,
  followUp: true,
  id: true,
  isDemo: true,
  keyPoints: true,
  latitude: true,
  locationAccuracy: true,
  longitude: true,
  roomName: true,
  status: true,
  summary: true,
  updatedAt: true,
} as const;

const findCallById = (callId: string) =>
  prisma.offlineEmergencyCall.findUnique({
    select: callSelect,
    where: { id: callId },
  });

type OfflineCallRecord = NonNullable<Awaited<ReturnType<typeof findCallById>>>;

const readKeyPoints = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const toCallDetail = (call: OfflineCallRecord) => ({
  acceptedAt: call.acceptedAt,
  assignedOperatorId: call.assignedOperatorId,
  convertedReportId: call.convertedReport?.id ?? null,
  createdAt: call.createdAt,
  durationSeconds: call.durationSeconds,
  endedAt: call.endedAt,
  finalizedAt: call.finalizedAt,
  id: call.id,
  isDemo: call.isDemo,
  latitude: call.latitude,
  locationAccuracy: call.locationAccuracy,
  longitude: call.longitude,
  status: call.status,
  summary: call.summary
    ? {
        callerCondition:
          call.callerCondition ?? "Kondisi penelepon belum dapat dinilai.",
        confidencePercent: call.confidencePercent ?? 0,
        followUp: call.followUp ?? "Tinjau kembali kondisi penelepon.",
        keyPoints: readKeyPoints(call.keyPoints),
        summary: call.summary,
      }
    : null,
  updatedAt: call.updatedAt,
});

const maintainCallRetention = async (): Promise<void> => {
  const now = new Date();
  await Promise.all([
    prisma.offlineEmergencyCall.updateMany({
      data: { endedAt: now, status: "MISSED" },
      where: {
        createdAt: { lt: new Date(now.getTime() - MISSED_AFTER_MS) },
        status: "WAITING",
      },
    }),
    prisma.offlineEmergencyCall.deleteMany({
      where: {
        convertedReport: { is: null },
        status: { in: ["CANCELLED", "ENDED", "FAILED", "MISSED"] },
        updatedAt: {
          lt: new Date(now.getTime() - UNCONVERTED_RETENTION_MS),
        },
      },
    }),
  ]);
};

const findPublicCall = async (input: z.infer<typeof publicAccessSchema>) => {
  await maintainCallRetention();
  const call = await prisma.offlineEmergencyCall.findFirst({
    select: callSelect,
    where: {
      accessTokenHash: hashValue(input.accessToken),
      id: input.callId,
    },
  });
  if (!call) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Panggilan tidak ditemukan.",
    });
  }
  return call;
};

const calculateDuration = (
  acceptedAt: Date | null,
  endedAt: Date
): number | null =>
  acceptedAt
    ? Math.max(0, Math.round((endedAt.getTime() - acceptedAt.getTime()) / 1000))
    : null;

const requireOwnedCall = async (
  callId: string,
  operatorId: string
): Promise<OfflineCallRecord> => {
  const call = await prisma.offlineEmergencyCall.findFirst({
    select: callSelect,
    where: { assignedOperatorId: operatorId, id: callId },
  });
  if (!call) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Panggilan bukan milik operator ini.",
    });
  }
  return call;
};

const finalizeCall = async (input: {
  callId: string;
  operatorId: string;
  transcript: CallTranscriptSegment[];
}) => {
  const current = await requireOwnedCall(input.callId, input.operatorId);
  if (current.summary) {
    return toCallDetail(current);
  }
  const summary = await summaryGenerator.generate({
    context: {
      category: "UNCATEGORIZED",
      incidentType: null,
      recommendation: null,
      reportId: `guest-call:${current.id}`,
      summary: null,
      title: "Panggilan darurat tanpa akun",
    },
    transcript: input.transcript,
  });
  await prisma.offlineEmergencyCall.updateMany({
    data: {
      callerCondition: summary.callerCondition,
      confidencePercent: summary.confidencePercent,
      finalizedAt: new Date(),
      followUp: summary.followUp,
      keyPoints: summary.keyPoints,
      summary: summary.summary,
    },
    where: {
      assignedOperatorId: input.operatorId,
      id: input.callId,
      summary: null,
    },
  });
  const finalized = await findCallById(input.callId);
  if (!finalized) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Panggilan tidak ditemukan setelah finalisasi.",
    });
  }
  publishOfflineCallLiveEvent({
    callId: finalized.id,
    type: "offline-call.finalized",
  });
  return toCallDetail(finalized);
};

export const offlineCallRouter = router({
  accept: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(z.object({ call: callDetailSchema, connection: connectionSchema }))
    .mutation(async ({ ctx, input }) => {
      await maintainCallRetention();
      const acceptedAt = new Date();
      const claim = await prisma.offlineEmergencyCall.updateMany({
        data: {
          acceptedAt,
          assignedOperatorId: ctx.session.user.id,
          status: "ACTIVE",
        },
        where: {
          assignedOperatorId: null,
          id: input.callId,
          status: "WAITING",
        },
      });
      if (claim.count !== 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Panggilan sudah diambil operator lain atau telah berakhir.",
        });
      }
      const call = await findCallById(input.callId);
      if (!call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Panggilan tidak ditemukan setelah diterima.",
        });
      }
      const connection = await createOfflineCallConnection({
        callId: call.id,
        identity: `operator-${ctx.session.user.id}-${call.id}`,
        role: "operator",
        roomName: call.roomName,
      });
      publishOfflineCallLiveEvent({
        callId: call.id,
        type: "offline-call.accepted",
      });
      return { call: toCallDetail(call), connection };
    }),
  connection: publicProcedure
    .input(publicAccessSchema)
    .output(connectionSchema)
    .mutation(async ({ input }) => {
      const call = await findPublicCall(input);
      if (TERMINAL_STATUSES.has(call.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Panggilan telah berakhir.",
        });
      }
      return createOfflineCallConnection({
        callId: call.id,
        identity: `caller-${call.id}`,
        role: "caller",
        roomName: call.roomName,
      });
    }),
  convertToReport: operatorProcedure
    .input(
      z.object({
        address: z.string().trim().max(500).optional(),
        callId: z.string().min(1),
        incidentType: incidentTypeSchema,
        summary: z.string().trim().min(3).max(5000),
        title: z.string().trim().min(3).max(250),
      })
    )
    .output(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const call = await requireOwnedCall(input.callId, ctx.session.user.id);
      if (!call.summary) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Ringkasan panggilan belum selesai dibuat.",
        });
      }
      const reportId = await prisma.$transaction(async (transaction) => {
        const existing = await transaction.emergencyReport.findUnique({
          select: { id: true },
          where: { sourceOfflineCallId: call.id },
        });
        if (existing) {
          return existing.id;
        }
        const report = await transaction.emergencyReport.create({
          data: {
            activeChannel: "VOICE",
            address: input.address,
            assignedOperatorId: ctx.session.user.id,
            handlingMode: "HUMAN",
            incidentType: input.incidentType,
            intakeCompletedAt: new Date(),
            intakeCompletionReason: "USER_ENDED",
            intakeStatus: "FINALIZED",
            interactionMode: "VOICE",
            isDemo: call.isDemo,
            latitude: call.latitude,
            longitude: call.longitude,
            responderPreference: "OPERATOR",
            source: "GUEST_CALL",
            sourceOfflineCallId: call.id,
            status: "READY_FOR_REVIEW",
            summary: input.summary,
            title: input.title,
          },
        });
        await transaction.reportStatusEvent.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "OPERATOR",
            note: "Laporan dibuat operator dari panggilan tamu",
            reportId: report.id,
            toStatus: "READY_FOR_REVIEW",
          },
        });
        return report.id;
      });
      await publishReportLiveEvent({
        reportId,
        type: "report.created",
        updatedAt: new Date().toISOString(),
      });
      publishOfflineCallLiveEvent({
        callId: call.id,
        type: "offline-call.converted",
      });
      return { reportId };
    }),
  endByCaller: publicProcedure
    .input(publicAccessSchema)
    .output(callDetailSchema)
    .mutation(async ({ input }) => {
      const current = await findPublicCall(input);
      if (TERMINAL_STATUSES.has(current.status)) {
        return toCallDetail(current);
      }
      const endedAt = new Date();
      const call = await prisma.offlineEmergencyCall.update({
        data: {
          durationSeconds: calculateDuration(current.acceptedAt, endedAt),
          endedAt,
          status: current.status === "WAITING" ? "CANCELLED" : "ENDED",
        },
        select: callSelect,
        where: { id: current.id },
      });
      publishOfflineCallLiveEvent({
        callId: call.id,
        type: "offline-call.ended",
      });
      return toCallDetail(call);
    }),
  endByOperator: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(callDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await requireOwnedCall(input.callId, ctx.session.user.id);
      if (TERMINAL_STATUSES.has(current.status)) {
        return toCallDetail(current);
      }
      const endedAt = new Date();
      const call = await prisma.offlineEmergencyCall.update({
        data: {
          durationSeconds: calculateDuration(current.acceptedAt, endedAt),
          endedAt,
          status: "ENDED",
        },
        select: callSelect,
        where: { id: current.id },
      });
      publishOfflineCallLiveEvent({
        callId: call.id,
        type: "offline-call.ended",
      });
      return toCallDetail(call);
    }),
  finalize: operatorProcedure
    .input(
      z.object({
        callId: z.string().min(1),
        transcript: z.array(transcriptSegmentSchema).max(200),
      })
    )
    .output(callDetailSchema)
    .mutation(({ ctx, input }) =>
      finalizeCall({
        callId: input.callId,
        operatorId: ctx.session.user.id,
        transcript: input.transcript,
      })
    ),
  get: publicProcedure
    .input(publicAccessSchema)
    .output(callDetailSchema)
    .query(async ({ input }) => toCallDetail(await findPublicCall(input))),
  getOperatorDetail: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(callDetailSchema)
    .query(async ({ input }) => {
      await maintainCallRetention();
      const call = await findCallById(input.callId);
      if (!call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Panggilan tidak ditemukan.",
        });
      }
      return toCallDetail(call);
    }),
  list: operatorProcedure
    .output(z.array(callDetailSchema))
    .query(async ({ ctx }) => {
      await maintainCallRetention();
      const calls = await prisma.offlineEmergencyCall.findMany({
        orderBy: { createdAt: "desc" },
        select: callSelect,
        take: 50,
        where: {
          OR: [
            { status: "WAITING" },
            {
              assignedOperatorId: ctx.session.user.id,
              status: "ACTIVE",
            },
            {
              assignedOperatorId: ctx.session.user.id,
              convertedReport: { is: null },
              status: { in: ["CANCELLED", "ENDED", "FAILED", "MISSED"] },
            },
          ],
        },
      });
      return calls.map(toCallDetail);
    }),
  operatorConnection: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(connectionSchema)
    .mutation(async ({ ctx, input }) => {
      const call = await prisma.offlineEmergencyCall.findFirst({
        select: callSelect,
        where: {
          assignedOperatorId: ctx.session.user.id,
          id: input.callId,
          status: "ACTIVE",
        },
      });
      if (!call) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Panggilan tidak aktif untuk operator ini.",
        });
      }
      return createOfflineCallConnection({
        callId: call.id,
        identity: `operator-${ctx.session.user.id}-${call.id}`,
        role: "operator",
        roomName: call.roomName,
      });
    }),
  start: publicProcedure
    .input(
      z.object({
        idempotencyKey: z.string().min(8).max(200),
        latitude: z.number().min(-90).max(90).optional(),
        locationAccuracy: z.number().min(0).max(100_000).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
    )
    .output(
      z.object({
        accessToken: z.string(),
        call: callDetailSchema,
        connection: connectionSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await maintainCallRetention();
      const requestIpHash = hashValue(ctx.requestIp);
      const accessToken = deriveAccessToken(
        requestIpHash,
        input.idempotencyKey
      );
      const existing = await prisma.offlineEmergencyCall.findUnique({
        select: callSelect,
        where: {
          requestIpHash_idempotencyKey: {
            idempotencyKey: input.idempotencyKey,
            requestIpHash,
          },
        },
      });
      if (!(existing || (await consumeOfflineCallStart(requestIpHash)))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Batas tiga panggilan demo per 10 menit telah tercapai.",
        });
      }
      const roomName = `offline-${accessToken.slice(0, 24)}`;
      const call =
        existing ??
        (await prisma.offlineEmergencyCall.create({
          data: {
            accessTokenHash: hashValue(accessToken),
            idempotencyKey: input.idempotencyKey,
            latitude: input.latitude,
            locationAccuracy: input.locationAccuracy,
            longitude: input.longitude,
            requestIpHash,
            roomName,
          },
          select: callSelect,
        }));
      const connection = await createOfflineCallConnection({
        callId: call.id,
        identity: `caller-${call.id}`,
        role: "caller",
        roomName: call.roomName,
      });
      if (!existing) {
        publishOfflineCallLiveEvent({
          callId: call.id,
          type: "offline-call.created",
        });
      }
      return { accessToken, call: toCallDetail(call), connection };
    }),
});
