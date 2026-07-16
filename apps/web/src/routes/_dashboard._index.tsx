import { Card } from "@siaga-app/ui/components/card";

import { ActivityFeed } from "@/features/overview/components/activity-feed";
import { MapPanel } from "@/features/overview/components/map-panel";
import { MetricCard } from "@/features/overview/components/metric-card";
import { TicketCard } from "@/features/overview/components/ticket-card";
import { metrics, tickets } from "@/features/overview/content";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function DashboardOverview() {
  return (
    <div>
      <h1 className="font-extrabold text-3xl text-neutral-1000">Dashboard</h1>

      <div className="mt-6 grid grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="rounded-xl p-5">
          <p className="font-extrabold text-neutral-1000 text-xl">
            Ticket siap ditangani
          </p>
          <div className="mt-4 space-y-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <MapPanel />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
