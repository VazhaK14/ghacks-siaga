import type { PushMessage } from "../domain/entities";
import type { PushGateway } from "../domain/push-gateway";
import type { PushSubscriptionRepository } from "../domain/push-repository";

const STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Laporan dibatalkan",
  CLOSED: "Laporan ditutup",
  DISPATCH_PENDING: "Petugas sedang menyiapkan bantuan",
  DISPATCHED: "Unit bantuan sudah dikirim",
  HELP_ARRIVED: "Bantuan sudah tiba",
  HELP_EN_ROUTE: "Bantuan sedang menuju lokasi",
  READY_FOR_REVIEW: "Laporan siap ditinjau operator",
  RESOLVED: "Laporan telah diselesaikan",
};

const createMessage = (
  reportId: string,
  reportTitle: string | null,
  status: string
): PushMessage => ({
  body:
    STATUS_LABELS[status] ??
    "Ada pembaruan terbaru untuk laporan darurat kamu.",
  data: { reportId, url: "." },
  tag: `siaga-report-${reportId}`,
  title: reportTitle ?? "Pembaruan SIAGA",
});

export class SendReportPushNotification {
  private readonly gateway: PushGateway;
  private readonly repository: PushSubscriptionRepository;

  constructor(repository: PushSubscriptionRepository, gateway: PushGateway) {
    this.repository = repository;
    this.gateway = gateway;
  }

  async execute(reportId: string): Promise<void> {
    const context = await this.repository.findReportContext(reportId);
    if (!context || context.subscriptions.length === 0) {
      return;
    }

    const message = createMessage(
      context.reportId,
      context.title,
      context.status
    );
    const deliveries = await Promise.all(
      context.subscriptions.map(async (subscription) => ({
        endpoint: subscription.endpoint,
        result: await this.gateway.send(subscription, message),
      }))
    );
    const expired = deliveries.filter(({ result }) => result === "expired");
    await Promise.all(
      expired.map(({ endpoint }) => this.repository.deleteExpired(endpoint))
    );
  }
}
