import type { DashboardSnapshot } from "./entities";

export interface OverviewRepository {
  getDashboardSnapshot: ({
    previousPeriodStart,
  }: {
    previousPeriodStart: Date;
  }) => Promise<DashboardSnapshot>;
}
