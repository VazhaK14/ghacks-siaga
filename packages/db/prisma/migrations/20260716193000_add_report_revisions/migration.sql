-- CreateEnum
CREATE TYPE "ReportRevisionSource" AS ENUM ('INITIAL', 'MANUAL', 'AI_ASSISTED');

-- CreateTable
CREATE TABLE "report_revision" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "source" "ReportRevisionSource" NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "recommendation" TEXT,
    "category" "ReportCategory" NOT NULL,
    "incidentType" "IncidentType",
    "extractedData" JSONB,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "changeNote" TEXT,
    "createdByOperatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_revision_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "emergency_report" ADD COLUMN "currentRevisionId" TEXT;
ALTER TABLE "dispatch_request" ADD COLUMN "reportRevisionId" TEXT;

-- Backfill immutable version one for existing reports.
INSERT INTO "report_revision" (
    "id",
    "reportId",
    "version",
    "source",
    "title",
    "summary",
    "recommendation",
    "category",
    "incidentType",
    "extractedData",
    "address",
    "latitude",
    "longitude",
    "changeNote",
    "createdAt"
)
SELECT
    CONCAT('revision_', MD5("id" || CLOCK_TIMESTAMP()::TEXT || RANDOM()::TEXT)),
    "id",
    1,
    'INITIAL'::"ReportRevisionSource",
    "title",
    "summary",
    "recommendation",
    "category",
    "incidentType",
    "extractedData",
    "address",
    "latitude",
    "longitude",
    'Versi awal laporan',
    "createdAt"
FROM "emergency_report";

UPDATE "emergency_report" AS report
SET "currentRevisionId" = revision."id"
FROM "report_revision" AS revision
WHERE revision."reportId" = report."id"
  AND revision."version" = 1;

UPDATE "dispatch_request" AS dispatch
SET "reportRevisionId" = report."currentRevisionId"
FROM "emergency_report" AS report
WHERE report."id" = dispatch."reportId";

-- CreateIndex
CREATE UNIQUE INDEX "report_revision_reportId_version_key" ON "report_revision"("reportId", "version");
CREATE INDEX "report_revision_reportId_createdAt_idx" ON "report_revision"("reportId", "createdAt");
CREATE INDEX "report_revision_createdByOperatorId_idx" ON "report_revision"("createdByOperatorId");
CREATE UNIQUE INDEX "emergency_report_currentRevisionId_key" ON "emergency_report"("currentRevisionId");
CREATE INDEX "dispatch_request_reportRevisionId_idx" ON "dispatch_request"("reportRevisionId");

-- AddForeignKey
ALTER TABLE "report_revision" ADD CONSTRAINT "report_revision_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_revision" ADD CONSTRAINT "report_revision_createdByOperatorId_fkey" FOREIGN KEY ("createdByOperatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "emergency_report" ADD CONSTRAINT "emergency_report_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "report_revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_request" ADD CONSTRAINT "dispatch_request_reportRevisionId_fkey" FOREIGN KEY ("reportRevisionId") REFERENCES "report_revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
