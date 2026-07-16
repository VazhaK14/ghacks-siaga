import type { ReportDetail } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class GetReportDetail {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  execute(reportId: string): Promise<ReportDetail | null> {
    return this.reportRepository.findActiveDetail(reportId);
  }
}
