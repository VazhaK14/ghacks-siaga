import prisma from "@siaga-app/db";
import {
  MessageSenderType,
  type ReportStatus as PrismaReportStatus,
  ReportStatus,
} from "@siaga-app/db/enums";

import {
  ACTIVE_REPORT_STATUSES,
  TERMINAL_REPORT_STATUSES,
} from "../domain/entities";
import { INTAKE_FINALIZED_MESSAGE } from "../domain/intake-policy";
import {
  isReporterTextSourceAllowed,
  reporterMessageChannelForSource,
  reporterMessageTypeForSource,
} from "../domain/reporter-message-policy";
import type {
  AppendAcousticSignalInput,
  AppendReporterTextInput,
  AssistantDelivery,
  AssistantReportUpdate,
  CreateReporterReportInput,
  CriticalIntakeField,
  IntakeDecision,
  ReporterAcknowledgementType,
  ReporterInteractionMode,
  ReporterReportDetail,
  ReporterReportListItem,
  ReporterReportRepository,
  ReporterReportStatus,
} from "../domain/reporter-report";

const REPORTER_REPORT_STATUSES = [
  ...ACTIVE_REPORT_STATUSES,
  ...TERMINAL_REPORT_STATUSES,
] as PrismaReportStatus[];
const ACTIVE_REPORT_STATUS_VALUES = [
  ...ACTIVE_REPORT_STATUSES,
] as PrismaReportStatus[];

const toIsoString = (value: Date): string => value.toISOString();

const CRITICAL_INTAKE_FIELDS = [
  "INCIDENT",
  "LOCATION",
  "IMMEDIATE_DANGER",
  "PEOPLE_AFFECTED",
] as const satisfies readonly CriticalIntakeField[];

const toCriticalIntakeFields = (value: unknown): CriticalIntakeField[] =>
  Array.isArray(value)
    ? value.filter((field): field is CriticalIntakeField =>
        CRITICAL_INTAKE_FIELDS.some((candidate) => candidate === field)
      )
    : [];

const reporterReportInclude = {
  acknowledgements: {
    orderBy: { createdAt: "asc" as const },
    select: { type: true },
  },
  acousticSignals: {
    orderBy: { createdAt: "desc" as const },
    select: {
      code: true,
      confidence: true,
      createdAt: true,
      id: true,
    },
    take: 10,
  },
  assignedOperator: {
    select: { id: true, name: true },
  },
  callSessions: {
    orderBy: { startedAt: "desc" as const },
    select: { id: true, status: true },
    take: 1,
  },
  cancellationRequests: {
    orderBy: { createdAt: "desc" as const },
    select: {
      createdAt: true,
      reason: true,
      status: true,
    },
    take: 1,
  },
  dispatches: {
    include: {
      agency: { select: { name: true } },
    },
    orderBy: { requestedAt: "desc" as const },
    take: 1,
  },
  messages: {
    orderBy: { sequence: "asc" as const },
    select: {
      content: true,
      createdAt: true,
      id: true,
      senderType: true,
      sequence: true,
      type: true,
    },
  },
  recordings: {
    orderBy: { createdAt: "desc" as const },
    select: { status: true },
    take: 1,
  },
} as const;

type ReporterReportRow = NonNullable<
  Awaited<ReturnType<typeof findReporterReport>>
>;

const findReporterReport = (reportId: string, reporterId: string) =>
  prisma.emergencyReport.findFirst({
    include: reporterReportInclude,
    where: {
      id: reportId,
      reporterId,
      status: { in: REPORTER_REPORT_STATUSES },
    },
  });

