import type { ArchivedReportPage } from "../domain/entities";
import type {
  ListArchivedReportsInput,
  ReportRepository,
} from "../domain/report-repository";

export class ListArchivedReports {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  execute(input: ListArchivedReportsInput): Promise<ArchivedReportPage> {
    return this.reportRepository.listArchived(input);
  }
}
