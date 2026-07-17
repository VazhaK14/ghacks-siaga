import prisma from "@siaga-app/db";
import {
  type DispatchStatus as PrismaDispatchStatus,
  type ReportStatus as PrismaReportStatus,
  ReportStatus,
} from "@siaga-app/db/enums";

import {
  ACTIVE_REPORT_STATUSES,
  type ActiveReportListItem,
  type ActiveReportPage,
  type ActiveReportStatus,
  type ArchivedReportDetail,
  type ArchivedReportPage,
  type ReportDetail,
  type ReportMapPoint,
  type ReportStatusHistoryItem,
  ReportUpdateApplicationError,
  TERMINAL_REPORT_STATUSES,
  type TerminalReportStatus,
} from "../domain/entities";
import type {
  ListActiveReportsInput,
  ListArchivedReportsInput,
  ReportRepository,
  UpdateReportDetailInput,
} from "../domain/report-repository";

const ACTIVE_STATUSES = ACTIVE_REPORT_STATUSES.map(
  (status) => ReportStatus[status]
) satisfies PrismaReportStatus[];

const TERMINAL_STATUSES = TERMINAL_REPORT_STATUSES.map(
  (status) => ReportStatus[status]
) satisfies PrismaReportStatus[];

const EARLY_DISPATCH_STATUSES = [
  "REQUESTED",
  "ACKNOWLEDGED",
] satisfies PrismaDispatchStatus[];

const EDIT_BLOCKED_DISPATCH_STATUSES = [
  "EN_ROUTE",
  "ARRIVED",
  "RETURNING_TO_BASE",
  "RETURNED_TO_BASE",
] satisfies PrismaDispatchStatus[];

const ACTIVE_DISPATCH_STATUSES = [
  ...EARLY_DISPATCH_STATUSES,
  ...EDIT_BLOCKED_DISPATCH_STATUSES,
] satisfies PrismaDispatchStatus[];

const EDIT_BLOCKED_DISPATCH_STATUS_SET = new Set<PrismaDispatchStatus>(
  EDIT_BLOCKED_DISPATCH_STATUSES
);

const reportListSelect = {
  address: true,
  category: true,
  createdAt: true,
  id: true,
  incidentType: true,
  latitude: true,
  longitude: true,
  status: true,
  summary: true,
  title: true,
  updatedAt: true,
} as const;

const reportDetailInclude = {
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
      endedAt: true,
      id: true,
      startedAt: true,
      status: true,
    },
    take: 20,
  },
  aiAnalyses: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
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
    orderBy: { requestedAt: "desc" as const },
    select: { status: true },
    take: 1,
    where: { status: { in: ACTIVE_DISPATCH_STATUSES } },
  },
  imageAttachments: {
    orderBy: { createdAt: "asc" as const },
    select: {
      bytes: true,
      createdAt: true,
      format: true,
      height: true,
      id: true,
      originalFilename: true,
      width: true,
    },
    where: { status: "READY" as const },
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
    take: 100,
  },
  recordings: {
    orderBy: { createdAt: "desc" as const },
    select: { id: true, status: true },
    take: 1,
  },
  reporter: {
    include: { reporterProfile: true },
  },
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
} as const;

const toIsoString = (date: Date): string => date.toISOString();

const toActiveStatus = (status: PrismaReportStatus): ActiveReportStatus =>
  status as ActiveReportStatus;

const toTerminalStatus = (status: PrismaReportStatus): TerminalReportStatus =>
  status as TerminalReportStatus;

const toStatusHistoryItem = (event: {
  actorType: "REPORTER" | "AI_AGENT" | "OPERATOR" | "SYSTEM";
  createdAt: Date;
  fromStatus: PrismaReportStatus | null;
  id: string;
  note: string | null;
  toStatus: PrismaReportStatus;
}): ReportStatusHistoryItem => ({
  actorType: event.actorType,
  createdAt: toIsoString(event.createdAt),
  fromStatus: event.fromStatus,
  id: event.id,
  note: event.note,
  toStatus: event.toStatus,
});

