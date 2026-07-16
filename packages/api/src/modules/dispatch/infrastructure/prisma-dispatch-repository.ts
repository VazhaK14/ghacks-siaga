import prisma from "@siaga-app/db";
import {
  DispatchAgencyAvailability,
  DispatchStatus,
  MessageSenderType,
  type DispatchAgencyAvailability as PrismaDispatchAgencyAvailability,
  type DispatchAgencyType as PrismaDispatchAgencyType,
  type DispatchStatus as PrismaDispatchStatus,
  ReportStatus,
} from "@siaga-app/db/enums";
import type {
  CreateDispatchInput,
  DispatchRepository,
  ResolveDispatchInput,
  TransitionDispatchInput,
} from "../domain/dispatch-repository";
import type {
  AgencyBoardRecord,
  DispatchAgency,
  DispatchRecord,
  DispatchReportContext,
} from "../domain/entities";
import { DispatchApplicationError } from "../domain/entities";

const ACTIVE_DISPATCH_STATUSES = [
  DispatchStatus.REQUESTED,
  DispatchStatus.ACKNOWLEDGED,
  DispatchStatus.EN_ROUTE,
  DispatchStatus.ARRIVED,
] satisfies PrismaDispatchStatus[];

interface AgencyRow {
  address: string | null;
  availability: PrismaDispatchAgencyAvailability;
  contactPhone: string | null;
  id: string;
  jurisdiction: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  type: PrismaDispatchAgencyType;
}

interface DispatchRow {
  acknowledgedAt: Date | null;
  agency: AgencyRow | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  dispatchedByOperatorId: string;
  enRouteAt: Date | null;
  estimatedArrivalAt: Date | null;
  id: string;
  notes: string | null;
  report: {
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    title: string | null;
  };
  reportId: string;
  requestedAt: Date;
  status: PrismaDispatchStatus;
  unitCode: string | null;
}

const toAgency = (agency: AgencyRow): DispatchAgency | null => {
  if (agency.latitude === null || agency.longitude === null) {
    return null;
  }

  return {
    ...agency,
    availability: agency.availability,
    latitude: agency.latitude,
    longitude: agency.longitude,
    type: agency.type,
  };
};

const toDispatchRecord = (dispatch: DispatchRow): DispatchRecord => {
  const agency = dispatch.agency ? toAgency(dispatch.agency) : null;
  const { latitude, longitude } = dispatch.report;
  if (!agency || latitude === null || longitude === null) {
    throw new Error("Dispatch tracking requires agency and report coordinates");
  }

  return {
    acknowledgedAt: dispatch.acknowledgedAt,
    agency,
    arrivedAt: dispatch.arrivedAt,
    completedAt: dispatch.completedAt,
    destination: {
      address: dispatch.report.address,
      latitude,
      longitude,
      title: dispatch.report.title,
    },
    dispatchedByOperatorId: dispatch.dispatchedByOperatorId,
    enRouteAt: dispatch.enRouteAt,
    estimatedArrivalAt: dispatch.estimatedArrivalAt,
    id: dispatch.id,
    notes: dispatch.notes,
    reportId: dispatch.reportId,
    requestedAt: dispatch.requestedAt,
    status: dispatch.status,
    unitCode: dispatch.unitCode,
  };
};

const dispatchInclude = {
  agency: true,
  report: {
    select: {
      address: true,
      latitude: true,
      longitude: true,
      title: true,
    },
  },
} as const;

