CREATE TYPE "ReportSource" AS ENUM ('REGISTERED_REPORTER', 'GUEST_CALL');

DROP TABLE "offline_call_transcript";
DROP TYPE "OfflineCallSpeaker";

ALTER TABLE "offline_emergency_call"
ADD COLUMN "summary" TEXT,
ADD COLUMN "keyPoints" JSONB,
ADD COLUMN "callerCondition" TEXT,
ADD COLUMN "followUp" TEXT,
ADD COLUMN "confidencePercent" INTEGER,
ADD COLUMN "finalizedAt" TIMESTAMP(3);

ALTER TABLE "emergency_report"
ALTER COLUMN "reporterId" DROP NOT NULL,
ADD COLUMN "source" "ReportSource" NOT NULL DEFAULT 'REGISTERED_REPORTER',
ADD COLUMN "sourceOfflineCallId" TEXT;

CREATE UNIQUE INDEX "emergency_report_sourceOfflineCallId_key"
ON "emergency_report"("sourceOfflineCallId");

CREATE INDEX "emergency_report_source_idx"
ON "emergency_report"("source");

ALTER TABLE "emergency_report"
ADD CONSTRAINT "emergency_report_sourceOfflineCallId_fkey"
FOREIGN KEY ("sourceOfflineCallId") REFERENCES "offline_emergency_call"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