const GUEST_REPORTER_NAME = "Penelepon tamu";
const UNAVAILABLE_REPORTER_EMAIL = "Tidak tersedia";

const toDispatchReporterSnapshot = (report: {
  contactPhoneSnapshot: string | null;
  id: string;
  reporter: {
    email: string;
    id: string;
    name: string;
    reporterProfile: {
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      phoneNumber: string | null;
    } | null;
  } | null;
}) => {
  if (!report.reporter) {
    return {
      email: UNAVAILABLE_REPORTER_EMAIL,
      emergencyContactName: null,
      emergencyContactPhone: null,
      id: `guest:${report.id}`,
      name: GUEST_REPORTER_NAME,
      phoneNumber: report.contactPhoneSnapshot,
    };
  }
  const { reporter } = report;
  return {
    email: reporter.email,
    emergencyContactName:
      reporter.reporterProfile?.emergencyContactName ?? null,
    emergencyContactPhone:
      reporter.reporterProfile?.emergencyContactPhone ?? null,
    id: reporter.id,
    name: reporter.name,
    phoneNumber:
      report.contactPhoneSnapshot ??
      reporter.reporterProfile?.phoneNumber ??
      null,
  };
};

type ReportDetailRow =
  Awaited<ReturnType<typeof findActiveDetailRow>> extends infer Result
    ? NonNullable<Result>
    : never;

const findActiveDetailRow = (reportId: string) =>
  prisma.emergencyReport.findFirst({
    include: reportDetailInclude,
    where: {
      id: reportId,
      status: { in: ACTIVE_STATUSES },
    },
  });

const toReportDetail = (report: ReportDetailRow): ReportDetail => {
  const [latestAnalysis] = report.aiAnalyses;
  const [activeDispatch] = report.dispatches;
  const [callSession] = report.callSessions;
  const [cancellationRequest] = report.cancellationRequests;
  const [recording] = report.recordings;
  const dispatchBlocksChanges =
    activeDispatch?.status !== undefined &&
    EDIT_BLOCKED_DISPATCH_STATUS_SET.has(activeDispatch.status);
  const blockReason = dispatchBlocksChanges
    ? "Laporan tidak dapat diubah atau ditutup setelah unit mulai menuju lokasi"
    : null;

  return {
    acknowledgements: report.acknowledgements.map(({ type }) => type),
    acousticSignals: report.acousticSignals.map((signal) => ({
      ...signal,
      createdAt: toIsoString(signal.createdAt),
      endedAt: toIsoString(signal.endedAt),
      startedAt: toIsoString(signal.startedAt),
    })),
    activeChannel: report.activeChannel,
    address: report.address,
    assignedOperator: report.assignedOperator,
    callSession: callSession ?? null,
    canClose: !dispatchBlocksChanges,
    cancellationRequest: cancellationRequest
      ? {
          createdAt: toIsoString(cancellationRequest.createdAt),
          reason: cancellationRequest.reason,
          status: cancellationRequest.status,
        }
      : null,
    canEdit: !dispatchBlocksChanges,
    canTakeOver: report.assignedOperatorId === null && !dispatchBlocksChanges,
    category: report.category,
    closeBlockReason: blockReason,
    contactPhone:
      report.contactPhoneSnapshot ??
      report.reporter?.reporterProfile?.phoneNumber ??
      null,
    createdAt: toIsoString(report.createdAt),
    editBlockReason: blockReason,
    extractedData: report.extractedData,
    handlingMode: report.handlingMode,
    id: report.id,
    imageAttachments: report.imageAttachments.flatMap((attachment) =>
      attachment.bytes !== null && attachment.format !== null
        ? [
            {
              ...attachment,
              bytes: attachment.bytes,
              createdAt: toIsoString(attachment.createdAt),
              format: attachment.format,
            },
          ]
        : []
    ),
    incidentType: report.incidentType,
    intakeCompletedAt: report.intakeCompletedAt
      ? toIsoString(report.intakeCompletedAt)
      : null,
    intakeCompletionReason: report.intakeCompletionReason,
    intakeQuestionCount: report.intakeQuestionCount,
    intakeStatus: report.intakeStatus,
    interactionMode: report.interactionMode,
    latestAnalysis: latestAnalysis
      ? {
          category: latestAnalysis.category,
          confidenceScore: latestAnalysis.confidenceScore,
          createdAt: toIsoString(latestAnalysis.createdAt),
          incidentType: latestAnalysis.incidentType,
          modelVersion: latestAnalysis.modelVersion,
          recommendation: latestAnalysis.recommendation,
          summary: latestAnalysis.summary,
        }
      : null,
    latitude: report.latitude,
    longitude: report.longitude,
    messages: report.messages.map((message) => ({
      ...message,
      createdAt: toIsoString(message.createdAt),
    })),
    missingCriticalFields: Array.isArray(report.missingCriticalFields)
      ? report.missingCriticalFields.filter(
          (field): field is string => typeof field === "string"
        )
      : [],
    recommendation: report.recommendation,
    recording: recording ?? null,
    reporter: report.reporter
      ? {
          email: report.reporter.email,
          emergencyContactName:
            report.reporter.reporterProfile?.emergencyContactName ?? null,
          emergencyContactPhone:
            report.reporter.reporterProfile?.emergencyContactPhone ?? null,
          id: report.reporter.id,
          isGuest: false,
          name: report.reporter.name,
          phoneNumber: report.reporter.reporterProfile?.phoneNumber ?? null,
        }
      : {
          email: UNAVAILABLE_REPORTER_EMAIL,
          emergencyContactName: null,
          emergencyContactPhone: null,
          id: `guest:${report.id}`,
          isGuest: true,
          name: GUEST_REPORTER_NAME,
          phoneNumber: null,
        },
    responderPreference: report.responderPreference,
    status: toActiveStatus(report.status),
    statusHistory: report.statusHistory.map(toStatusHistoryItem),
    summary: report.summary,
    takeoverBlockReason:
      report.assignedOperatorId === null
        ? blockReason
        : `Laporan sudah ditangani ${report.assignedOperator?.name ?? "operator lain"}`,
    title: report.title,
    updatedAt: toIsoString(report.updatedAt),
  };
};

