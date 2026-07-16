import { SendReportPushNotification } from "../../push/application/send-report-push-notification";
import { PrismaPushSubscriptionRepository } from "../../push/infrastructure/prisma-push-subscription-repository";
import { WebPushGateway } from "../../push/infrastructure/web-push-gateway";
import type {
  ReportLiveEvent,
  ReportLiveEventListener,
  ReportLiveEventUnsubscribe,
} from "../domain/report-live-event";
import { getReportEventBus } from "../infrastructure/report-event-bus";

const pushRepository = new PrismaPushSubscriptionRepository();
const sendReportPushNotification = new SendReportPushNotification(
  pushRepository,
  new WebPushGateway()
);

interface PublishReportLiveEventOptions {
  notifyReporter?: boolean;
}

export const publishReportLiveEvent = async (
  event: ReportLiveEvent,
  options: PublishReportLiveEventOptions = {}
): Promise<void> => {
  const eventResult = await Promise.allSettled([
    getReportEventBus().publish(event),
    options.notifyReporter
      ? sendReportPushNotification.execute(event.reportId)
      : Promise.resolve(),
  ]);
  const [liveEventResult] = eventResult;
  if (liveEventResult?.status === "rejected") {
    throw liveEventResult.reason;
  }
};

export const subscribeToReportLiveEvents = (
  listener: ReportLiveEventListener,
  onError?: (error: Error) => void
): ReportLiveEventUnsubscribe | Promise<ReportLiveEventUnsubscribe> =>
  getReportEventBus().subscribe(listener, onError);
