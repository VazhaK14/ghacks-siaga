import prisma from "@siaga-app/db";

import {
  OPERATOR_CALL_PROVIDER,
  OPERATOR_CALL_RING_TIMEOUT_MS,
  OperatorCallError,
  type OperatorCallRepository,
  type OperatorCallState,
  type OperatorCallSummary,
  type StartedOperatorCall,
} from "../domain/operator-call";

const ACTIVE_REPORT_STATUSES = [
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
  "DISPATCH_PENDING",
  "DISPATCHED",
  "HELP_EN_ROUTE",
  "HELP_ARRIVED",
] as const;
const ACTIVE_REPORT_STATUS_SET = new Set<string>(ACTIVE_REPORT_STATUSES);

const isPrismaConflict = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error.code === "P2002" || error.code === "P2034");

const createActiveCallConflict = (cause: unknown): OperatorCallError =>
  new OperatorCallError(
    "CONFLICT",
    "Masih ada panggilan aktif untuk laporan ini",
    { cause }
  );

const callInclude = {
  initiatedByOperator: { select: { id: true, name: true } },
  report: {
    select: {
      id: true,
      reporter: { select: { id: true, name: true } },
    },
  },
} as const;

type CallRecord = Awaited<
  ReturnType<typeof prisma.callSession.findFirstOrThrow>
> & {
  initiatedByOperator: { id: string; name: string } | null;
  report: { id: string; reporter: { id: string; name: string } | null };
};

const readKeyPoints = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const toState = (call: CallRecord): OperatorCallState => {
  if (
    !(
      call.initiatedByOperator &&
      call.report.reporter &&
      call.ringingAt &&
      call.expiresAt
    )
  ) {
    throw new OperatorCallError("NOT_FOUND", "Sesi panggilan tidak valid");
  }
  const summary = call.summary
    ? {
        callerCondition:
          call.callerCondition ?? "Kondisi pelapor belum dapat dinilai.",
        confidencePercent: call.confidencePercent ?? 0,
        followUp: call.followUp ?? "Tinjau kembali detail laporan.",
        keyPoints: readKeyPoints(call.keyPoints),
        summary: call.summary,
      }
    : null;
  const durationSeconds =
    call.durationSeconds ??
    (call.answeredAt
      ? Math.max(
          0,
          Math.floor(
            ((call.endedAt ?? new Date()).getTime() -
              call.answeredAt.getTime()) /
              1000
          )
        )
      : 0);
  return {
    answeredAt: call.answeredAt?.toISOString() ?? null,
    callSessionId: call.id,
    durationSeconds,
    expiresAt: call.expiresAt.toISOString(),
    operator: call.initiatedByOperator,
    reporter: call.report.reporter,
    reportId: call.report.id,
    ringingAt: call.ringingAt.toISOString(),
    status:
      call.status === "ACTIVE" ||
      call.status === "ENDED" ||
      call.status === "FAILED"
        ? call.status
        : "CONNECTING",
    summary,
  };
};

export class PrismaOperatorCallRepository implements OperatorCallRepository {
  async acceptForReporter(
    callSessionId: string,
    reporterId: string
  ): Promise<{ roomName: string; state: OperatorCallState }> {
    await this.expireIfNeeded(callSessionId);
    const result = await prisma.callSession.updateMany({
      data: { answeredAt: new Date(), status: "ACTIVE" },
      where: {
        id: callSessionId,
        provider: OPERATOR_CALL_PROVIDER,
        report: { reporterId },
        status: "CONNECTING",
      },
    });
    if (result.count !== 1) {
      const current = await this.findReporterCall(callSessionId, reporterId);
      if (current.status !== "ACTIVE") {
        throw new OperatorCallError(
          "CONFLICT",
          "Panggilan sudah berakhir atau tidak lagi dapat diterima"
        );
      }
    }
    const call = await this.findReporterCall(callSessionId, reporterId);
    if (!call.livekitRoomName) {
      throw new OperatorCallError(
        "NOT_FOUND",
        "Ruang panggilan tidak tersedia"
      );
    }
    return { roomName: call.livekitRoomName, state: toState(call) };
  }

  async endForOperator(
    callSessionId: string,
    operatorId: string
  ): Promise<OperatorCallState> {
    const call = await this.findOperatorCall(callSessionId, operatorId);
    return this.end(call, "COMPLETED");
  }

  async endForReporter(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    const call = await this.findReporterCall(callSessionId, reporterId);
    return this.end(call, "USER_HANGUP");
  }

  async findContext(callSessionId: string) {
    const call = await prisma.callSession.findUnique({
      select: {
        report: {
          select: {
            category: true,
            id: true,
            incidentType: true,
            recommendation: true,
            summary: true,
            title: true,
          },
        },
      },
      where: { id: callSessionId },
    });
    if (!call) {
      throw new OperatorCallError("NOT_FOUND", "Panggilan tidak ditemukan");
    }
    return {
      ...call.report,
      category: call.report.category,
      incidentType: call.report.incidentType,
      reportId: call.report.id,
    };
  }

  async getForOperator(
    callSessionId: string,
    operatorId: string
  ): Promise<OperatorCallState> {
    await this.expireIfNeeded(callSessionId);
    return toState(await this.findOperatorCall(callSessionId, operatorId));
  }

  async getForReporter(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    await this.expireIfNeeded(callSessionId);
    return toState(await this.findReporterCall(callSessionId, reporterId));
  }

