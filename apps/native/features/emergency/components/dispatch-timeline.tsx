import { Text, View } from "react-native";

import {
  DISPATCH_STATUS_CONFIG,
  DISPATCH_TIMELINE_STEPS,
  type DispatchStatusValue,
} from "@/features/emergency/status-content";

interface DispatchTimelineProps {
  status: string | null | undefined;
}

/**
 * Gojek-style step-by-step dispatch status list. Mirrors the step semantics
 * of apps/web/src/features/dispatch/report-dispatch-section.tsx's
 * DispatchTimeline/ActiveDispatchTracker (REQUESTED -> ACKNOWLEDGED ->
 * EN_ROUTE -> ARRIVED -> COMPLETED), without a live map (deferred phase).
 */
export function DispatchTimeline({ status }: DispatchTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <Text className="font-semibold text-[12px] text-red-600">
          {DISPATCH_STATUS_CONFIG.CANCELLED.label}
        </Text>
      </View>
    );
  }

  const activeIndex = status
    ? DISPATCH_TIMELINE_STEPS.indexOf(status as DispatchStatusValue)
    : -1;
  const effectiveIndex = Math.max(activeIndex, 0);

  return (
    <View>
      {DISPATCH_TIMELINE_STEPS.map((step, index) => {
        const isReached = index <= effectiveIndex;
        const isCurrent = index === effectiveIndex;
        const isLast = index === DISPATCH_TIMELINE_STEPS.length - 1;
        const config = DISPATCH_STATUS_CONFIG[step];

        return (
          <View className="flex-row gap-3" key={step}>
            <View className="items-center">
              <View
                className={`size-4 rounded-full border-2 ${
                  isReached
                    ? "border-siaga-primary bg-siaga-primary"
                    : "border-siaga-border bg-siaga-panel"
                }`}
              />
              {isLast ? null : (
                <View
                  className={`w-0.5 flex-1 ${
                    index < effectiveIndex
                      ? "bg-siaga-primary"
                      : "bg-siaga-border"
                  }`}
                />
              )}
            </View>
            <View className={`flex-1 ${isLast ? "" : "pb-6"}`}>
              <Text
                className={`font-semibold text-[13px] ${
                  isReached ? "text-siaga-body" : "text-siaga-muted-strong"
                }`}
              >
                {config.label}
              </Text>
              {isCurrent ? (
                <Text className="mt-1 text-[11px] text-siaga-muted leading-4">
                  {config.progressLabel}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
