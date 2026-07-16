import type { DispatchRepository } from "../domain/dispatch-repository";
import type { ReportDispatchOverview } from "../domain/entities";
import {
  buildAgencyRecommendations,
  toDispatchTracking,
} from "./dispatch-rules";

export class GetReportDispatch {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  async execute(reportId: string): Promise<ReportDispatchOverview | null> {
    const context = await this.repository.findReportContext(reportId);
    if (!context) {
      return null;
    }

    const { latitude, longitude } = context.report;
    const recommendations =
      latitude === null || longitude === null
        ? []
        : buildAgencyRecommendations({
            agencies: context.agencies,
            incidentType: context.report.incidentType,
            latitude,
            longitude,
          });

    return {
      activeDispatch: context.activeDispatch
        ? toDispatchTracking(context.activeDispatch)
        : null,
      incidentType: context.report.incidentType,
      recommendations,
      reportId,
    };
  }
}
