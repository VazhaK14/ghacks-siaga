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
  type ReportDetail,
  type ReportMapPoint,
  type ReportStatusHistoryItem,
} from "../domain/entities";
import type {
  ListActiveReportsInput,
  ReportRepository,
} from "../domain/report-repository";

const ACTIVE_STATUSES = ACTIVE_REPORT_STATUSES.map(
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
    const statusHistory: ReportStatusHistoryItem[] = report.statusHistory.map(
      (event) => ({
        actorType: event.actorType,
        createdAt: toIsoString(event.createdAt),
        fromStatus: event.fromStatus,
        id: event.id,
        note: event.note,
        toStatus: event.toStatus,
      })
    );

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
