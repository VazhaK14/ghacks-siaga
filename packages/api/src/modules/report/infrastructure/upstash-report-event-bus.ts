import type { Redis } from "@upstash/redis";

import {
  parseReportLiveEvent,
  REPORT_LIVE_CHANNEL,
  type ReportEventBus,
  type ReportLiveEvent,
  type ReportLiveEventListener,
} from "../domain/report-live-event";

export class UpstashReportEventBus implements ReportEventBus {
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  publish = async (event: ReportLiveEvent): Promise<void> => {
    await this.redis.publish(REPORT_LIVE_CHANNEL, event);
  };

  subscribe = (
    listener: ReportLiveEventListener,
    onError?: (error: Error) => void
  ): (() => Promise<void>) => {
    const subscriber = this.redis.subscribe<unknown>(REPORT_LIVE_CHANNEL);

    subscriber.on("message", ({ message }) => {
      const event = parseReportLiveEvent(message);
      if (event) {
        return listener(event).catch((error: unknown) => {
          onError?.(
            error instanceof Error
              ? error
              : new Error("Report event listener failed")
          );
        });
      }
    });

    subscriber.on("error", (error) => {
      onError?.(error);
    });

    return async () => {
      subscriber.removeAllListeners();
      await subscriber.unsubscribe();
    };
  };
}
