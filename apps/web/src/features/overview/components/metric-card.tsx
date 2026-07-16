import { Card } from "@siaga-app/ui/components/card";

import type { Metric } from "../content";

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card className="rounded-xl p-5">
      <div className="flex items-center gap-3">
        <span className={`size-2.5 shrink-0 rounded-full ${metric.dot}`} />
        <span className="font-extrabold text-2xl text-neutral-1000">
          {metric.value}
        </span>
      </div>
      <p className="mt-3 text-[10px] text-neutral-700">{metric.label}</p>
    </Card>
  );
}
