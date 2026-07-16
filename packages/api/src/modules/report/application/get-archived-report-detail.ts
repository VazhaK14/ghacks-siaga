import type { ArchivedReportDetail } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class GetArchivedReportDetail {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  execute(reportId: string): Promise<ArchivedReportDetail | null> {
    return this.reportRepository.findArchivedDetail(reportId);
  }
}