const isPrismaConflict = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return error.code === "P2002" || error.code === "P2034";
};

export class PrismaReportRepository implements ReportRepository {
  async reviewAcousticSignal(
    reportId: string,
    signalId: string,
    status: "CONFIRMED" | "REJECTED"
  ): Promise<ReportDetail> {
    const updated = await prisma.acousticSignal.updateMany({
      data: { status },
      where: { id: signalId, reportId },
    });
    if (updated.count !== 1) {
      throw new ReportUpdateApplicationError(
        "NOT_FOUND",
        "Sinyal akustik tidak ditemukan"
      );
    }
    const detail = await this.findActiveDetail(reportId);
    if (!detail) {
      throw new ReportUpdateApplicationError(
        "NOT_FOUND",
        "Laporan aktif tidak ditemukan"
      );
    }
    return detail;
  }

  async claimAndTakeover(
    reportId: string,
    operatorId: string
  ): Promise<ReportDetail> {
    try {
      await prisma.$transaction(async (transaction) => {
        const report = await transaction.emergencyReport.findFirst({
          select: {
            assignedOperatorId: true,
            handlingMode: true,
          },
          where: {
            id: reportId,
            status: { in: ACTIVE_STATUSES },
          },
        });
        if (!report) {
          throw new ReportUpdateApplicationError(
            "NOT_FOUND",
            "Laporan aktif tidak ditemukan"
          );
        }
        if (
          report.assignedOperatorId !== null &&
          report.assignedOperatorId !== operatorId
        ) {
          throw new ReportUpdateApplicationError(
            "CONFLICT",
            "Laporan sudah diambil alih operator lain"
          );
        }
        if (report.assignedOperatorId === operatorId) {
          return;
        }

        const claimed = await transaction.emergencyReport.updateMany({
          data: {
            assignedOperatorId: operatorId,
            handlingMode: "HUMAN",
            version: { increment: 1 },
          },
          where: {
            assignedOperatorId: null,
            id: reportId,
            status: { in: ACTIVE_STATUSES },
          },
        });
        if (claimed.count !== 1) {
          throw new ReportUpdateApplicationError(
            "CONFLICT",
            "Laporan sudah diambil alih operator lain"
          );
        }
        await transaction.handoffEvent.create({
          data: {
            fromMode: report.handlingMode,
            operatorId,
            reason: "Operator mengambil alih laporan",
            reportId,
            toMode: "HUMAN",
          },
        });
      });
    } catch (error) {
      if (error instanceof ReportUpdateApplicationError) {
        throw error;
      }
      if (isPrismaConflict(error)) {
        throw ReportUpdateApplicationError.withCause(
          "CONFLICT",
          "Laporan sudah diambil alih operator lain",
          error
        );
      }
      throw error;
    }

    const detail = await this.findActiveDetail(reportId);
    if (!detail) {
      throw new ReportUpdateApplicationError(
        "NOT_FOUND",
        "Laporan aktif tidak ditemukan"
      );
    }
    return detail;
  }

