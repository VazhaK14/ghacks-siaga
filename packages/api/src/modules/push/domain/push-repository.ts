import type {
  PushSubscriptionInput,
  ReportNotificationContext,
} from "./entities";

export interface PushSubscriptionRepository {
  deleteByEndpoint: (endpoint: string, userId: string) => Promise<void>;
  deleteExpired: (endpoint: string) => Promise<void>;
  findReportContext: (
    reportId: string
  ) => Promise<ReportNotificationContext | null>;
  upsert: (userId: string, input: PushSubscriptionInput) => Promise<void>;
}
