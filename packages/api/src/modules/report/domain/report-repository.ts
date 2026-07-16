import type {
  ActiveReportPage,
  ArchivedReportDetail,
  ArchivedReportPage,
  ReportCategory,
  ReportDetail,
  ReportEditableDetail,
  ReportMapPoint,
  TerminalReportStatus,
} from "./entities";

export interface ListActiveReportsInput {
  cursor?: string;
  limit: number;
}

export interface ListArchivedReportsInput {
  category?: ReportCategory;
  page: number;
  pageSize: number;
  query?: string;
  status?: TerminalReportStatus;
}

export interface UpdateReportDetailInput {
  detail: ReportEditableDetail;
  expectedUpdatedAt: Date;
  operatorId: string;
  reportId: string;
}

export interface ReportRepository {
  findActiveDetail: (reportId: string) => Promise<ReportDetail | null>;
  findArchivedDetail: (
    reportId: string
  ) => Promise<ArchivedReportDetail | null>;
  listActive: (input: ListActiveReportsInput) => Promise<ActiveReportPage>;
  listActiveMapPoints: () => Promise<ReportMapPoint[]>;
  listArchived: (
    input: ListArchivedReportsInput
  ) => Promise<ArchivedReportPage>;
  updateDetail: (input: UpdateReportDetailInput) => Promise<ReportDetail>;
}
