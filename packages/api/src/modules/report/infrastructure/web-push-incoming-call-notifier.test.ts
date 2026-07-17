import { describe, expect, test } from "bun:test";

import type { PushDeliveryResult } from "../../push/domain/entities";
import type { PushGateway } from "../../push/domain/push-gateway";
import type { PushSubscriptionRepository } from "../../push/domain/push-repository";
import { WebPushIncomingCallNotifier } from "./web-push-incoming-call-notifier";

const SUBSCRIPTION = {
  auth: "auth",
  endpoint: "https://push.example/subscription",
  expirationTime: null,
  id: "subscription-id",
  p256dh: "p256dh",
  userAgent: "test",
};

const createRepository = (
  subscriptions = [SUBSCRIPTION]
): {
  deletedEndpoints: string[];
  repository: PushSubscriptionRepository;
} => {
  const deletedEndpoints: string[] = [];
  return {
    deletedEndpoints,
    repository: {
      deleteByEndpoint: () => Promise.resolve(),
      deleteExpired: (endpoint) => {
        deletedEndpoints.push(endpoint);
        return Promise.resolve();
      },
      findReportContext: () =>
        Promise.resolve({
          reportId: "report-id",
          status: "READY_FOR_REVIEW",
          subscriptions,
          title: "Laporan",
        }),
      upsert: () => Promise.resolve(),
    },
  };
};

const createGateway = (result: PushDeliveryResult): PushGateway => ({
  send: () => Promise.resolve(result),
});

const notify = (notifier: WebPushIncomingCallNotifier) =>
  notifier.notify({
    callSessionId: "call-session-id",
    reportId: "report-id",
    reportTitle: null,
  });

describe("WebPushIncomingCallNotifier", () => {
  test("reports unavailable when the reporter has no subscription", async () => {
    const { repository } = createRepository([]);
    const notifier = new WebPushIncomingCallNotifier(
      repository,
      createGateway("delivered")
    );

    const result = await notify(notifier);

    expect(result.status).toBe("UNAVAILABLE");
    expect(result.message).toContain("belum mengaktifkan notifikasi");
  });

  test("reports delivered when at least one device receives the push", async () => {
    const { repository } = createRepository();
    const notifier = new WebPushIncomingCallNotifier(
      repository,
      createGateway("delivered")
    );

    const result = await notify(notifier);

    expect(result).toEqual({ message: null, status: "DELIVERED" });
  });

  test("removes an expired subscription and reports unavailable", async () => {
    const { deletedEndpoints, repository } = createRepository();
    const notifier = new WebPushIncomingCallNotifier(
      repository,
      createGateway("expired")
    );

    const result = await notify(notifier);

    expect(deletedEndpoints).toEqual([SUBSCRIPTION.endpoint]);
    expect(result.status).toBe("UNAVAILABLE");
  });

  test("reports failed when push delivery is skipped", async () => {
    const { repository } = createRepository();
    const notifier = new WebPushIncomingCallNotifier(
      repository,
      createGateway("skipped")
    );

    const result = await notify(notifier);

    expect(result.status).toBe("FAILED");
  });
});
