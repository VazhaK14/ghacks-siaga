import { timingSafeEqual } from "node:crypto";

import { env } from "@siaga-app/env/server";
import { v2 as cloudinary } from "cloudinary";

import type {
  CompletedReportImageUpload,
  ReportImageStorageGateway,
  ReportImageUploadSignature,
} from "../domain/report-image-attachment";
import { ReportImageApplicationError } from "../domain/report-image-attachment";

interface CloudinaryConfiguration {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
  uploadPreset: string;
}

const getConfiguration = (): CloudinaryConfiguration => {
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.CLOUDINARY_REPORT_IMAGE_UPLOAD_PRESET;
  if (!(apiKey && apiSecret && cloudName && uploadPreset)) {
    throw new ReportImageApplicationError(
      "PRECONDITION_FAILED",
      "Unggah gambar belum dikonfigurasi di server"
    );
  }
  return { apiKey, apiSecret, cloudName, uploadPreset };
};

const safelyMatches = (actual: string, expected: string): boolean => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const isVerifiedCloudinaryAsset = (
  value: unknown,
  upload: CompletedReportImageUpload
): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const asset = value as Record<string, unknown>;
  return (
    asset.asset_id === upload.assetId &&
    asset.bytes === upload.bytes &&
    asset.format === upload.format &&
    asset.height === upload.height &&
    asset.public_id === upload.publicId &&
    asset.resource_type === upload.resourceType &&
    asset.type === upload.deliveryType &&
    asset.version === upload.version &&
    asset.width === upload.width
  );
};

export class CloudinaryReportImageGateway implements ReportImageStorageGateway {
  createAccessUrl(publicId: string, format: string, expiresAt: Date): string {
    const configuration = getConfiguration();
    cloudinary.config({
      api_key: configuration.apiKey,
      api_secret: configuration.apiSecret,
      cloud_name: configuration.cloudName,
      secure: true,
    });
    return cloudinary.utils.private_download_url(publicId, format, {
      attachment: false,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      resource_type: "image",
      type: "authenticated",
    });
  }

  createUploadSignature(
    publicId: string,
    timestamp: number
  ): ReportImageUploadSignature {
    const configuration = getConfiguration();
    const signature = cloudinary.utils.api_sign_request(
      {
        overwrite: false,
        public_id: publicId,
        timestamp,
        type: "authenticated",
        upload_preset: configuration.uploadPreset,
      },
      configuration.apiSecret
    );
    return {
      apiKey: configuration.apiKey,
      cloudName: configuration.cloudName,
      overwrite: false,
      signature,
      timestamp,
      uploadPreset: configuration.uploadPreset,
    };
  }

  async destroy(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) {
      return;
    }
    const configuration = getConfiguration();
    cloudinary.config({
      api_key: configuration.apiKey,
      api_secret: configuration.apiSecret,
      cloud_name: configuration.cloudName,
      secure: true,
    });
    await Promise.allSettled(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          invalidate: true,
          resource_type: "image",
          type: "authenticated",
        })
      )
    );
  }

  async verifyUploadedAsset(
    upload: CompletedReportImageUpload
  ): Promise<boolean> {
    const configuration = getConfiguration();
    const expectedSignature = cloudinary.utils.api_sign_request(
      { public_id: upload.publicId, version: upload.version },
      configuration.apiSecret
    );
    if (!safelyMatches(upload.signature, expectedSignature)) {
      return false;
    }
    cloudinary.config({
      api_key: configuration.apiKey,
      api_secret: configuration.apiSecret,
      cloud_name: configuration.cloudName,
      secure: true,
    });
    try {
      const asset: unknown = await cloudinary.api.resource(upload.publicId, {
        resource_type: "image",
        type: "authenticated",
      });
      return isVerifiedCloudinaryAsset(asset, upload);
    } catch {
      return false;
    }
  }
}
