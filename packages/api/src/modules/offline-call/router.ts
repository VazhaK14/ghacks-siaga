import { createHash, createHmac } from "node:crypto";

import prisma from "@siaga-app/db";
import { env } from "@siaga-app/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { operatorProcedure, publicProcedure, router } from "../../index";
import { publishOfflineCallLiveEvent } from "./live-events";
import { createOfflineCallConnection } from "./livekit";
import { consumeOfflineCallStart } from "./rate-limit";

const MISSED_AFTER_MS = 90_000;
const TERMINAL_STATUSES = new Set(["CANCELLED", "ENDED", "FAILED", "MISSED"]);
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
const transcriptSchema = z.object({
  confidence: z.number().nullable(),
  content: z.string(),
  createdAt: z.date(),
  id: z.string(),
  sequence: z.number().int(),
  speaker: z.enum(["CALLER", "OPERATOR"]),
});
const callDetailSchema = z.object({
  acceptedAt: z.date().nullable(),
  assignedOperatorId: z.string().nullable(),
  createdAt: z.date(),
  durationSeconds: z.number().int().nullable(),
  endedAt: z.date().nullable(),
  id: z.string(),
  isDemo: z.boolean(),
  latitude: z.number().nullable(),
  locationAccuracy: z.number().nullable(),
  longitude: z.number().nullable(),
  status: callStatusSchema,
  transcripts: z.array(transcriptSchema),
  updatedAt: z.date(),
});
const publicAccessSchema = z.object({
  accessToken: z.string().min(32).max(256),
  callId: z.string().min(1),
});
const transcriptInputSchema = publicAccessSchema.extend({
  confidence: z.number().min(0).max(1).optional(),
  content: z.string().trim().min(1).max(2000),
  idempotencyKey: z.string().min(8).max(200),
});

