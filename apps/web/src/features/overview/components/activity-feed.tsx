import { Card } from "@siaga-app/ui/components/card";
import { cn } from "@siaga-app/ui/lib/utils";

import { activityFeed } from "../content";

export function ActivityFeed() {
  return (
    <Card className="rounded-xl p-5">
      <p className="font-extrabold text-neutral-1000 text-xl">Intake SIAGA</p>
      <div className="mt-4 space-y-3">
        {activityFeed.map((entry) => (
          <div className="flex items-baseline gap-4" key={entry.time}>
            <span className="w-16 shrink-0 text-[10px] text-neutral-700">
              {entry.time}
            </span>
            <span
              className={cn(
                "font-semibold text-[11px]",
                entry.highlighted ? "text-primary-300" : "text-neutral-700"
              )}
            >
              {entry.event}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
