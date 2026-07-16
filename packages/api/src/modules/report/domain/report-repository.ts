import type {
  ActiveReportPage,
  ArchivedReportDetail,
  ArchivedReportPage,
  ReportCategory,
  ReportDetail,
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
}