  async getRoomForOperator(
    callSessionId: string,
    operatorId: string
  ): Promise<string> {
    const call = await this.findOperatorCall(callSessionId, operatorId);
    if (
      !(call.livekitRoomName && ["CONNECTING", "ACTIVE"].includes(call.status))
    ) {
      throw new OperatorCallError("CONFLICT", "Panggilan sudah berakhir");
    }
    return call.livekitRoomName;
  }

  async rejectForReporter(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    const call = await this.findReporterCall(callSessionId, reporterId);
    return this.end(call, "USER_HANGUP");
  }

  async saveSummary(
    callSessionId: string,
    summary: OperatorCallSummary
  ): Promise<OperatorCallState> {
    const call = await prisma.callSession.update({
      data: {
        callerCondition: summary.callerCondition,
        confidencePercent: summary.confidencePercent,
        followUp: summary.followUp,
        keyPoints: summary.keyPoints,
        summary: summary.summary,
      },
      include: callInclude,
      where: { id: callSessionId },
    });
    return toState(call);
  }

  async start(
    reportId: string,
    operatorId: string
  ): Promise<StartedOperatorCall> {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const now = new Date();
          const report = await transaction.emergencyReport.findUnique({
            select: {
              assignedOperatorId: true,
              id: true,
              reporter: { select: { id: true, name: true } },
              status: true,
            },
            where: { id: reportId },
          });
          if (
            !(report?.reporter && ACTIVE_REPORT_STATUS_SET.has(report.status))
          ) {
            throw new OperatorCallError(
              "NOT_FOUND",
              "Laporan aktif tidak ditemukan"
            );
          }
          if (
            report.assignedOperatorId &&
            report.assignedOperatorId !== operatorId
          ) {
            throw new OperatorCallError(
              "CONFLICT",
              "Laporan sedang ditangani operator lain"
            );
          }
          await transaction.callSession.updateMany({
            data: {
              durationSeconds: 0,
              endedAt: now,
              endReason: "TIMEOUT",
              status: "ENDED",
            },
            where: {
              expiresAt: { lt: now },
              provider: OPERATOR_CALL_PROVIDER,
              reportId,
              status: "CONNECTING",
            },
          });
          const existingCall = await transaction.callSession.findFirst({
            select: { id: true },
            where: {
              provider: OPERATOR_CALL_PROVIDER,
              reportId,
              status: { in: ["CONNECTING", "ACTIVE"] },
            },
          });
          if (existingCall) {
            throw new OperatorCallError(
              "CONFLICT",
              "Masih ada panggilan aktif untuk laporan ini"
            );
          }
          await transaction.emergencyReport.update({
            data: { assignedOperatorId: operatorId, handlingMode: "HUMAN" },
            where: { id: reportId },
          });
          const callSessionId = crypto.randomUUID();
          const roomName = `callback-${reportId}-${callSessionId}`;
          const call = await transaction.callSession.create({
            data: {
              activeInteractionMode: "VOICE",
              expiresAt: new Date(
                now.getTime() + OPERATOR_CALL_RING_TIMEOUT_MS
              ),
              id: callSessionId,
              initiatedByOperatorId: operatorId,
              livekitRoomName: roomName,
              provider: OPERATOR_CALL_PROVIDER,
              reportId,
              ringingAt: now,
              startedAt: now,
              status: "CONNECTING",
            },
            include: callInclude,
          });
          return { roomName, state: toState(call) };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (isPrismaConflict(error)) {
        throw createActiveCallConflict(error);
      }
      throw error;
    }
  }

  private async end(
    call: CallRecord,
    endReason: "COMPLETED" | "USER_HANGUP"
  ): Promise<OperatorCallState> {
    if (call.status === "ENDED" || call.status === "FAILED") {
      return toState(call);
    }
    const endedAt = new Date();
    const durationSeconds = call.answeredAt
      ? Math.max(
          0,
          Math.floor((endedAt.getTime() - call.answeredAt.getTime()) / 1000)
        )
      : 0;
    const ended = await prisma.callSession.update({
      data: { durationSeconds, endedAt, endReason, status: "ENDED" },
      include: callInclude,
      where: { id: call.id },
    });
    return toState(ended);
  }

  private async expireIfNeeded(callSessionId: string): Promise<void> {
    await prisma.callSession.updateMany({
      data: {
        durationSeconds: 0,
        endedAt: new Date(),
        endReason: "TIMEOUT",
        status: "ENDED",
      },
      where: {
        expiresAt: { lt: new Date() },
        id: callSessionId,
        provider: OPERATOR_CALL_PROVIDER,
        status: "CONNECTING",
      },
    });
  }

  private async findOperatorCall(
    callSessionId: string,
    operatorId: string
  ): Promise<CallRecord> {
    const call = await prisma.callSession.findFirst({
      include: callInclude,
      where: {
        id: callSessionId,
        initiatedByOperatorId: operatorId,
        provider: OPERATOR_CALL_PROVIDER,
      },
    });
    if (!call) {
      throw new OperatorCallError("NOT_FOUND", "Panggilan tidak ditemukan");
    }
    return call;
  }

  private async findReporterCall(
    callSessionId: string,
    reporterId: string
  ): Promise<CallRecord> {
    const call = await prisma.callSession.findFirst({
      include: callInclude,
      where: {
        id: callSessionId,
        provider: OPERATOR_CALL_PROVIDER,
        report: { reporterId },
      },
    });
    if (!call) {
      throw new OperatorCallError("NOT_FOUND", "Panggilan tidak ditemukan");
    }
    return call;
  }
}
