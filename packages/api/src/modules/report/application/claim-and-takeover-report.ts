import type { ReportDetail } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class ClaimAndTakeoverReport {
  private readonly repository: ReportRepository;

  constructor(repository: ReportRepository) {
    this.repository = repository;
  }

  execute(reportId: string, operatorId: string): Promise<ReportDetail> {
    return this.repository.claimAndTakeover(reportId, operatorId);
  }
}