const toReporterDetail = (report: ReporterReportRow): ReporterReportDetail => {
  const [callSession] = report.callSessions;
  const [cancellationRequest] = report.cancellationRequests;
  const [latestDispatch] = report.dispatches;
  const [recording] = report.recordings;

  return {
    acknowledgements: report.acknowledgements.map(({ type }) => type),
    acousticSignals: report.acousticSignals.map((signal) => ({
      code: signal.code as ReporterReportDetail["acousticSignals"][number]["code"],
      confidence: signal.confidence,
      createdAt: toIsoString(signal.createdAt),
      id: signal.id,
    })),
    address: report.address,
    assignedOperator: report.assignedOperator,
    callSession: callSession
      ? {
          id: callSession.id,
          status: callSession.status,
        }
      : null,
    cancellationRequest: cancellationRequest
      ? {
          createdAt: toIsoString(cancellationRequest.createdAt),
          reason: cancellationRequest.reason,
          status: cancellationRequest.status,
        }
      : null,
    category: report.category,
    createdAt: toIsoString(report.createdAt),
    id: report.id,
    incidentType: report.incidentType,
    intakeCompletedAt: report.intakeCompletedAt
      ? toIsoString(report.intakeCompletedAt)
      : null,
    intakeCompletionReason: report.intakeCompletionReason,
    intakeQuestionCount: report.intakeQuestionCount,
    intakeStatus: report.intakeStatus,
    interactionMode: report.interactionMode,
    latestDispatch: latestDispatch
      ? {
          agencyName: latestDispatch.agency?.name ?? null,
          estimatedArrivalAt: latestDispatch.estimatedArrivalAt
            ? toIsoString(latestDispatch.estimatedArrivalAt)
            : null,
          status: latestDispatch.status,
          unitCode: latestDispatch.unitCode,
        }
      : null,
    latitude: report.latitude,
    longitude: report.longitude,
    messages: report.messages.map((message) => ({
      ...message,
      createdAt: toIsoString(message.createdAt),
    })),
    missingCriticalFields: toCriticalIntakeFields(report.missingCriticalFields),
    recommendation: report.recommendation,
    recordingStatus: recording?.status ?? null,
    responderPreference: report.responderPreference,
    status: report.status as ReporterReportStatus,
    summary: report.summary,
    title: report.title,
    updatedAt: toIsoString(report.updatedAt),
  };
};

const channelForMode = (mode: ReporterInteractionMode): "VOICE" | "CHAT" =>
  mode === "TEXT" ? "CHAT" : "VOICE";

const initialAssistantMessage = (mode: ReporterInteractionMode): string => {
  if (mode === "SILENT") {
    return "Laporan awal sudah diterima. Perangkat tetap hening dan SIAGA sedang menganalisis suara sekitar.";
  }
  return "Apa keadaan daruratnya?";
};

const incidentTitle: Record<string, string> = {
  CRIME: "Laporan kriminal",
  FIRE: "Laporan kebakaran",
  MEDICAL: "Darurat medis",
  NATURAL_DISASTER: "Laporan bencana",
  TRAFFIC_ACCIDENT: "Kecelakaan lalu lintas",
};

const getOwnedReportOrThrow = async (
  reportId: string,
  reporterId: string
): Promise<{
  incidentType: ReporterReportDetail["incidentType"];
  intakeStatus: ReporterReportDetail["intakeStatus"];
  interactionMode: ReporterInteractionMode | null;
  latitude: number | null;
  longitude: number | null;
  missingCriticalFields: CriticalIntakeField[];
}> => {
  const report = await prisma.emergencyReport.findFirst({
    select: {
      incidentType: true,
      intakeStatus: true,
      interactionMode: true,
      latitude: true,
      longitude: true,
      missingCriticalFields: true,
    },
    where: {
      id: reportId,
      reporterId,
      status: { in: REPORTER_REPORT_STATUSES },
    },
  });
  if (!report) {
    throw new Error("Laporan tidak ditemukan");
  }
  return {
    ...report,
    missingCriticalFields: toCriticalIntakeFields(report.missingCriticalFields),
  };
};

const getManualCompletionMissingFields = (report: {
  incidentType: ReporterReportDetail["incidentType"];
  latitude: number | null;
  longitude: number | null;
  missingCriticalFields: CriticalIntakeField[];
}): CriticalIntakeField[] => {
  if (report.missingCriticalFields.length > 0) {
    return report.missingCriticalFields;
  }
  const missing: CriticalIntakeField[] = [
    "IMMEDIATE_DANGER",
    "PEOPLE_AFFECTED",
  ];
  if (!report.incidentType) {
    missing.unshift("INCIDENT");
  }
  if (report.latitude === null || report.longitude === null) {
    missing.push("LOCATION");
  }
  return missing;
};

const getAssistantReply = (
  update: AssistantReportUpdate,
  decision: IntakeDecision
): string =>
  decision.shouldFinalize ? INTAKE_FINALIZED_MESSAGE : update.reply;

