CREATE TYPE "ReportImageAttachmentStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

CREATE TABLE "report_image_attachment" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "status" "ReportImageAttachmentStatus" NOT NULL DEFAULT 'PENDING',
  "cloudinaryAssetId" TEXT,
  "cloudinaryPublicId" TEXT NOT NULL,
  "cloudinaryVersion" INTEGER,
  "deliveryType" TEXT NOT NULL DEFAULT 'authenticated',
  "resourceType" TEXT NOT NULL DEFAULT 'image',
  "format" TEXT,
  "bytes" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "uploadIntentExpiresAt" TIMESTAMP(3) NOT NULL,
  "uploadedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "report_image_attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_image_attachment_cloudinaryAssetId_key"
ON "report_image_attachment"("cloudinaryAssetId");

CREATE UNIQUE INDEX "report_image_attachment_cloudinaryPublicId_key"
ON "report_image_attachment"("cloudinaryPublicId");

CREATE INDEX "report_image_attachment_reportId_status_idx"
ON "report_image_attachment"("reportId", "status");

CREATE INDEX "report_image_attachment_uploaderId_idx"
ON "report_image_attachment"("uploaderId");

CREATE INDEX "report_image_attachment_uploadIntentExpiresAt_status_idx"
ON "report_image_attachment"("uploadIntentExpiresAt", "status");

ALTER TABLE "report_image_attachment"
ADD CONSTRAINT "report_image_attachment_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report_image_attachment"
ADD CONSTRAINT "report_image_attachment_uploaderId_fkey"
FOREIGN KEY ("uploaderId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