  async listActive({
    cursor,
    limit,
  }: ListActiveReportsInput): Promise<ActiveReportPage> {
    const [reports, activeCount] = await Promise.all([
      prisma.emergencyReport.findMany({
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ category: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        select: reportListSelect,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        where: { status: { in: ACTIVE_STATUSES } },
      }),
      prisma.emergencyReport.count({
        where: { status: { in: ACTIVE_STATUSES } },
      }),
    ]);

    const hasNextPage = reports.length > limit;
    const pageReports = hasNextPage ? reports.slice(0, limit) : reports;
    const items: ActiveReportListItem[] = pageReports.map((report) => ({
      ...report,
      createdAt: toIsoString(report.createdAt),
      status: toActiveStatus(report.status),
      updatedAt: toIsoString(report.updatedAt),
    }));

    return {
      activeCount,
      items,
      nextCursor: hasNextPage ? (pageReports.at(-1)?.id ?? null) : null,
    };
  }

  async findActiveDetail(reportId: string): Promise<ReportDetail | null> {
    const report = await findActiveDetailRow(reportId);
    return report ? toReportDetail(report) : null;
  }

  async findArchivedDetail(
    reportId: string
  ): Promise<ArchivedReportDetail | null> {
    const report = await prisma.emergencyReport.findFirst({
      include: {
        assignedOperator: {
          select: { id: true, name: true },
        },
        dispatches: {
          include: {
            agency: {
              select: { name: true, type: true },
            },
            dispatchedByOperator: {
              select: { id: true, name: true },
            },
          },
          orderBy: { requestedAt: "desc" },
        },
        imageAttachments: {
          orderBy: { createdAt: "asc" },
          select: {
            bytes: true,
            createdAt: true,
            format: true,
            height: true,
            id: true,
            originalFilename: true,
            width: true,
          },
          where: { status: "READY" },
        },
        reporter: {
          include: { reporterProfile: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      where: {
        id: reportId,
        status: { in: TERMINAL_STATUSES },
      },
    });

    if (!report) {
      return null;
    }

    return {
      address: report.address,
      assignedOperator: report.assignedOperator,
      category: report.category,
      closedAt: report.closedAt ? toIsoString(report.closedAt) : null,
      closureNote: report.closureNote,
      closureReason: report.closureReason,
      createdAt: toIsoString(report.createdAt),
      dispatches: report.dispatches.map((dispatch) => ({
        acknowledgedAt: dispatch.acknowledgedAt
          ? toIsoString(dispatch.acknowledgedAt)
          : null,
        agency: dispatch.agency,
        arrivedAt: dispatch.arrivedAt ? toIsoString(dispatch.arrivedAt) : null,
        completedAt: dispatch.completedAt
          ? toIsoString(dispatch.completedAt)
          : null,
        dispatchedByOperator: dispatch.dispatchedByOperator,
        enRouteAt: dispatch.enRouteAt ? toIsoString(dispatch.enRouteAt) : null,
        id: dispatch.id,
        requestedAt: toIsoString(dispatch.requestedAt),
        status: dispatch.status,
        unitCode: dispatch.unitCode,
      })),
      id: report.id,
      imageAttachments: report.imageAttachments.flatMap((attachment) =>
        attachment.bytes !== null && attachment.format !== null
          ? [
              {
                ...attachment,
                bytes: attachment.bytes,
                createdAt: toIsoString(attachment.createdAt),
                format: attachment.format,
              },
            ]
          : []
      ),
      incidentType: report.incidentType,
      reporter: report.reporter
        ? {
            email: report.reporter.email,
            id: report.reporter.id,
            isGuest: false,
            name: report.reporter.name,
            phoneNumber: report.reporter.reporterProfile?.phoneNumber ?? null,
          }
        : {
            email: UNAVAILABLE_REPORTER_EMAIL,
            id: `guest:${report.id}`,
            isGuest: true,
            name: GUEST_REPORTER_NAME,
            phoneNumber: null,
          },
      resolvedAt: report.resolvedAt ? toIsoString(report.resolvedAt) : null,
      status: toTerminalStatus(report.status),
      statusHistory: report.statusHistory.map(toStatusHistoryItem),
      summary: report.summary,
      terminalAt: toIsoString(
        report.resolvedAt ?? report.closedAt ?? report.updatedAt
      ),
      title: report.title,
    };
  }

  async listArchived({
    category,
    page,
    pageSize,
    query,
    status,
  }: ListArchivedReportsInput): Promise<ArchivedReportPage> {
    const normalizedQuery = query?.trim();
    const where = {
      category,
      OR: normalizedQuery
        ? [
            {
              title: {
                contains: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
            {
              address: {
                contains: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
            {
              reporter: {
                name: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
            },
          ]
        : undefined,
      status: status ? ReportStatus[status] : { in: TERMINAL_STATUSES },
    };
    const [reports, total] = await Promise.all([
      prisma.emergencyReport.findMany({
        include: {
          assignedOperator: {
            select: { id: true, name: true },
          },
          dispatches: {
            include: {
              agency: {
                select: { name: true },
              },
            },
            orderBy: { requestedAt: "desc" },
            take: 1,
          },
          reporter: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
      prisma.emergencyReport.count({ where }),
    ]);

    return {
      items: reports.map((report) => {
        const [latestDispatch] = report.dispatches;
        return {
          address: report.address,
          assignedOperator: report.assignedOperator,
          category: report.category,
          createdAt: toIsoString(report.createdAt),
          id: report.id,
          incidentType: report.incidentType,
          latestDispatch: latestDispatch
            ? {
                agencyName: latestDispatch.agency?.name ?? null,
                status: latestDispatch.status,
                unitCode: latestDispatch.unitCode,
              }
            : null,
          reporter: report.reporter
            ? { ...report.reporter, isGuest: false }
            : {
                id: `guest:${report.id}`,
                isGuest: true,
                name: GUEST_REPORTER_NAME,
              },
          status: toTerminalStatus(report.status),
          summary: report.summary,
          terminalAt: toIsoString(
            report.resolvedAt ?? report.closedAt ?? report.updatedAt
          ),
          title: report.title,
        };
      }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async listActiveMapPoints(): Promise<ReportMapPoint[]> {
    const reports = await prisma.emergencyReport.findMany({
      orderBy: [{ category: "desc" }, { createdAt: "desc" }],
      select: {
        category: true,
        id: true,
        latitude: true,
        longitude: true,
        status: true,
        title: true,
        updatedAt: true,
      },
      where: {
        latitude: { not: null },
        longitude: { not: null },
        status: { in: ACTIVE_STATUSES },
      },
    });

    return reports.flatMap((report) => {
      if (report.latitude === null || report.longitude === null) {
        return [];
      }

      return [
        {
          category: report.category,
          id: report.id,
          latitude: report.latitude,
          longitude: report.longitude,
          status: toActiveStatus(report.status),
          title: report.title,
          updatedAt: toIsoString(report.updatedAt),
        },
      ];
    });
  }

  async updateDetail(input: UpdateReportDetailInput): Promise<ReportDetail> {
    try {
      await prisma.$transaction(
        async (transaction) => {
          const report = await transaction.emergencyReport.findFirst({
            include: {
              aiAnalyses: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              dispatches: {
                orderBy: { requestedAt: "desc" },
                take: 1,
                where: { status: { in: ACTIVE_DISPATCH_STATUSES } },
              },
              reporter: {
                include: { reporterProfile: true },
              },
            },
            where: {
              id: input.reportId,
              status: { in: ACTIVE_STATUSES },
            },
          });
          if (!report) {
            throw new ReportUpdateApplicationError(
              "NOT_FOUND",
              "Laporan aktif tidak ditemukan"
            );
          }

          const [activeDispatch] = report.dispatches;
          if (
            activeDispatch &&
            EDIT_BLOCKED_DISPATCH_STATUS_SET.has(activeDispatch.status)
          ) {
            throw new ReportUpdateApplicationError(
              "PRECONDITION_FAILED",
              "Laporan tidak dapat diubah setelah unit mulai menuju lokasi"
            );
          }

          const updated = await transaction.emergencyReport.updateMany({
            data: {
              address: input.detail.address,
              category: input.detail.category,
              extractedData: input.detail.extractedData ?? undefined,
              incidentType: input.detail.incidentType,
              latitude: input.detail.latitude,
              longitude: input.detail.longitude,
              recommendation: input.detail.recommendation,
              summary: input.detail.summary,
              title: input.detail.title,
            },
            where: {
              id: input.reportId,
              status: { in: ACTIVE_STATUSES },
              updatedAt: input.expectedUpdatedAt,
            },
          });
          if (updated.count !== 1) {
            throw new ReportUpdateApplicationError(
              "CONFLICT",
              "Detail laporan telah diubah oleh operator atau proses lain"
            );
          }

          if (activeDispatch) {
            const [latestAnalysis] = report.aiAnalyses;
            const snapshot = {
              latestAnalysis: latestAnalysis
                ? {
                    category: latestAnalysis.category,
                    confidenceScore: latestAnalysis.confidenceScore,
                    createdAt: latestAnalysis.createdAt.toISOString(),
                    incidentType: latestAnalysis.incidentType,
                    modelVersion: latestAnalysis.modelVersion,
                    recommendation: latestAnalysis.recommendation,
                    summary: latestAnalysis.summary,
                  }
                : null,
              location: {
                address: input.detail.address,
                latitude: input.detail.latitude,
                longitude: input.detail.longitude,
              },
              report: {
                category: input.detail.category,
                extractedData: input.detail.extractedData,
                incidentType: input.detail.incidentType,
                recommendation: input.detail.recommendation,
                summary: input.detail.summary,
                title: input.detail.title,
              },
              reporter: toDispatchReporterSnapshot(report),
            };
            const dispatchUpdated =
              await transaction.dispatchRequest.updateMany({
                data: { structuredReportSnapshot: snapshot },
                where: {
                  id: activeDispatch.id,
                  status: { in: EARLY_DISPATCH_STATUSES },
                },
              });
            if (dispatchUpdated.count !== 1) {
              throw new ReportUpdateApplicationError(
                "CONFLICT",
                "Dispatch bergerak ke tahap berikutnya saat laporan disimpan"
              );
            }
          }
        },
        { isolationLevel: "Serializable" }
      );

      const detail = await this.findActiveDetail(input.reportId);
      if (!detail) {
        throw new ReportUpdateApplicationError(
          "NOT_FOUND",
          "Laporan aktif tidak ditemukan setelah diperbarui"
        );
      }
      return detail;
    } catch (error) {
      if (isPrismaConflict(error)) {
        throw ReportUpdateApplicationError.withCause(
          "CONFLICT",
          "Detail laporan telah diubah oleh proses lain",
          error
        );
      }
      throw error;
    }
  }
}
