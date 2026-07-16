import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";

import { CATEGORY_CONFIG, REPORT_STATUS_LABELS } from "@/features/map/content";
import { formatDashboardTime } from "../content";
import type { DashboardOverview } from "../types";

export function ActivityFeed({
  activities,
}: {
  activities: DashboardOverview["recentActivity"];
}) {
  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Aktivitas terbaru</CardTitle>
        <CardDescription>
          Perubahan status operasional dari seluruh laporan.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 px-4 py-2">
        {activities.length === 0 ? (
          <Empty className="min-h-52">
            <EmptyHeader>
              <EmptyTitle>Belum ada aktivitas</EmptyTitle>
              <EmptyDescription>
                Perubahan laporan akan muncul secara live.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol>
            {activities.map((activity) => {
              const category = CATEGORY_CONFIG[activity.category];
              const statusLabel =
                REPORT_STATUS_LABELS[
                  activity.toStatus as keyof typeof REPORT_STATUS_LABELS
                ] ?? activity.toStatus.replaceAll("_", " ");
              return (
                <li
                  className="relative border-b py-3 pl-5 last:border-b-0"
                  key={activity.id}
                >
                  <span
                    aria-hidden
                    className={`absolute top-4 left-0 size-2 rounded-full ${category.barClassName}`}
                  />
                  <p className="truncate font-medium text-foreground text-xs">
                    {activity.reportTitle ??
                      `Laporan ${activity.reportId.slice(-6).toUpperCase()}`}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {statusLabel}
                    {activity.note ? ` · ${activity.note}` : ""}
                  </p>
                  <time
                    className="mt-1 block font-mono text-[9px] text-muted-foreground"
                    dateTime={activity.createdAt}
                  >
                    {formatDashboardTime(activity.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
