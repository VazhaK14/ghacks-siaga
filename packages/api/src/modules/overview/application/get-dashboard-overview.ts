import type { DashboardOverview, DashboardPeriod } from "../domain/entities";
import type { OverviewRepository } from "../domain/overview-repository";
import {
  buildDashboardOverview,
  getDashboardPeriodWindow,
} from "./dashboard-rules";

export class GetDashboardOverview {
  private readonly repository: OverviewRepository;

  constructor(repository: OverviewRepository) {
    this.repository = repository;
  }

  async execute(
    period: DashboardPeriod,
    now = new Date()
  ): Promise<DashboardOverview> {
    const { previousPeriodStart } = getDashboardPeriodWindow(period, now);
    const snapshot = await this.repository.getDashboardSnapshot({
      previousPeriodStart,
    });

    return buildDashboardOverview({ now, period, snapshot });
  }
}
