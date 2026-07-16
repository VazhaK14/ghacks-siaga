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

import { UNIT_TYPE_LABELS } from "../content";
import type { DashboardOverview } from "../types";

const CHART_CONFIG = {
  available: {
    color: "#1fc16b",
    label: "Tersedia",
  },
  busy: {
    color: "#ffdb43",
    label: "Sibuk",
  },
  offline: {
    color: "#777777",
    label: "Offline",
  },
} satisfies ChartConfig;

export function UnitReadinessChart({
  data,
}: {
  data: DashboardOverview["unitReadiness"];
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: UNIT_TYPE_LABELS[item.type],
  }));

  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Kesiapan unit</CardTitle>
        <CardDescription>
          Kapasitas unit aktif berdasarkan availability saat ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 py-4">
        {chartData.length === 0 ? (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyTitle>Belum ada unit</EmptyTitle>
              <EmptyDescription>
                Kesiapan akan muncul setelah unit terdaftar.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            className="aspect-auto h-64 w-full"
            config={CHART_CONFIG}
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
                width={72}
              />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="available"
                fill="var(--color-available)"
                radius={[3, 0, 0, 3]}
                stackId="availability"
              />
              <Bar
                dataKey="busy"
                fill="var(--color-busy)"
                stackId="availability"
              />
              <Bar
                dataKey="offline"
                fill="var(--color-offline)"
                radius={[0, 3, 3, 0]}
                stackId="availability"
              />
            </BarChart>
          </ChartContainer>
        )}
        {chartData.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
            {Object.entries(CHART_CONFIG).map(([key, item]) => (
              <span className="flex items-center gap-1.5" key={key}>
                <span
                  aria-hidden
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
