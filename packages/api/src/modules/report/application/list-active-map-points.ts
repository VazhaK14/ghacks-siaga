import type { ReportMapPoint } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class ListActiveMapPoints {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  execute(): Promise<ReportMapPoint[]> {
    return this.reportRepository.listActiveMapPoints();
  }
}
