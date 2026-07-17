import {
  type CompletedReportImageUpload,
  REPORT_IMAGE_FORMATS,
  REPORT_IMAGE_MAX_BYTES,
  REPORT_IMAGE_MAX_PER_BATCH,
  REPORT_IMAGE_MIME_TYPES,
  ReportImageApplicationError,
  type ReportImageAttachmentRepository,
  type ReportImageFileIntent,
  type ReportImageStorageGateway,
} from "../domain/report-image-attachment";

const UPLOAD_INTENT_DURATION_MS = 15 * 60 * 1000;
const ACCESS_URL_DURATION_MS = 5 * 60 * 1000;

const isAllowedFormat = (format: string): boolean =>
  REPORT_IMAGE_FORMATS.some((candidate) => candidate === format.toLowerCase());

const validateFileIntent = (file: ReportImageFileIntent): void => {
  const hasAllowedMimeType = REPORT_IMAGE_MIME_TYPES.some(
    (candidate) => candidate === file.mimeType
  );
  const hasValidSize = file.bytes > 0 && file.bytes <= REPORT_IMAGE_MAX_BYTES;
  const hasValidName =
    file.originalFilename.trim().length > 0 &&
    file.originalFilename.length <= 255;
  if (!(hasAllowedMimeType && hasValidSize && hasValidName)) {
    throw new ReportImageApplicationError(
      "BAD_REQUEST",
      "Gambar harus berformat JPEG, PNG, WebP, HEIC, atau HEIF dan maksimal 5 MB"
    );
  }
};

const validateCompletedUpload = async (
  upload: CompletedReportImageUpload,
  storage: ReportImageStorageGateway
): Promise<void> => {
  const isExpectedDelivery = upload.deliveryType === "authenticated";
  const isExpectedResource = upload.resourceType === "image";
  const isWithinSizeLimit =
    upload.bytes > 0 && upload.bytes <= REPORT_IMAGE_MAX_BYTES;
  const hasValidDimensions = upload.width > 0 && upload.height > 0;
  const isVerifiedAsset = await storage.verifyUploadedAsset(upload);

  if (
    !(
      isExpectedDelivery &&
      isExpectedResource &&
      isWithinSizeLimit &&
      hasValidDimensions &&
      isAllowedFormat(upload.format) &&
      isVerifiedAsset
    )
  ) {
    throw new ReportImageApplicationError(
      "BAD_REQUEST",
      "Hasil unggahan gambar tidak valid"
    );
  }
};

export interface PreparedReportImageUpload {
  apiKey: string;
  attachmentId: string;
  cloudName: string;
  deliveryType: "authenticated";
  overwrite: false;
  publicId: string;
  signature: string;
  timestamp: number;
  uploadPreset: string;
}

export class PrepareReportImageUploads {
  private readonly repository: ReportImageAttachmentRepository;
  private readonly storage: ReportImageStorageGateway;

  constructor(
    repository: ReportImageAttachmentRepository,
    storage: ReportImageStorageGateway
  ) {
    this.repository = repository;
    this.storage = storage;
  }

  async execute(
    reportId: string,
    reporterId: string,
    files: ReportImageFileIntent[]
  ): Promise<PreparedReportImageUpload[]> {
    if (files.length < 1 || files.length > REPORT_IMAGE_MAX_PER_BATCH) {
      throw new ReportImageApplicationError(
        "BAD_REQUEST",
        `Pilih maksimal ${REPORT_IMAGE_MAX_PER_BATCH} gambar per kiriman`
      );
    }
    for (const file of files) {
      validateFileIntent(file);
    }

    const expiresAt = new Date(Date.now() + UPLOAD_INTENT_DURATION_MS);
    const { attachments, expiredPublicIds } =
      await this.repository.prepareUploads(
        reportId,
        reporterId,
        files,
        expiresAt
      );
    await this.storage.destroy(expiredPublicIds);

    const timestamp = Math.floor(Date.now() / 1000);
    return attachments.map((attachment) => ({
      ...this.storage.createUploadSignature(attachment.publicId, timestamp),
      attachmentId: attachment.id,
      deliveryType: "authenticated",
      publicId: attachment.publicId,
    }));
  }
}

export class CompleteReportImageUploads {
  private readonly repository: ReportImageAttachmentRepository;
  private readonly storage: ReportImageStorageGateway;

  constructor(
    repository: ReportImageAttachmentRepository,
    storage: ReportImageStorageGateway
  ) {
    this.repository = repository;
    this.storage = storage;
  }

  async execute(
    reportId: string,
    reporterId: string,
    uploads: CompletedReportImageUpload[]
  ): Promise<void> {
    if (uploads.length < 1 || uploads.length > REPORT_IMAGE_MAX_PER_BATCH) {
      throw new ReportImageApplicationError(
        "BAD_REQUEST",
        "Daftar unggahan gambar tidak valid"
      );
    }
    await Promise.all(
      uploads.map((upload) => validateCompletedUpload(upload, this.storage))
    );
    await this.repository.completeUploads(reportId, reporterId, uploads);
  }
}

interface ReportImageAccessUrl {
  attachmentId: string;
  expiresAt: string;
  url: string;
}

const createAccessUrls = (
  records: Awaited<
    ReturnType<ReportImageAttachmentRepository["findOperatorAccessRecords"]>
  >,
  storage: ReportImageStorageGateway
): ReportImageAccessUrl[] => {
  const expiresAt = new Date(Date.now() + ACCESS_URL_DURATION_MS);
  return records.map((record) => ({
    attachmentId: record.id,
    expiresAt: expiresAt.toISOString(),
    url: storage.createAccessUrl(record.publicId, record.format, expiresAt),
  }));
};

export class GetReporterImageAccess {
  private readonly repository: ReportImageAttachmentRepository;
  private readonly storage: ReportImageStorageGateway;

  constructor(
    repository: ReportImageAttachmentRepository,
    storage: ReportImageStorageGateway
  ) {
    this.repository = repository;
    this.storage = storage;
  }

  async execute(
    reportId: string,
    reporterId: string,
    attachmentIds: string[]
  ): Promise<ReportImageAccessUrl[]> {
    const records = await this.repository.findReporterAccessRecords(
      reportId,
      reporterId,
      attachmentIds
    );
    return createAccessUrls(records, this.storage);
  }
}

export class GetOperatorImageAccess {
  private readonly repository: ReportImageAttachmentRepository;
  private readonly storage: ReportImageStorageGateway;

  constructor(
    repository: ReportImageAttachmentRepository,
    storage: ReportImageStorageGateway
  ) {
    this.repository = repository;
    this.storage = storage;
  }

  async execute(
    reportId: string,
    attachmentIds: string[]
  ): Promise<ReportImageAccessUrl[]> {
    const records = await this.repository.findOperatorAccessRecords(
      reportId,
      attachmentIds
    );
    return createAccessUrls(records, this.storage);
  }
}
