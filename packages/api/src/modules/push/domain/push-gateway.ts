import type {
  PushDeliveryResult,
  PushMessage,
  StoredPushSubscription,
} from "./entities";

export interface PushGateway {
  send: (
    subscription: StoredPushSubscription,
    message: PushMessage
  ) => Promise<PushDeliveryResult>;
}
