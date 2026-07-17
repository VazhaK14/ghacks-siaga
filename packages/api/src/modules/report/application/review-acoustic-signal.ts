import type { ReportDetail } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class ReviewAcousticSignal {
  private readonly repository: ReportRepository;

  constructor(repository: ReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    signalId: string,
    status: "CONFIRMED" | "REJECTED"
  ): Promise<ReportDetail> {
    return this.repository.reviewAcousticSignal(reportId, signalId, status);
  }
}
