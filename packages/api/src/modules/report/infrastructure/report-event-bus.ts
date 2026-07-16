import { env } from "@siaga-app/env/server";
import { Redis } from "@upstash/redis";

import type { ReportEventBus } from "../domain/report-live-event";
import { InMemoryReportEventBus } from "./in-memory-report-event-bus";
import { UpstashReportEventBus } from "./upstash-report-event-bus";

let reportEventBus: ReportEventBus | null = null;

export const getReportEventBus = (): ReportEventBus => {
  if (reportEventBus) {
    return reportEventBus;
  }

  const redisUrl = env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    reportEventBus = new UpstashReportEventBus(
      new Redis({
        token: redisToken,
        url: redisUrl,
      })
    );
    return reportEventBus;
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production"
    );
  }

  reportEventBus = new InMemoryReportEventBus();
  return reportEventBus;
};
