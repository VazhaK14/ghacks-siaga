import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { cn } from "@siaga-app/ui/lib/utils";
import { CheckIcon } from "lucide-react";

import {
  DISPATCH_STATUS_CONFIG,
  DISPATCH_TIMELINE_STEPS,
  type DispatchStatusValue,
} from "../status-content";

interface DispatchTimelineProps {
  status: string | null | undefined;
}

const isDispatchStatus = (status: string): status is DispatchStatusValue =>
  status in DISPATCH_STATUS_CONFIG;

export const DispatchTimeline = ({ status }: DispatchTimelineProps) => {
  if (status === "CANCELLED") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {DISPATCH_STATUS_CONFIG.CANCELLED.progressLabel}
        </AlertDescription>
      </Alert>
    );
  }

  const activeIndex =
    status && isDispatchStatus(status)
      ? DISPATCH_TIMELINE_STEPS.indexOf(status)
      : -1;
  const effectiveIndex = Math.max(activeIndex, 0);

  return (
    <ol aria-label="Perjalanan unit bantuan" className="flex flex-col">
      {DISPATCH_TIMELINE_STEPS.map((step, index) => {
        const isReached = index <= effectiveIndex;
        const isCurrent = index === effectiveIndex;
        const isLast = index === DISPATCH_TIMELINE_STEPS.length - 1;
        const config = DISPATCH_STATUS_CONFIG[step];
        return (
          <li className="flex gap-3" key={step}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2",
                  isReached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                )}
              >
                {isReached ? (
                  <CheckIcon aria-hidden="true" className="size-3" />
                ) : null}
              </span>
              {isLast ? null : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "min-h-8 w-0.5 flex-1",
                    index < effectiveIndex ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className={cn("flex-1", !isLast && "pb-6")}>
              <p
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "font-semibold text-sm",
                  isReached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {config.label}
              </p>
              {isCurrent ? (
                <p className="mt-1 text-muted-foreground text-xs">
                  {config.progressLabel}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
