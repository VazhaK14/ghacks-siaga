import type { DispatchRepository } from "../domain/dispatch-repository";
import {
  DispatchApplicationError,
  type DispatchTracking,
} from "../domain/entities";
import {
  getDemoEstimatedArrivalAt,
  toDispatchTracking,
} from "./dispatch-rules";

const DISPATCHABLE_REPORT_STATUSES = new Set([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
  "DISPATCH_PENDING",
]);

const UNIT_PREFIX = {
  AMBULANCE: "AMB",
  FIRE_DEPARTMENT: "DAMKAR",
  OTHER: "UNIT",
  POLICE: "POL",
  SAR: "SAR",
} as const;

const getUnitSuffix = (agencyId: string): string => {
  let checksum = 0;
  for (const character of agencyId) {
    checksum = (checksum + character.charCodeAt(0)) % 90;
  }
  return String(checksum + 10).padStart(2, "0");
};

export class CreateDispatch {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  async execute({
    agencyId,
    notes,
    operatorId,
    reportId,
  }: {
    agencyId: string;
    notes?: string;
    operatorId: string;
    reportId: string;
  }): Promise<DispatchTracking> {
    const context = await this.repository.findReportContext(reportId);
    if (!context) {
      throw new DispatchApplicationError(
        "NOT_FOUND",
        "Laporan tidak ditemukan"
      );
    }
    if (context.activeDispatch) {
      throw new DispatchApplicationError(
        "CONFLICT",
        "Laporan sudah memiliki dispatch aktif"
      );
    }
    if (!DISPATCHABLE_REPORT_STATUSES.has(context.report.status)) {
      throw new DispatchApplicationError(
        "BAD_REQUEST",
        "Status laporan tidak dapat menerima dispatch baru"
      );
    }
    if (context.report.latitude === null || context.report.longitude === null) {
      throw new DispatchApplicationError(
        "BAD_REQUEST",
        "Lokasi laporan belum tersedia"
      );
    }

    const agency = context.agencies.find((item) => item.id === agencyId);
    if (!agency) {
      throw new DispatchApplicationError(
        "NOT_FOUND",
        "Unit respons tidak ditemukan"
      );
    }
    if (agency.availability !== "AVAILABLE") {
      throw new DispatchApplicationError(
        "CONFLICT",
        "Unit respons sedang tidak tersedia"
      );
    }

    const requestedAt = new Date();
    const dispatch = await this.repository.createDispatch({
      agencyId,
      estimatedArrivalAt: getDemoEstimatedArrivalAt(requestedAt),
      notes,
      operatorId,
      reportId,
      unitCode: `${UNIT_PREFIX[agency.type]}-${getUnitSuffix(agency.id)}`,
    });

    return toDispatchTracking(dispatch, requestedAt);
  }
}
