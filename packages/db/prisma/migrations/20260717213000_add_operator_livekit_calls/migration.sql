ALTER TABLE "call_session"
ADD COLUMN "initiatedByOperatorId" TEXT,
ADD COLUMN "ringingAt" TIMESTAMP(3),
ADD COLUMN "answeredAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "summary" TEXT,
ADD COLUMN "keyPoints" JSONB,
ADD COLUMN "callerCondition" TEXT,
ADD COLUMN "followUp" TEXT,
ADD COLUMN "confidencePercent" INTEGER;

CREATE INDEX "call_session_initiatedByOperatorId_idx"
ON "call_session"("initiatedByOperatorId");

ALTER TABLE "call_session"
ADD CONSTRAINT "call_session_initiatedByOperatorId_fkey"
FOREIGN KEY ("initiatedByOperatorId") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
