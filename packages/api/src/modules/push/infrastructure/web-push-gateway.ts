import { env } from "@siaga-app/env/server";
import webPush from "web-push";

import type {
  PushDeliveryResult,
  PushMessage,
  StoredPushSubscription,
} from "../domain/entities";
import type { PushGateway } from "../domain/push-gateway";

const EXPIRED_SUBSCRIPTION_STATUS_CODES = new Set([404, 410]);

const getStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== "object" || !("statusCode" in error)) {
    return null;
  }
  const { statusCode } = error;
  return typeof statusCode === "number" ? statusCode : null;
};

export class WebPushGateway implements PushGateway {
  async send(
    subscription: StoredPushSubscription,
    message: PushMessage
  ): Promise<PushDeliveryResult> {
    if (!(env.VAPID_PRIVATE_KEY && env.VAPID_PUBLIC_KEY)) {
      return "skipped";
    }

    webPush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime).getTime()
            : null,
          keys: { auth: subscription.auth, p256dh: subscription.p256dh },
        },
        JSON.stringify(message)
      );
      return "delivered";
    } catch (error) {
      const statusCode = getStatusCode(error);
      return statusCode && EXPIRED_SUBSCRIPTION_STATUS_CODES.has(statusCode)
        ? "expired"
        : "skipped";
    }
  }
}
