import { describe, expect, test } from "bun:test";

import type {
  CompletedReportImageUpload,
  ReportImageAttachmentRepository,
  ReportImageStorageGateway,
} from "../domain/report-image-attachment";
import { ReportImageApplicationError } from "../domain/report-image-attachment";
import {
  CompleteReportImageUploads,
  GetReporterImageAccess,
  PrepareReportImageUploads,
} from "./report-image-actions";

const VALID_UPLOAD: CompletedReportImageUpload = {
  assetId: "asset-1",
  attachmentId: "attachment-1",
  bytes: 1024,
  deliveryType: "authenticated",
  format: "webp",
  height: 720,
  publicId: "siaga/reports/report-1/image-1",
  resourceType: "image",
  signature: "signed-response",
  version: 1,
  width: 1280,
};

const createRepository = (): ReportImageAttachmentRepository => ({
  completeUploads: () => Promise.resolve(),
  findOperatorAccessRecords: () => Promise.resolve([]),
  findReporterAccessRecords: () =>
    Promise.resolve([
      {
        format: "webp",
        id: "attachment-1",
        publicId: VALID_UPLOAD.publicId,
      },
    ]),
  prepareUploads: () =>
    Promise.resolve({
      attachments: [{ id: "attachment-1", publicId: VALID_UPLOAD.publicId }],
      expiredPublicIds: [],
    }),
});

const createStorage = (isVerifiedAsset = true): ReportImageStorageGateway => ({
  createAccessUrl: (publicId, _format, expiresAt) =>
    `https://media.example/${publicId}?expires=${expiresAt.getTime()}`,
  createUploadSignature: (_publicId, timestamp) => ({
    apiKey: "api-key",
    cloudName: "cloud-name",
    overwrite: false,
    signature: "signed-request",
    timestamp,
    uploadPreset: "report-images",
  }),
  destroy: () => Promise.resolve(),
  verifyUploadedAsset: () => Promise.resolve(isVerifiedAsset),
});

describe("report image actions", () => {
  test("rejects a batch larger than three files before creating intents", async () => {
    const action = new PrepareReportImageUploads(
      createRepository(),
      createStorage()
    );
    const files = Array.from({ length: 4 }, (_, index) => ({
      bytes: 1024,
      mimeType: "image/jpeg",
      originalFilename: `evidence-${index}.jpg`,
    }));

    await expect(
      action.execute("report-1", "reporter-1", files)
    ).rejects.toBeInstanceOf(ReportImageApplicationError);
  });

  test("rejects upload metadata that Cloudinary cannot verify", async () => {
    const action = new CompleteReportImageUploads(
      createRepository(),
      createStorage(false)
    );

    await expect(
      action.execute("report-1", "reporter-1", [VALID_UPLOAD])
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("creates short-lived access URLs only from authorized records", async () => {
    const action = new GetReporterImageAccess(
      createRepository(),
      createStorage()
    );

    const result = await action.execute("report-1", "reporter-1", [
      "attachment-1",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.attachmentId).toBe("attachment-1");
    expect(result[0]?.url).toContain(VALID_UPLOAD.publicId);
    expect(Date.parse(result[0]?.expiresAt ?? "")).toBeGreaterThan(Date.now());
  });
});
