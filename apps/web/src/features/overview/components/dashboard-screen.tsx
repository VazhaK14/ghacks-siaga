import { Badge } from "@siaga-app/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@siaga-app/ui/components/toggle-group";
import {
  ClipboardCheckIcon,
  RadioTowerIcon,
  SirenIcon,
  TimerIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import { LIVE_STATUS_CONFIG } from "@/features/map/content";
import { useDashboardLiveUpdates, useDashboardOverviewQuery } from "../api";
import {
  DASHBOARD_PERIOD_OPTIONS,
  formatDashboardTime,
  formatResponseTime,
} from "../content";
import type { DashboardPeriod } from "../types";
import { ActivityFeed } from "./activity-feed";
import { AttentionQueue } from "./attention-queue";
import { IncidentBreakdownChart } from "./incident-breakdown-chart";
import { MetricCard } from "./metric-card";
import { ReportFlowChart } from "./report-flow-chart";
import { UnitReadinessChart } from "./unit-readiness-chart";

const DASHBOARD_LOADING_IDS = [
  "metric-active",
  "metric-urgent",
  "metric-response",
  "metric-units",
] as const;

const isDashboardPeriod = (
  value: string | undefined
): value is DashboardPeriod =>
  value === "24H" || value === "7D" || value === "30D";

const formatResponseDelta = (deltaPercent: number | null): string => {
  if (deltaPercent === null) {
    return "Belum cukup data pembanding";
  }
  if (deltaPercent === 0) {
    return "Setara dengan periode sebelumnya";
  }

  const direction = deltaPercent > 0 ? "lebih lambat" : "lebih cepat";
  return `${Math.abs(deltaPercent)}% ${direction} dari periode sebelumnya`;
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_LOADING_IDS.map((id) => (
          <Skeleton className="h-32 rounded-lg" key={id} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <Skeleton className="h-96 rounded-lg xl:col-span-8" />
        <Skeleton className="h-96 rounded-lg xl:col-span-4" />
        <Skeleton className="h-80 rounded-lg xl:col-span-7" />
        <Skeleton className="h-80 rounded-lg xl:col-span-5" />
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const [period, setPeriod] = useState<DashboardPeriod>("24H");
  const dashboardQuery = useDashboardOverviewQuery(period);
  const connectionStatus = useDashboardLiveUpdates();
  const liveStatus = LIVE_STATUS_CONFIG[connectionStatus];
  const handlePeriodChange = useCallback((values: string[]) => {
    const [nextPeriod] = values;
    if (isDashboardPeriod(nextPeriod)) {
      setPeriod(nextPeriod);
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <span>
          <p className="text-muted-foreground text-xs uppercase">
            Command center overview
          </p>
          <h1 className="mt-1 font-extrabold text-3xl text-foreground">
            Dashboard Operasional
          </h1>
          <span className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <Badge variant="outline">
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${liveStatus.dotClassName}`}
              />
              {liveStatus.label}
            </Badge>
            {dashboardQuery.data ? (
              <span>
                Diperbarui{" "}
                {formatDashboardTime(dashboardQuery.data.generatedAt)}
              </span>
            ) : null}
          </span>
        </span>

        <ToggleGroup
          aria-label="Periode dashboard"
          onValueChange={handlePeriodChange}
          spacing={0}
          value={[period]}
          variant="outline"
        >
          {DASHBOARD_PERIOD_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </header>

      {dashboardQuery.isPending ? <DashboardSkeleton /> : null}

      {dashboardQuery.error ? (
        <Empty className="min-h-96 rounded-lg border">
          <EmptyHeader>
            <EmptyTitle>Dashboard tidak dapat dimuat</EmptyTitle>
            <EmptyDescription>{dashboardQuery.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {dashboardQuery.data ? (
        <>
          <section
            aria-label="Ringkasan operasional"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              description={`${dashboardQuery.data.summary.urgentActive} laporan critical/high`}
              icon={SirenIcon}
              label="Laporan aktif"
              tone="neutral"
              value={dashboardQuery.data.summary.activeTotal}
            />
            <MetricCard
              description="Menunggu keputusan operator"
              icon={ClipboardCheckIcon}
              label="Siap ditinjau"
              tone="critical"
              value={dashboardQuery.data.summary.awaitingReview}
            />
            <MetricCard
              description={formatResponseDelta(
                dashboardQuery.data.summary.medianResponseDeltaPercent
              )}
              icon={TimerIcon}
              label="Median respons"
              tone="warning"
              value={formatResponseTime(
                dashboardQuery.data.summary.medianResponseSeconds
              )}
            />
            <MetricCard
              description={`${dashboardQuery.data.summary.totalUnits - dashboardQuery.data.summary.availableUnits} unit sibuk/offline`}
              icon={RadioTowerIcon}
              label="Unit tersedia"
              tone="success"
              value={`${dashboardQuery.data.summary.availableUnits}/${dashboardQuery.data.summary.totalUnits}`}
            />
          </section>

          <section
            aria-label="Arus dan antrean laporan"
            className="grid gap-6 xl:grid-cols-12"
          >
            <div className="min-w-0 xl:col-span-8">
              <ReportFlowChart
                data={dashboardQuery.data.flow}
                period={period}
                summary={dashboardQuery.data.summary}
              />
            </div>
            <div className="min-w-0 xl:col-span-4">
              <AttentionQueue reports={dashboardQuery.data.attentionQueue} />
            </div>
          </section>

          <section
            aria-label="Distribusi insiden dan kesiapan unit"
            className="grid gap-6 xl:grid-cols-12"
          >
            <div className="min-w-0 xl:col-span-7">
              <IncidentBreakdownChart
                data={dashboardQuery.data.incidentBreakdown}
              />
            </div>
            <div className="grid min-w-0 gap-6 xl:col-span-5">
              <UnitReadinessChart data={dashboardQuery.data.unitReadiness} />
              <ActivityFeed activities={dashboardQuery.data.recentActivity} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
