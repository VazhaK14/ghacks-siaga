CREATE TYPE "InteractionMode" AS ENUM ('VOICE', 'TEXT', 'SILENT');
CREATE TYPE "ResponderPreference" AS ENUM ('AI', 'OPERATOR');
CREATE TYPE "CancellationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReportAcknowledgementType" AS ENUM ('HELP_VISIBLE', 'WITH_RESPONDER');
CREATE TYPE "MessageType" AS ENUM ('REPORTER_TEXT', 'OPERATOR_TEXT', 'AI_TEXT', 'TRANSCRIPT_FINAL', 'SYSTEM');
CREATE TYPE "CallSessionStatus" AS ENUM ('CREATED', 'CONNECTING', 'ACTIVE', 'ENDING', 'ENDED', 'FAILED');
CREATE TYPE "AcousticSignalStatus" AS ENUM ('INFERRED', 'CONFIRMED', 'REJECTED');
CREATE TYPE "RecordingStatus" AS ENUM ('NOT_STARTED', 'RECORDING', 'FINALIZING', 'UPLOADING', 'READY', 'FAILED_FINAL', 'DELETED');

ALTER TABLE "reporter_profile"
ADD COLUMN "age" INTEGER,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "conditions" TEXT,
ADD COLUMN "medications" TEXT,
ADD COLUMN "specialNeeds" TEXT;

ALTER TABLE "emergency_report"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "interactionMode" "InteractionMode",
ADD COLUMN "responderPreference" "ResponderPreference" NOT NULL DEFAULT 'AI';

ALTER TABLE "message"
ADD COLUMN "type" "MessageType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN "sourceParticipantIdentity" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

ALTER TABLE "call_session"
ADD COLUMN "livekitRoomName" TEXT,
ADD COLUMN "status" "CallSessionStatus" NOT NULL DEFAULT 'CREATED',
ADD COLUMN "activeInteractionMode" "InteractionMode";

CREATE TABLE "mode_event" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "callSessionId" TEXT NOT NULL,
  "fromMode" "InteractionMode",
  "toMode" "InteractionMode" NOT NULL,
  "actorType" "MessageSenderType" NOT NULL,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mode_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "acoustic_signal" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "callSessionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "status" "AcousticSignalStatus" NOT NULL DEFAULT 'INFERRED',
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3) NOT NULL,
  "modelId" TEXT NOT NULL,
  "modelVersion" TEXT,
  "sourceParticipantIdentity" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "acoustic_signal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recording_asset" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "callSessionId" TEXT NOT NULL,
  "status" "RecordingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "cloudinaryAssetId" TEXT,
  "cloudinaryPublicId" TEXT,
  "resourceType" TEXT,
  "deliveryType" TEXT,
  "format" TEXT,
  "bytes" INTEGER,
  "durationSeconds" INTEGER,
  "checksum" TEXT,
  "lastError" TEXT,
  "startedAt" TIMESTAMP(3),
  "finalizedAt" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "deletedById" TEXT,
  "deleteReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recording_asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cancellation_request" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "CancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "outcomeNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cancellation_request_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_acknowledgement" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "type" "ReportAcknowledgementType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_acknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emergency_report_reporterId_idempotencyKey_key"
ON "emergency_report"("reporterId", "idempotencyKey");
CREATE UNIQUE INDEX "message_reportId_sequence_key"
ON "message"("reportId", "sequence");
CREATE UNIQUE INDEX "message_reportId_idempotencyKey_key"
ON "message"("reportId", "idempotencyKey");
CREATE UNIQUE INDEX "call_session_livekitRoomName_key"
ON "call_session"("livekitRoomName");
CREATE UNIQUE INDEX "recording_asset_callSessionId_key"
ON "recording_asset"("callSessionId");
CREATE UNIQUE INDEX "report_acknowledgement_reportId_type_key"
ON "report_acknowledgement"("reportId", "type");

CREATE INDEX "mode_event_reportId_createdAt_idx" ON "mode_event"("reportId", "createdAt");
CREATE INDEX "mode_event_callSessionId_idx" ON "mode_event"("callSessionId");
CREATE INDEX "acoustic_signal_reportId_createdAt_idx" ON "acoustic_signal"("reportId", "createdAt");
CREATE INDEX "acoustic_signal_callSessionId_idx" ON "acoustic_signal"("callSessionId");
CREATE INDEX "recording_asset_reportId_idx" ON "recording_asset"("reportId");
CREATE INDEX "cancellation_request_reportId_status_idx" ON "cancellation_request"("reportId", "status");
CREATE INDEX "cancellation_request_requestedById_idx" ON "cancellation_request"("requestedById");
CREATE INDEX "cancellation_request_reviewedById_idx" ON "cancellation_request"("reviewedById");
CREATE INDEX "report_acknowledgement_reporterId_idx" ON "report_acknowledgement"("reporterId");

ALTER TABLE "mode_event"
ADD CONSTRAINT "mode_event_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "mode_event_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "call_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acoustic_signal"
ADD CONSTRAINT "acoustic_signal_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "acoustic_signal_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "call_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recording_asset"
ADD CONSTRAINT "recording_asset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "recording_asset_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "call_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cancellation_request"
ADD CONSTRAINT "cancellation_request_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "cancellation_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "cancellation_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "report_acknowledgement"
ADD CONSTRAINT "report_acknowledgement_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "report_acknowledgement_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
