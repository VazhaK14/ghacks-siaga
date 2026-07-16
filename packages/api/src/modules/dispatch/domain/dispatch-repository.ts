import type {
  AgencyBoardRecord,
  CloseReportResult,
  DispatchRecord,
  DispatchReportContext,
  ReportClosureReason,
} from "./entities";

export interface CreateDispatchInput {
  agencyId: string;
  estimatedArrivalAt: Date;
  notes?: string;
  operatorId: string;
  reportId: string;
  unitCode: string;
}

export interface TransitionDispatchInput {
  at: Date;
  dispatchId: string;
  estimatedReturnAt?: Date;
  expectedStatus: DispatchRecord["status"];
  nextReportStatus: string | null;
  nextStatus: DispatchRecord["status"];
  note: string;
}

export interface ResolveDispatchInput {
  at: Date;
  dispatchId: string;
  operatorId: string;
}

export interface CloseReportInput {
  note?: string;
  operatorId: string;
  reason: ReportClosureReason;
  reportId: string;
}

export interface DispatchRepository {
  closeReport: (input: CloseReportInput) => Promise<CloseReportResult>;
  createDispatch: (input: CreateDispatchInput) => Promise<DispatchRecord>;
  findDispatchById: (dispatchId: string) => Promise<DispatchRecord | null>;
  findReportContext: (
    reportId: string
  ) => Promise<DispatchReportContext | null>;
  listAgencyBoard: () => Promise<AgencyBoardRecord[]>;
  resolveDispatch: (input: ResolveDispatchInput) => Promise<DispatchRecord>;
  transitionDispatch: (
    input: TransitionDispatchInput
  ) => Promise<DispatchRecord>;
}
