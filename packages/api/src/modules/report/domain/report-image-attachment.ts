export const REPORT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const REPORT_IMAGE_MAX_PER_BATCH = 3;
export const REPORT_IMAGE_MAX_PER_REPORT = 20;

export const REPORT_IMAGE_MIME_TYPES = [
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const REPORT_IMAGE_FORMATS = [
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "webp",
] as const;

export interface ReportImageAttachmentSummary {
  bytes: number;
  createdAt: string;
  format: string;
  height: number | null;
  id: string;
  originalFilename: string;
  width: number | null;
}

export interface ReportImageFileIntent {
  bytes: number;
  mimeType: string;
  originalFilename: string;
}

export interface PreparedReportImageAttachment {
  id: string;
  publicId: string;
}

export interface CompletedReportImageUpload {
  assetId: string;
  attachmentId: string;
  bytes: number;
  deliveryType: string;
  format: string;
  height: number;
  publicId: string;
  resourceType: string;
  signature: string;
  version: number;
  width: number;
}

export interface ReportImageAccessRecord {
  format: string;
  id: string;
  publicId: string;
}

export interface ReportImageAttachmentRepository {
  completeUploads: (
    reportId: string,
    reporterId: string,
    uploads: CompletedReportImageUpload[]
  ) => Promise<void>;
  findOperatorAccessRecords: (
    reportId: string,
    attachmentIds: string[]
  ) => Promise<ReportImageAccessRecord[]>;
  findReporterAccessRecords: (
    reportId: string,
    reporterId: string,
    attachmentIds: string[]
  ) => Promise<ReportImageAccessRecord[]>;
  prepareUploads: (
    reportId: string,
    reporterId: string,
    files: ReportImageFileIntent[],
    expiresAt: Date
  ) => Promise<{
    attachments: PreparedReportImageAttachment[];
    expiredPublicIds: string[];
  }>;
}

export interface ReportImageUploadSignature {
  apiKey: string;
  cloudName: string;
  overwrite: false;
  signature: string;
  timestamp: number;
  uploadPreset: string;
}

export interface ReportImageStorageGateway {
  createAccessUrl: (
    publicId: string,
    format: string,
    expiresAt: Date
  ) => string;
  createUploadSignature: (
    publicId: string,
    timestamp: number
  ) => ReportImageUploadSignature;
  destroy: (publicIds: string[]) => Promise<void>;
  verifyUploadedAsset: (upload: CompletedReportImageUpload) => Promise<boolean>;
}

export type ReportImageApplicationErrorCode =
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PRECONDITION_FAILED";

export class ReportImageApplicationError extends Error {
  readonly code: ReportImageApplicationErrorCode;

  constructor(code: ReportImageApplicationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ReportImageApplicationError";
  }
}