const hashValue = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const deriveAccessToken = (requestIpHash: string, idempotencyKey: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${requestIpHash}:${idempotencyKey}`)
    .digest("hex");

const expireWaitingCalls = async (): Promise<void> => {
  await prisma.offlineEmergencyCall.updateMany({
    data: { endedAt: new Date(), status: "MISSED" },
    where: {
      createdAt: { lt: new Date(Date.now() - MISSED_AFTER_MS) },
      status: "WAITING",
    },
  });
};

const callSelect = {
  acceptedAt: true,
  assignedOperatorId: true,
  createdAt: true,
  durationSeconds: true,
  endedAt: true,
  id: true,
  isDemo: true,
  latitude: true,
  locationAccuracy: true,
  longitude: true,
  status: true,
  transcripts: {
    orderBy: { sequence: "asc" },
    select: {
      confidence: true,
      content: true,
      createdAt: true,
      id: true,
      sequence: true,
      speaker: true,
    },
  },
  updatedAt: true,
} as const;

const findPublicCall = async (input: z.infer<typeof publicAccessSchema>) => {
  await expireWaitingCalls();
  const call = await prisma.offlineEmergencyCall.findFirst({
    select: { ...callSelect, roomName: true },
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

const appendTranscript = async (input: {
  authorId?: string;
  callId: string;
  confidence?: number;
  content: string;
  idempotencyKey: string;
  speaker: "CALLER" | "OPERATOR";
}) => {
  const existing = await prisma.offlineCallTranscript.findUnique({
    where: {
      callId_idempotencyKey: {
        callId: input.callId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) {
    return existing;
  }
  const count = await prisma.offlineCallTranscript.count({
    where: { callId: input.callId },
  });
  const transcript = await prisma.offlineCallTranscript.create({
    data: {
      authorId: input.authorId,
      callId: input.callId,
      confidence: input.confidence,
      content: input.content,
      idempotencyKey: input.idempotencyKey,
      sequence: count + 1,
      speaker: input.speaker,
    },
  });
  publishOfflineCallLiveEvent({
    callId: input.callId,
    type: "offline-call.transcript",
  });
  return transcript;
};

export const offlineCallRouter = router({
  accept: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(z.object({ call: callDetailSchema, connection: connectionSchema }))
    .mutation(async ({ ctx, input }) => {
      await expireWaitingCalls();
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
      const call = await prisma.offlineEmergencyCall.findUniqueOrThrow({
        select: { ...callSelect, roomName: true },
        where: { id: input.callId },
      });
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
      return { call, connection };
    }),
  appendCallerTranscript: publicProcedure
    .input(transcriptInputSchema)
    .output(transcriptSchema)
    .mutation(async ({ input }) => {
      const call = await findPublicCall(input);
      if (TERMINAL_STATUSES.has(call.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Panggilan telah berakhir.",
        });
      }
      return appendTranscript({ ...input, speaker: "CALLER" });
    }),
  appendOperatorTranscript: operatorProcedure
    .input(
      z.object({
        callId: z.string().min(1),
        confidence: z.number().min(0).max(1).optional(),
        content: z.string().trim().min(1).max(2000),
        idempotencyKey: z.string().min(8).max(200),
      })
    )
    .output(transcriptSchema)
    .mutation(async ({ ctx, input }) => {
      const call = await prisma.offlineEmergencyCall.findFirst({
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
      return appendTranscript({
        ...input,
        authorId: ctx.session.user.id,
        speaker: "OPERATOR",
      });
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
  endByCaller: publicProcedure
    .input(publicAccessSchema)
    .output(callDetailSchema)
    .mutation(async ({ input }) => {
      const current = await findPublicCall(input);
      if (TERMINAL_STATUSES.has(current.status)) {
        return current;
      }
      const endedAt = new Date();
      const call = await prisma.offlineEmergencyCall.update({
        data: {
          durationSeconds: current.acceptedAt
            ? Math.max(
                0,
                Math.round(
                  (endedAt.getTime() - current.acceptedAt.getTime()) / 1000
                )
              )
            : null,
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
      return call;
    }),
  endByOperator: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(callDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await prisma.offlineEmergencyCall.findFirst({
        where: { assignedOperatorId: ctx.session.user.id, id: input.callId },
      });
      if (!current) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Panggilan bukan milik operator ini.",
        });
      }
      const endedAt = new Date();
      const call = await prisma.offlineEmergencyCall.update({
        data: {
          durationSeconds: current.acceptedAt
            ? Math.max(
                0,
                Math.round(
                  (endedAt.getTime() - current.acceptedAt.getTime()) / 1000
                )
              )
            : null,
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
      return call;
    }),
  get: publicProcedure
    .input(publicAccessSchema)
    .output(callDetailSchema)
    .query(({ input }) => findPublicCall(input)),
  getOperatorDetail: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(callDetailSchema)
    .query(async ({ input }) => {
      await expireWaitingCalls();
      const call = await prisma.offlineEmergencyCall.findUnique({
        select: callSelect,
        where: { id: input.callId },
      });
      if (!call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Panggilan tidak ditemukan.",
        });
      }
      return call;
    }),
  list: operatorProcedure.output(z.array(callDetailSchema)).query(async () => {
    await expireWaitingCalls();
    return prisma.offlineEmergencyCall.findMany({
      orderBy: { createdAt: "desc" },
      select: callSelect,
      take: 50,
      where: { status: { in: ["WAITING", "ACTIVE"] } },
    });
  }),
  operatorConnection: operatorProcedure
    .input(z.object({ callId: z.string().min(1) }))
    .output(connectionSchema)
    .mutation(async ({ ctx, input }) => {
      const call = await prisma.offlineEmergencyCall.findFirst({
        select: { id: true, roomName: true, status: true },
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
      const requestIpHash = hashValue(ctx.requestIp);
      const accessToken = deriveAccessToken(
        requestIpHash,
        input.idempotencyKey
      );
      const existing = await prisma.offlineEmergencyCall.findUnique({
        select: { ...callSelect, roomName: true },
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
          select: { ...callSelect, roomName: true },
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
      return { accessToken, call, connection };
    }),
});