export class PrismaDispatchRepository implements DispatchRepository {
  async findReportContext(
    reportId: string
  ): Promise<DispatchReportContext | null> {
    const [report, agencies] = await Promise.all([
      prisma.emergencyReport.findUnique({
        include: {
          dispatches: {
            include: dispatchInclude,
            orderBy: { requestedAt: "desc" },
            take: 1,
            where: { status: { in: ACTIVE_DISPATCH_STATUSES } },
          },
        },
        where: { id: reportId },
      }),
      prisma.dispatchAgency.findMany({
        orderBy: [{ type: "asc" }, { name: "asc" }],
        where: {
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      }),
    ]);

    if (!report) {
      return null;
    }

    return {
      activeDispatch: report.dispatches[0]
        ? toDispatchRecord(report.dispatches[0])
        : null,
      agencies: agencies.flatMap((agency) => {
        const mappedAgency = toAgency(agency);
        return mappedAgency ? [mappedAgency] : [];
      }),
      report: {
        address: report.address,
        category: report.category,
        id: report.id,
        incidentType: report.incidentType,
        latitude: report.latitude,
        longitude: report.longitude,
        recommendation: report.recommendation,
        status: report.status,
        summary: report.summary,
        title: report.title,
      },
    };
  }

  async createDispatch(input: CreateDispatchInput): Promise<DispatchRecord> {
    const requestedAt = new Date();

    const dispatch = await prisma.$transaction(async (transaction) => {
      const [report, agency, existingDispatch] = await Promise.all([
        transaction.emergencyReport.findUnique({
          include: {
            aiAnalyses: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          where: { id: input.reportId },
        }),
        transaction.dispatchAgency.findUnique({
          where: { id: input.agencyId },
        }),
        transaction.dispatchRequest.findFirst({
          where: {
            reportId: input.reportId,
            status: { in: ACTIVE_DISPATCH_STATUSES },
          },
        }),
      ]);

      if (!(report && agency)) {
        throw new DispatchApplicationError(
          "NOT_FOUND",
          "Laporan atau unit respons tidak ditemukan"
        );
      }
      if (existingDispatch) {
        throw new DispatchApplicationError(
          "CONFLICT",
          "Laporan sudah memiliki dispatch aktif"
        );
      }
      if (agency.availability !== DispatchAgencyAvailability.AVAILABLE) {
        throw new DispatchApplicationError(
          "CONFLICT",
          "Unit respons sedang tidak tersedia"
        );
      }

      const structuredReportSnapshot = {
        address: report.address,
        category: report.category,
        incidentType: report.incidentType,
        latestAnalysis: report.aiAnalyses[0] ?? null,
        latitude: report.latitude,
        longitude: report.longitude,
        recommendation: report.recommendation,
        summary: report.summary,
        title: report.title,
      };

      const createdDispatch = await transaction.dispatchRequest.create({
        data: {
          agencyId: agency.id,
          agencyType: agency.type,
          dispatchedByOperatorId: input.operatorId,
          estimatedArrivalAt: input.estimatedArrivalAt,
          notes: input.notes,
          reportId: report.id,
          requestedAt,
          structuredReportSnapshot,
          unitCode: input.unitCode,
        },
      });

      await transaction.dispatchAgency.update({
        data: { availability: DispatchAgencyAvailability.BUSY },
        where: { id: agency.id },
      });

      if (report.status !== ReportStatus.DISPATCH_PENDING) {
        await transaction.emergencyReport.update({
          data: {
            status: ReportStatus.DISPATCH_PENDING,
            statusHistory: {
              create: {
                actorId: input.operatorId,
                actorType: MessageSenderType.OPERATOR,
                fromStatus: report.status,
                note: "Operator mengirim permintaan dispatch",
                toStatus: ReportStatus.DISPATCH_PENDING,
              },
            },
          },
          where: { id: report.id },
        });
      }

      return transaction.dispatchRequest.findUniqueOrThrow({
        include: dispatchInclude,
        where: { id: createdDispatch.id },
      });
    });

    return toDispatchRecord(dispatch);
  }

  async findDispatchById(dispatchId: string): Promise<DispatchRecord | null> {
    const dispatch = await prisma.dispatchRequest.findUnique({
      include: dispatchInclude,
      where: { id: dispatchId },
    });

    return dispatch ? toDispatchRecord(dispatch) : null;
  }

  async transitionDispatch(
    input: TransitionDispatchInput
  ): Promise<DispatchRecord> {
    const dispatch = await prisma.$transaction(async (transaction) => {
      const currentDispatch = await transaction.dispatchRequest.findUnique({
        include: { report: true },
        where: { id: input.dispatchId },
      });
      if (!currentDispatch) {
        throw new DispatchApplicationError(
          "NOT_FOUND",
          "Dispatch tidak ditemukan"
        );
      }
      if (currentDispatch.status !== input.expectedStatus) {
        return transaction.dispatchRequest.findUniqueOrThrow({
          include: dispatchInclude,
          where: { id: input.dispatchId },
        });
      }

      let timestampData: {
        acknowledgedAt?: Date;
        arrivedAt?: Date;
        enRouteAt?: Date;
      } = {};
      if (input.nextStatus === DispatchStatus.ACKNOWLEDGED) {
        timestampData = { acknowledgedAt: input.at };
      } else if (input.nextStatus === DispatchStatus.EN_ROUTE) {
        timestampData = { enRouteAt: input.at };
      } else if (input.nextStatus === DispatchStatus.ARRIVED) {
        timestampData = { arrivedAt: input.at };
      }

      await transaction.dispatchRequest.update({
        data: {
          ...timestampData,
          status: input.nextStatus as PrismaDispatchStatus,
        },
        where: { id: input.dispatchId },
      });

      const nextReportStatus =
        ReportStatus[input.nextReportStatus as keyof typeof ReportStatus];
      if (
        nextReportStatus &&
        currentDispatch.report.status !== nextReportStatus
      ) {
        await transaction.emergencyReport.update({
          data: {
            status: nextReportStatus,
            statusHistory: {
              create: {
                actorType: MessageSenderType.SYSTEM,
                fromStatus: currentDispatch.report.status,
                note: input.note,
                toStatus: nextReportStatus,
              },
            },
          },
          where: { id: currentDispatch.reportId },
        });
      }

      return transaction.dispatchRequest.findUniqueOrThrow({
        include: dispatchInclude,
        where: { id: input.dispatchId },
      });
    });

    return toDispatchRecord(dispatch);
  }

  async resolveDispatch(input: ResolveDispatchInput): Promise<DispatchRecord> {
    const dispatch = await prisma.$transaction(async (transaction) => {
      const currentDispatch = await transaction.dispatchRequest.findUnique({
        include: { report: true },
        where: { id: input.dispatchId },
      });
      if (!currentDispatch) {
        throw new DispatchApplicationError(
          "NOT_FOUND",
          "Dispatch tidak ditemukan"
        );
      }
      if (currentDispatch.status !== DispatchStatus.ARRIVED) {
        throw new DispatchApplicationError(
          "BAD_REQUEST",
          "Unit respons belum tiba di lokasi"
        );
      }

      await transaction.dispatchRequest.update({
        data: {
          completedAt: input.at,
          status: DispatchStatus.COMPLETED,
        },
        where: { id: input.dispatchId },
      });

      if (currentDispatch.agencyId) {
        await transaction.dispatchAgency.update({
          data: { availability: DispatchAgencyAvailability.AVAILABLE },
          where: { id: currentDispatch.agencyId },
        });
      }

      await transaction.emergencyReport.update({
        data: {
          resolvedAt: input.at,
          status: ReportStatus.RESOLVED,
          statusHistory: {
            create: {
              actorId: input.operatorId,
              actorType: MessageSenderType.OPERATOR,
              fromStatus: currentDispatch.report.status,
              note: "Operator menandai laporan telah terselesaikan",
              toStatus: ReportStatus.RESOLVED,
            },
          },
        },
        where: { id: currentDispatch.reportId },
      });

      return transaction.dispatchRequest.findUniqueOrThrow({
        include: dispatchInclude,
        where: { id: input.dispatchId },
      });
    });

    return toDispatchRecord(dispatch);
  }

  async listAgencyBoard(): Promise<AgencyBoardRecord[]> {
    const agencies = await prisma.dispatchAgency.findMany({
      include: {
        dispatches: {
          include: dispatchInclude,
          orderBy: { requestedAt: "desc" },
          take: 1,
          where: { status: { in: ACTIVE_DISPATCH_STATUSES } },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    return agencies.flatMap((agency) => {
      const mappedAgency = toAgency(agency);
      if (!mappedAgency) {
        return [];
      }

      return [
        {
          activeDispatch: agency.dispatches[0]
            ? toDispatchRecord(agency.dispatches[0])
            : null,
          agency: mappedAgency,
        },
      ];
    });
  }
}
