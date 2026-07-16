import type { ActiveReportPage } from "../domain/entities";
import type {
  ListActiveReportsInput,
  ReportRepository,
} from "../domain/report-repository";

export class ListActiveReports {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  execute(input: ListActiveReportsInput): Promise<ActiveReportPage> {
    return this.reportRepository.listActive(input);
  }
}
