ALTER TABLE "dispatch_request"
DROP CONSTRAINT IF EXISTS "dispatch_request_reportRevisionId_fkey";

DROP INDEX IF EXISTS "dispatch_request_reportRevisionId_idx";

ALTER TABLE "dispatch_request"
DROP COLUMN IF EXISTS "reportRevisionId",
ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "emergency_report"
DROP CONSTRAINT IF EXISTS "emergency_report_currentRevisionId_fkey";

DROP INDEX IF EXISTS "emergency_report_currentRevisionId_key";

ALTER TABLE "emergency_report"
DROP COLUMN IF EXISTS "currentRevisionId";

DROP TABLE IF EXISTS "report_revision";
DROP TYPE IF EXISTS "ReportRevisionSource";

CREATE TYPE "ReportClosureReason" AS ENUM (
  'PRANK_CALL',
  'INCOMPLETE_REPORT',
  'OTHER'
);

ALTER TABLE "emergency_report"
ADD COLUMN "closureReason" "ReportClosureReason",
ADD COLUMN "closureNote" TEXT,
ADD COLUMN "closedByOperatorId" TEXT;

CREATE INDEX "emergency_report_closedByOperatorId_idx"
ON "emergency_report"("closedByOperatorId");

ALTER TABLE "emergency_report"
ADD CONSTRAINT "emergency_report_closedByOperatorId_fkey"
FOREIGN KEY ("closedByOperatorId")
REFERENCES "user"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
