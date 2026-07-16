import type { ReportDetail, ReportEditableDetail } from "../domain/entities";
import type { ReportRepository } from "../domain/report-repository";

export class UpdateReportDetail {
  private readonly repository: ReportRepository;

  constructor(repository: ReportRepository) {
    this.repository = repository;
  }

  execute(input: {
    detail: ReportEditableDetail;
    expectedUpdatedAt: Date;
    operatorId: string;
    reportId: string;
  }): Promise<ReportDetail> {
    return this.repository.updateDetail(input);
  }
}
