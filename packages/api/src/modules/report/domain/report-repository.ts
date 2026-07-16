import type {
  ActiveReportPage,
  ReportDetail,
  ReportMapPoint,
} from "./entities";

export interface ListActiveReportsInput {
  cursor?: string;
  limit: number;
}

export interface ReportRepository {
  findActiveDetail: (reportId: string) => Promise<ReportDetail | null>;
  listActive: (input: ListActiveReportsInput) => Promise<ActiveReportPage>;
  listActiveMapPoints: () => Promise<ReportMapPoint[]>;
}
