import prisma from "@siaga-app/db";
import {
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
  TERMINAL_REPORT_STATUSES,
  type TerminalReportStatus,
} from "../domain/entities";
import type {
  ListActiveReportsInput,
  ListArchivedReportsInput,
  ReportRepository,
} from "../domain/report-repository";

const ACTIVE_STATUSES = ACTIVE_REPORT_STATUSES.map(
  (status) => ReportStatus[status]
) satisfies PrismaReportStatus[];

const TERMINAL_STATUSES = TERMINAL_REPORT_STATUSES.map(
  (status) => ReportStatus[status]
) satisfies PrismaReportStatus[];

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

export class PrismaReportRepository implements ReportRepository {
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
    const report = await prisma.emergencyReport.findFirst({
      include: {
        aiAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        assignedOperator: {
          select: { id: true, name: true },
        },
        reporter: {
          include: { reporterProfile: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      where: {
        id: reportId,
        status: { in: ACTIVE_STATUSES },
      },
    });

    if (!report) {
      return null;
    }

    const [latestAnalysis] = report.aiAnalyses;
    const statusHistory = report.statusHistory.map(toStatusHistoryItem);

    return {
      activeChannel: report.activeChannel,
      address: report.address,
      assignedOperator: report.assignedOperator,
      category: report.category,
      contactPhone:
        report.contactPhoneSnapshot ??
        report.reporter.reporterProfile?.phoneNumber ??
        null,
      createdAt: toIsoString(report.createdAt),
      extractedData: report.extractedData,
      handlingMode: report.handlingMode,
      id: report.id,
      incidentType: report.incidentType,
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
      recommendation: report.recommendation,
      reporter: {
        email: report.reporter.email,
        emergencyContactName:
          report.reporter.reporterProfile?.emergencyContactName ?? null,
        emergencyContactPhone:
          report.reporter.reporterProfile?.emergencyContactPhone ?? null,
        id: report.reporter.id,
        name: report.reporter.name,
        phoneNumber: report.reporter.reporterProfile?.phoneNumber ?? null,
      },
      status: toActiveStatus(report.status),
      statusHistory,
      summary: report.summary,
      title: report.title,
      updatedAt: toIsoString(report.updatedAt),
    };
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
      incidentType: report.incidentType,
      reporter: {
        email: report.reporter.email,
        id: report.reporter.id,
        name: report.reporter.name,
        phoneNumber: report.reporter.reporterProfile?.phoneNumber ?? null,
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
          reporter: report.reporter,
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
}
