export interface PushSubscriptionInput {
  auth: string;
  endpoint: string;
  expirationTime: string | null;
  p256dh: string;
  userAgent: string | null;
}

export interface StoredPushSubscription extends PushSubscriptionInput {
  id: string;
}

export interface ReportNotificationContext {
  reportId: string;
  status: string;
  subscriptions: StoredPushSubscription[];
  title: string | null;
}

export interface PushMessage {
  body: string;
  data: { reportId: string; url: string };
  tag: string;
  title: string;
}

export type PushDeliveryResult = "delivered" | "expired" | "skipped";