export class PrismaReporterReportRepository
  implements ReporterReportRepository
{
  async activateSession(
    reportId: string,
    reporterId: string
  ): Promise<ReporterReportDetail> {
    await getOwnedReportOrThrow(reportId, reporterId);
    const session = await prisma.callSession.findFirstOrThrow({
      orderBy: { startedAt: "desc" },
      select: { id: true },
      where: { reportId },
    });
    await prisma.$transaction([
      prisma.callSession.update({
        data: { status: "ACTIVE" },
        where: { id: session.id },
      }),
      prisma.recordingAsset.updateMany({
        data: {
          startedAt: new Date(),
          status: "RECORDING",
        },
        where: {
          callSessionId: session.id,
          status: "NOT_STARTED",
        },
      }),
    ]);
    const report = await findReporterReport(reportId, reporterId);
    if (!report) {
      throw new Error("Laporan tidak dapat dimuat setelah sesi tersambung");
    }
    return toReporterDetail(report);
  }

  async create(
    input: CreateReporterReportInput
  ): Promise<ReporterReportDetail> {
    const existing = await prisma.emergencyReport.findFirst({
      select: { id: true },
      where: {
        idempotencyKey: input.idempotencyKey,
        reporterId: input.reporterId,
      },
    });
    if (existing) {
      const report = await findReporterReport(existing.id, input.reporterId);
      if (!report) {
        throw new Error("Laporan idempotent tidak dapat dimuat");
      }
      return toReporterDetail(report);
    }

    const reportId = crypto.randomUUID();
    const callSessionId = crypto.randomUUID();
    const isAiTriage = input.responderPreference === "AI";
    const initialStatus = isAiTriage
      ? ReportStatus.AI_GATHERING
      : ReportStatus.SUBMITTED;
    const channel = channelForMode(input.interactionMode);

    await prisma.$transaction(async (transaction) => {
      await transaction.emergencyReport.create({
        data: {
          activeChannel: channel,
          address: input.address,
          id: reportId,
          idempotencyKey: input.idempotencyKey,
          incidentType: input.incidentType,
          interactionMode: input.interactionMode,
          latitude: input.latitude,
          longitude: input.longitude,
          reporterId: input.reporterId,
          responderPreference: input.responderPreference,
          status: initialStatus,
          title: input.incidentType
            ? (incidentTitle[input.incidentType] ?? "Laporan darurat")
            : "Laporan darurat",
        },
      });
      await transaction.callSession.create({
        data: {
          activeInteractionMode: input.interactionMode,
          id: callSessionId,
          livekitRoomName:
            input.interactionMode === "TEXT" ? null : `report-${reportId}`,
          provider: input.interactionMode === "TEXT" ? "TEXT" : "LIVEKIT",
          reportId,
          status: input.interactionMode === "TEXT" ? "ACTIVE" : "CREATED",
        },
      });
      await transaction.modeEvent.create({
        data: {
          actorId: input.reporterId,
          actorType: MessageSenderType.REPORTER,
          callSessionId,
          reportId,
          toMode: input.interactionMode,
        },
      });
      await transaction.reportStatusEvent.create({
        data: {
          actorId: input.reporterId,
          actorType: MessageSenderType.REPORTER,
          note: "Laporan dibuat dari aplikasi reporter",
          reportId,
          toStatus: ReportStatus.SUBMITTED,
        },
      });
      if (isAiTriage) {
        await transaction.reportStatusEvent.create({
          data: {
            actorType: MessageSenderType.SYSTEM,
            fromStatus: ReportStatus.SUBMITTED,
            note: "Triage AI dimulai",
            reportId,
            toStatus: ReportStatus.AI_GATHERING,
          },
        });
        await transaction.message.create({
          data: {
            channel,
            content: initialAssistantMessage(input.interactionMode),
            reportId,
            senderType: MessageSenderType.AI_AGENT,
            sequence: 1,
            type: "AI_TEXT",
          },
        });
      }
      if (input.interactionMode !== "TEXT") {
        await transaction.recordingAsset.create({
          data: {
            callSessionId,
            reportId,
          },
        });
      }
    });

    const report = await findReporterReport(reportId, input.reporterId);
    if (!report) {
      throw new Error("Laporan yang dibuat tidak dapat dimuat");
    }
    return toReporterDetail(report);
  }

  async findMine(
    reportId: string,
    reporterId: string
  ): Promise<ReporterReportDetail | null> {
    const report = await findReporterReport(reportId, reporterId);
    return report ? toReporterDetail(report) : null;
  }

  async listMine(reporterId: string): Promise<ReporterReportListItem[]> {
    const reports = await prisma.emergencyReport.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        category: true,
        createdAt: true,
        id: true,
        incidentType: true,
        interactionMode: true,
        status: true,
        summary: true,
        title: true,
        updatedAt: true,
      },
      where: {
        reporterId,
        status: { in: REPORTER_REPORT_STATUSES },
      },
    });
    return reports.map((report) => ({
      ...report,
      createdAt: toIsoString(report.createdAt),
      status: report.status as ReporterReportStatus,
      updatedAt: toIsoString(report.updatedAt),
    }));
  }

  async prepareLiveSession(
    reportId: string,
    reporterId: string
  ): Promise<{
    interactionMode: ReporterInteractionMode;
    roomName: string;
  }> {
    const report = await prisma.emergencyReport.findFirst({
      include: {
        callSessions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      where: {
        id: reportId,
        reporterId,
        status: { in: ACTIVE_REPORT_STATUS_VALUES },
      },
    });
    const session = report?.callSessions[0];
    if (
      !report?.interactionMode ||
      report.interactionMode === "TEXT" ||
      !session?.livekitRoomName
    ) {
      throw new Error("Sesi suara laporan tidak tersedia");
    }
    if (session.status === "CREATED") {
      await prisma.callSession.update({
        data: { status: "CONNECTING" },
        where: { id: session.id },
      });
    }
    return {
      interactionMode: report.interactionMode,
      roomName: session.livekitRoomName,
    };
  }

  async appendReporterText(
    input: AppendReporterTextInput
  ): Promise<ReporterReportDetail> {
    const report = await getOwnedReportOrThrow(
      input.reportId,
      input.reporterId
    );
    if (
      !isReporterTextSourceAllowed(
        report.interactionMode,
        report.intakeStatus,
        input.source
      )
    ) {
      throw new Error("Sumber pesan tidak sesuai dengan mode laporan");
    }
    const existing = await prisma.message.findFirst({
      select: { id: true },
      where: {
        idempotencyKey: input.idempotencyKey,
        reportId: input.reportId,
      },
    });
    if (!existing) {
      await prisma.$transaction(async (transaction) => {
        const latest = await transaction.message.findFirst({
          orderBy: { sequence: "desc" },
          select: { sequence: true },
          where: { reportId: input.reportId },
        });
        await transaction.message.create({
          data: {
            channel: reporterMessageChannelForSource(
              input.source,
              report.interactionMode
            ),
            content: input.content,
            idempotencyKey: input.idempotencyKey,
            reportId: input.reportId,
            senderType: MessageSenderType.REPORTER,
            senderUserId: input.reporterId,
            sequence: (latest?.sequence ?? 0) + 1,
            type: reporterMessageTypeForSource(
              input.source,
              report.intakeStatus
            ),
          },
        });
      });
    }

    const updated = await findReporterReport(input.reportId, input.reporterId);
    if (!updated) {
      throw new Error("Laporan tidak dapat dimuat setelah pesan dikirim");
    }
    return toReporterDetail(updated);
  }

  async applyAssistantUpdate(
    reportId: string,
    update: AssistantReportUpdate,
    decision: IntakeDecision,
    delivery: AssistantDelivery
  ): Promise<ReporterReportDetail> {
    const reporterId = await prisma.$transaction(async (transaction) => {
      const report = await transaction.emergencyReport.findUniqueOrThrow({
        select: {
          intakeStatus: true,
          reporterId: true,
          status: true,
        },
        where: { id: reportId },
      });
      const latest = await transaction.message.findFirst({
        orderBy: { sequence: "desc" },
        select: { id: true, sequence: true },
        where: { reportId },
      });
      if (delivery !== "SILENT") {
        await transaction.message.create({
          data: {
            channel: delivery,
            content: getAssistantReply(update, decision),
            reportId,
            senderType: MessageSenderType.AI_AGENT,
            sequence: (latest?.sequence ?? 0) + 1,
            type: "AI_TEXT",
          },
        });
      }
      if (report.intakeStatus === "FINALIZED") {
        await transaction.emergencyReport.update({
          data: { version: { increment: 1 } },
          where: { id: reportId },
        });
        return report.reporterId;
      }
      await transaction.aIAnalysisSnapshot.create({
        data: {
          category: update.category,
          extractedData: update.extractedData,
          incidentType: update.incidentType,
          modelVersion: "gemini",
          recommendation: update.recommendation,
          reportId,
          summary: update.summary,
          triggeredByMessageId: latest?.id,
        },
      });
      await transaction.emergencyReport.update({
        data: {
          category: update.category,
          extractedData: update.extractedData,
          incidentType: update.incidentType,
          intakeCompletedAt: decision.shouldFinalize ? new Date() : undefined,
          intakeCompletionReason: decision.shouldFinalize
            ? decision.reason
            : undefined,
          intakeQuestionCount:
            report.intakeStatus === "COLLECTING" ? { increment: 1 } : undefined,
          intakeStatus: decision.shouldFinalize ? "FINALIZED" : undefined,
          missingCriticalFields: decision.missingCriticalFields,
          recommendation: update.recommendation,
          status: decision.shouldFinalize
            ? ReportStatus.READY_FOR_REVIEW
            : undefined,
          summary: update.summary,
          title: update.title,
          version: { increment: 1 },
        },
        where: { id: reportId },
      });
      if (decision.shouldFinalize) {
        await transaction.reportStatusEvent.create({
          data: {
            actorType: MessageSenderType.AI_AGENT,
            fromStatus: report.status,
            note: `Intake AI selesai: ${decision.reason ?? "informasi cukup"}`,
            reportId,
            toStatus: ReportStatus.READY_FOR_REVIEW,
          },
        });
      }
      return report.reporterId;
    });

    if (!reporterId) {
      throw new Error("Laporan tamu tidak mendukung analisis intake pelapor");
    }

    const updated = await findReporterReport(reportId, reporterId);
    if (!updated) {
      throw new Error("Laporan tidak dapat dimuat setelah analisis AI");
    }
    return toReporterDetail(updated);
  }

  async updateLocation(
    reportId: string,
    reporterId: string,
    location: { address?: string; latitude: number; longitude: number }
  ): Promise<ReporterReportDetail> {
    await getOwnedReportOrThrow(reportId, reporterId);
    await prisma.emergencyReport.update({
      data: {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        version: { increment: 1 },
      },
      where: { id: reportId },
    });
    const report = await findReporterReport(reportId, reporterId);
    if (!report) {
      throw new Error("Laporan tidak dapat dimuat setelah lokasi diperbarui");
    }
    return toReporterDetail(report);
  }

  async endSession(
    reportId: string,
    reporterId: string
  ): Promise<ReporterReportDetail> {
    const ownedReport = await getOwnedReportOrThrow(reportId, reporterId);
    const session = await prisma.callSession.findFirst({
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, status: true },
      where: { reportId },
    });
    if (session && session.status !== "ENDED") {
      const endedAt = new Date();
      await prisma.callSession.update({
        data: {
          durationSeconds: Math.max(
            0,
            Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
          ),
          endedAt,
          endReason: "USER_HANGUP",
          status: "ENDED",
        },
        where: { id: session.id },
      });
      await prisma.recordingAsset.updateMany({
        data: {
          finalizedAt: endedAt,
          status: "FINALIZING",
        },
        where: {
          callSessionId: session.id,
          status: "RECORDING",
        },
      });
    }
    if (ownedReport.intakeStatus === "COLLECTING") {
      await prisma.$transaction(async (transaction) => {
        const current = await transaction.emergencyReport.findUniqueOrThrow({
          select: { status: true },
          where: { id: reportId },
        });
        const completedAt = new Date();
        await transaction.emergencyReport.update({
          data: {
            intakeCompletedAt: completedAt,
            intakeCompletionReason: "USER_ENDED",
            intakeStatus: "FINALIZED",
            missingCriticalFields:
              getManualCompletionMissingFields(ownedReport),
            status: ReportStatus.READY_FOR_REVIEW,
            version: { increment: 1 },
          },
          where: { id: reportId },
        });
        await transaction.reportStatusEvent.create({
          data: {
            actorId: reporterId,
            actorType: MessageSenderType.REPORTER,
            fromStatus: current.status,
            note: "Pelapor mengakhiri intake; laporan parsial diteruskan",
            reportId,
            toStatus: ReportStatus.READY_FOR_REVIEW,
          },
        });
      });
    }
    const report = await findReporterReport(reportId, reporterId);
    if (!report) {
      throw new Error("Laporan tidak dapat dimuat setelah sesi berakhir");
    }
    return toReporterDetail(report);
  }

  async appendAcousticSignal(
    input: AppendAcousticSignalInput
  ): Promise<ReporterReportDetail> {
    const ownedReport = await getOwnedReportOrThrow(
      input.reportId,
      input.reporterId
    );
    if (ownedReport.interactionMode !== "SILENT") {
      throw new Error("Sinyal akustik hanya tersedia dalam mode sunyi");
    }
    const session = await prisma.callSession.findFirstOrThrow({
      orderBy: { startedAt: "desc" },
      select: { id: true },
      where: { reportId: input.reportId },
    });
    const shouldFinalize =
      ownedReport.intakeStatus === "COLLECTING" &&
      input.confidence >= 0.9 &&
      (input.code === "GUNSHOT" || input.code === "EXPLOSION");

    await prisma.$transaction(async (transaction) => {
      await transaction.acousticSignal.create({
        data: {
          callSessionId: session.id,
          code: input.code,
          confidence: input.confidence,
          endedAt: input.endedAt,
          modelId: input.modelId,
          modelVersion: input.modelVersion,
          reportId: input.reportId,
          startedAt: input.startedAt,
        },
      });
      if (!shouldFinalize) {
        return;
      }
      const report = await transaction.emergencyReport.findUniqueOrThrow({
        select: { status: true },
        where: { id: input.reportId },
      });
      await transaction.emergencyReport.update({
        data: {
          category: "CRITICAL",
          intakeCompletedAt: new Date(),
          intakeCompletionReason: "ACOUSTIC_TRIGGER",
          intakeStatus: "FINALIZED",
          missingCriticalFields: [
            "INCIDENT",
            "IMMEDIATE_DANGER",
            "PEOPLE_AFFECTED",
            ...(ownedReport.latitude === null || ownedReport.longitude === null
              ? (["LOCATION"] as const)
              : []),
          ],
          status: ReportStatus.READY_FOR_REVIEW,
          summary: `Mode sunyi mendeteksi ${input.code} dengan confidence ${Math.round(input.confidence * 100)}%.`,
          title: "Sinyal bahaya terdeteksi",
          version: { increment: 1 },
        },
        where: { id: input.reportId },
      });
      await transaction.reportStatusEvent.create({
        data: {
          actorType: MessageSenderType.SYSTEM,
          fromStatus: report.status,
          note: `Mode sunyi mendeteksi ${input.code}`,
          reportId: input.reportId,
          toStatus: ReportStatus.READY_FOR_REVIEW,
        },
      });
    });

    const updated = await findReporterReport(input.reportId, input.reporterId);
    if (!updated) {
      throw new Error("Laporan tidak dapat dimuat setelah analisis suara");
    }
    return toReporterDetail(updated);
  }

  async requestCancellation(
    reportId: string,
    reporterId: string,
    reason: string
  ): Promise<ReporterReportDetail> {
    await getOwnedReportOrThrow(reportId, reporterId);
    const pending = await prisma.cancellationRequest.findFirst({
      select: { id: true },
      where: { reportId, status: "PENDING" },
    });
    if (!pending) {
      await prisma.cancellationRequest.create({
        data: {
          reason,
          reportId,
          requestedById: reporterId,
        },
      });
    }
    const report = await findReporterReport(reportId, reporterId);
    if (!report) {
      throw new Error("Laporan tidak dapat dimuat setelah permintaan batal");
    }
    return toReporterDetail(report);
  }

  async acknowledge(
    reportId: string,
    reporterId: string,
    type: ReporterAcknowledgementType
  ): Promise<ReporterReportDetail> {
    await getOwnedReportOrThrow(reportId, reporterId);
    await prisma.reportAcknowledgement.upsert({
      create: {
        reporterId,
        reportId,
        type,
      },
      update: {},
      where: {
        reportId_type: { reportId, type },
      },
    });
    const report = await findReporterReport(reportId, reporterId);
    if (!report) {
      throw new Error("Laporan tidak dapat dimuat setelah konfirmasi");
    }
    return toReporterDetail(report);
  }
}
