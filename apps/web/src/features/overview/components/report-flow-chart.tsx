import { Badge } from "@siaga-app/ui/components/badge";
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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { DASHBOARD_PERIOD_LABELS, formatChartBucket } from "../content";
import type { DashboardOverview, DashboardPeriod } from "../types";

const CHART_CONFIG = {
  incoming: {
    color: "#d20000",
    label: "Laporan masuk",
  },
  resolved: {
    color: "#1fc16b",
    label: "Laporan selesai",
  },
} satisfies ChartConfig;

const formatDelta = (value: number | null): string =>
  value === null ? "Belum ada pembanding" : `${value >= 0 ? "+" : ""}${value}%`;

export function ReportFlowChart({
  data,
  period,
  summary,
}: {
  data: DashboardOverview["flow"];
  period: DashboardPeriod;
  summary: DashboardOverview["summary"];
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatChartBucket(point.bucketStart, period),
  }));

  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <CardHeader className="border-b py-4">
        <span className="flex flex-wrap items-start justify-between gap-3">
          <span>
            <CardTitle>Arus laporan</CardTitle>
            <CardDescription>
              Laporan masuk dibandingkan laporan selesai pada{" "}
              {DASHBOARD_PERIOD_LABELS[period]}.
            </CardDescription>
          </span>
          <span className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {summary.incomingInPeriod} masuk ·{" "}
              {formatDelta(summary.incomingDeltaPercent)}
            </Badge>
            <Badge variant="outline">
              {summary.resolvedInPeriod} selesai ·{" "}
              {formatDelta(summary.resolvedDeltaPercent)}
            </Badge>
          </span>
        </span>
      </CardHeader>
      <CardContent className="px-3 pt-4 pb-3">
        <ChartContainer
          className="aspect-auto h-72 w-full"
          config={CHART_CONFIG}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ bottom: 4, left: -16, right: 12, top: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              minTickGap={28}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={{ stroke: "var(--border)" }}
            />
            <Line
              dataKey="incoming"
              dot={false}
              stroke="var(--color-incoming)"
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="resolved"
              dot={false}
              stroke="var(--color-resolved)"
              strokeDasharray="5 4"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
