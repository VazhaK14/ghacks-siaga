import type { PushGateway } from "../../push/domain/push-gateway";
import type { PushSubscriptionRepository } from "../../push/domain/push-repository";
import type { IncomingCallNotifier } from "../domain/operator-call";

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
  }): Promise<void> {
    const context = await this.repository.findReportContext(input.reportId);
    if (!context) {
      return;
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
  }
}
