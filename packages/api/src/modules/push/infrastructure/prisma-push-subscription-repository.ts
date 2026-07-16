import prisma from "@siaga-app/db";

import type {
  PushSubscriptionInput,
  ReportNotificationContext,
} from "../domain/entities";
import type { PushSubscriptionRepository } from "../domain/push-repository";

export class PrismaPushSubscriptionRepository
  implements PushSubscriptionRepository
{
  async deleteByEndpoint(endpoint: string, userId: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  }

  async deleteExpired(endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async findReportContext(
    reportId: string
  ): Promise<ReportNotificationContext | null> {
    const report = await prisma.emergencyReport.findUnique({
      select: {
        id: true,
        reporter: {
          select: {
            pushSubscriptions: {
              select: {
                auth: true,
                endpoint: true,
                expirationTime: true,
                id: true,
                p256dh: true,
                userAgent: true,
              },
            },
          },
        },
        status: true,
        title: true,
      },
      where: { id: reportId },
    });
    if (!report) {
      return null;
    }
    return {
      reportId: report.id,
      status: report.status,
      subscriptions: report.reporter.pushSubscriptions.map((subscription) => ({
        ...subscription,
        expirationTime: subscription.expirationTime?.toISOString() ?? null,
      })),
      title: report.title,
    };
  }

  async upsert(userId: string, input: PushSubscriptionInput): Promise<void> {
    await prisma.pushSubscription.upsert({
      create: {
        ...input,
        expirationTime: input.expirationTime
          ? new Date(input.expirationTime)
          : null,
        userId,
      },
      update: {
        ...input,
        expirationTime: input.expirationTime
          ? new Date(input.expirationTime)
          : null,
        userId,
      },
      where: { endpoint: input.endpoint },
    });
  }
}
