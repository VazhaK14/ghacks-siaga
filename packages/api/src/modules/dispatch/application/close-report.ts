import type { DispatchRepository } from "../domain/dispatch-repository";
import type {
  CloseReportResult,
  ReportClosureReason,
} from "../domain/entities";

export class CloseReport {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  execute(input: {
    note?: string;
    operatorId: string;
    reason: ReportClosureReason;
    reportId: string;
  }): Promise<CloseReportResult> {
    return this.repository.closeReport(input);
  }
}
