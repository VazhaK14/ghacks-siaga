import { randomUUID } from "node:crypto";

import prisma from "@siaga-app/db";
import { ReportStatus } from "@siaga-app/db/enums";

import { ACTIVE_REPORT_STATUSES } from "../domain/entities";
import {
  type CompletedReportImageUpload,
  type PreparedReportImageAttachment,
  REPORT_IMAGE_MAX_PER_REPORT,
  type ReportImageAccessRecord,
  ReportImageApplicationError,
  type ReportImageAttachmentRepository,
  type ReportImageFileIntent,
} from "../domain/report-image-attachment";

const ACTIVE_STATUSES = ACTIVE_REPORT_STATUSES.map(
  (status) => ReportStatus[status]
);

const toAccessRecords = (
  attachments: {
    format: string | null;
    id: string;
    cloudinaryPublicId: string;
  }[]
): ReportImageAccessRecord[] =>
  attachments.flatMap((attachment) =>
    attachment.format
      ? [
          {
            format: attachment.format,
            id: attachment.id,
            publicId: attachment.cloudinaryPublicId,
          },
        ]
      : []
  );

const assertAllAttachmentsFound = (
  requestedIds: string[],
  foundIds: string[]
): void => {
  const uniqueRequestedIds = new Set(requestedIds);
  if (uniqueRequestedIds.size !== foundIds.length) {
    throw new ReportImageApplicationError(
      "NOT_FOUND",
      "Gambar laporan tidak ditemukan"
    );
  }
};

export class PrismaReportImageAttachmentRepository
  implements ReportImageAttachmentRepository
{
  prepareUploads(
    reportId: string,
    reporterId: string,
    files: ReportImageFileIntent[],
    expiresAt: Date
  ) {
    return prisma.$transaction(async (transaction) => {
      const expiredAttachments =
        await transaction.reportImageAttachment.findMany({
          select: { cloudinaryPublicId: true, id: true },
          where: {
            status: "PENDING",
            uploadIntentExpiresAt: { lt: new Date() },
          },
        });
      if (expiredAttachments.length > 0) {
        await transaction.reportImageAttachment.deleteMany({
          where: { id: { in: expiredAttachments.map(({ id }) => id) } },
        });
      }

      const report = await transaction.emergencyReport.findFirst({
        select: { id: true },
        where: {
          id: reportId,
          intakeStatus: "FINALIZED",
          reporterId,
          status: { in: ACTIVE_STATUSES },
        },
      });
      if (!report) {
        throw new ReportImageApplicationError(
          "PRECONDITION_FAILED",
          "Gambar dapat dikirim setelah laporan diteruskan ke operator"
        );
      }

      const existingCount = await transaction.reportImageAttachment.count({
        where: {
          OR: [
            { status: "READY" },
            {
              status: "PENDING",
              uploadIntentExpiresAt: { gt: new Date() },
            },
          ],
          reportId,
        },
      });
      if (existingCount + files.length > REPORT_IMAGE_MAX_PER_REPORT) {
        throw new ReportImageApplicationError(
          "BAD_REQUEST",
          `Maksimal ${REPORT_IMAGE_MAX_PER_REPORT} gambar untuk satu laporan`
        );
      }

      const uploadRows = files.map((file) => {
        const attachment: PreparedReportImageAttachment = {
          id: randomUUID(),
          publicId: `siaga/reports/${reportId}/${randomUUID()}`,
        };
        return {
          attachment,
          data: {
            bytes: file.bytes,
            cloudinaryPublicId: attachment.publicId,
            id: attachment.id,
            mimeType: file.mimeType,
            originalFilename: file.originalFilename,
            reportId,
            uploaderId: reporterId,
            uploadIntentExpiresAt: expiresAt,
          },
        };
      });
      await transaction.reportImageAttachment.createMany({
        data: uploadRows.map(({ data }) => data),
      });
      return {
        attachments: uploadRows.map(({ attachment }) => attachment),
        expiredPublicIds: expiredAttachments.map(
          ({ cloudinaryPublicId }) => cloudinaryPublicId
        ),
      };
    });
  }

  async completeUploads(
    reportId: string,
    reporterId: string,
    uploads: CompletedReportImageUpload[]
  ): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const existingAttachments =
        await transaction.reportImageAttachment.findMany({
          select: {
            cloudinaryAssetId: true,
            cloudinaryPublicId: true,
            id: true,
            status: true,
            uploadIntentExpiresAt: true,
          },
          where: {
            id: { in: uploads.map(({ attachmentId }) => attachmentId) },
            reportId,
            uploaderId: reporterId,
          },
        });
      const existingById = new Map(
        existingAttachments.map((attachment) => [attachment.id, attachment])
      );
      const uploadedAt = new Date();
      const pendingUploads = uploads.filter((upload) => {
        const attachment = existingById.get(upload.attachmentId);
        if (
          attachment?.status === "READY" &&
          attachment.cloudinaryAssetId === upload.assetId
        ) {
          return false;
        }
        const isValidIntent =
          attachment?.status === "PENDING" &&
          attachment.cloudinaryPublicId === upload.publicId &&
          attachment.uploadIntentExpiresAt > uploadedAt;
        if (!isValidIntent) {
          throw new ReportImageApplicationError(
            "PRECONDITION_FAILED",
            "Sesi unggah gambar telah berakhir"
          );
        }
        return true;
      });
      const results = await Promise.all(
        pendingUploads.map((upload) =>
          transaction.reportImageAttachment.updateMany({
            data: {
              bytes: upload.bytes,
              cloudinaryAssetId: upload.assetId,
              cloudinaryVersion: upload.version,
              deliveryType: upload.deliveryType,
              format: upload.format.toLowerCase(),
              height: upload.height,
              resourceType: upload.resourceType,
              status: "READY",
              uploadedAt,
              width: upload.width,
            },
            where: {
              id: upload.attachmentId,
              status: "PENDING",
            },
          })
        )
      );
      if (results.some(({ count }) => count !== 1)) {
        throw new ReportImageApplicationError(
          "PRECONDITION_FAILED",
          "Sesi unggah gambar telah berakhir"
        );
      }
    });
  }

  async findReporterAccessRecords(
    reportId: string,
    reporterId: string,
    attachmentIds: string[]
  ): Promise<ReportImageAccessRecord[]> {
    const attachments = await prisma.reportImageAttachment.findMany({
      orderBy: { createdAt: "asc" },
      select: { cloudinaryPublicId: true, format: true, id: true },
      where: {
        id: { in: attachmentIds },
        report: { reporterId, status: { not: "CANCELLED" } },
        reportId,
        status: "READY",
      },
    });
    assertAllAttachmentsFound(
      attachmentIds,
      attachments.map(({ id }) => id)
    );
    return toAccessRecords(attachments);
  }

  async findOperatorAccessRecords(
    reportId: string,
    attachmentIds: string[]
  ): Promise<ReportImageAccessRecord[]> {
    const attachments = await prisma.reportImageAttachment.findMany({
      orderBy: { createdAt: "asc" },
      select: { cloudinaryPublicId: true, format: true, id: true },
      where: {
        id: { in: attachmentIds },
        reportId,
        status: "READY",
      },
    });
    assertAllAttachmentsFound(
      attachmentIds,
      attachments.map(({ id }) => id)
    );
    return toAccessRecords(attachments);
  }
}
