import type { PushGateway } from "../../push/domain/push-gateway";
import type { PushSubscriptionRepository } from "../../push/domain/push-repository";
import type {
  IncomingCallNotification,
  IncomingCallNotifier,
} from "../domain/operator-call";

const DELIVERED_NOTIFICATION: IncomingCallNotification = {
  message: null,
  status: "DELIVERED",
};

const UNAVAILABLE_NOTIFICATION: IncomingCallNotification = {
  message:
    "Pelapor belum mengaktifkan notifikasi pada perangkat ini. Hubungi melalui kanal lain atau minta pelapor membuka aplikasi SIAGA.",
  status: "UNAVAILABLE",
};

const FAILED_NOTIFICATION: IncomingCallNotification = {
  message:
    "Notifikasi panggilan tidak dapat dikirim. Pelapor mungkin tidak melihat panggilan ini.",
  status: "FAILED",
};

export class WebPushIncomingCallNotifier implements IncomingCallNotifier {
  private readonly gateway: PushGateway;
  private readonly repository: PushSubscriptionRepository;

  constructor(repository: PushSubscriptionRepository, gateway: PushGateway) {
    this.repository = repository;
    this.gateway = gateway;
  }

  async notify(input: {
    callSessionId: string;
    reportId: string;
    reportTitle: string | null;
  }): Promise<IncomingCallNotification> {
    const context = await this.repository.findReportContext(input.reportId);
    if (!context) {
      return FAILED_NOTIFICATION;
    }
    if (context.subscriptions.length === 0) {
      return UNAVAILABLE_NOTIFICATION;
    }
    const url = `incoming-call?callSessionId=${encodeURIComponent(input.callSessionId)}&reportId=${encodeURIComponent(input.reportId)}`;
    const deliveries = await Promise.all(
      context.subscriptions.map(async (subscription) => ({
        endpoint: subscription.endpoint,
        result: await this.gateway.send(subscription, {
          body: "Operator SIAGA ingin berbicara langsung dengan kamu.",
          data: { reportId: input.reportId, url },
          tag: `siaga-call-${input.callSessionId}`,
          title: "Panggilan masuk dari SIAGA",
        }),
      }))
    );
    await Promise.all(
      deliveries
        .filter(({ result }) => result === "expired")
        .map(({ endpoint }) => this.repository.deleteExpired(endpoint))
    );
    if (deliveries.some(({ result }) => result === "delivered")) {
      return DELIVERED_NOTIFICATION;
    }
    return deliveries.some(({ result }) => result === "expired")
      ? UNAVAILABLE_NOTIFICATION
      : FAILED_NOTIFICATION;
  }
}
