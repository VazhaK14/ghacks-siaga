import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@siaga-app/ui/components/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { INCIDENT_LABELS } from "../content";
import type { DashboardOverview } from "../types";

const CHART_CONFIG = {
  count: {
    color: "#d20000",
    label: "Laporan",
  },
} satisfies ChartConfig;

export function IncidentBreakdownChart({
  data,
}: {
  data: DashboardOverview["incidentBreakdown"];
}) {
  const chartData = data.map((item) => ({
    count: item.count,
    label: INCIDENT_LABELS[item.incidentType],
  }));
  const chartHeight = Math.max(220, chartData.length * 38);

  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Jenis insiden</CardTitle>
        <CardDescription>
          Distribusi laporan masuk pada periode terpilih.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 py-4">
        {chartData.length === 0 ? (
          <Empty className="min-h-56">
            <EmptyHeader>
              <EmptyTitle>Belum ada insiden</EmptyTitle>
              <EmptyDescription>
                Distribusi akan muncul setelah laporan diterima.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            className="aspect-auto w-full"
            config={CHART_CONFIG}
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="label"
                tickLine={false}
                type="category"
                width={116}
              />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
