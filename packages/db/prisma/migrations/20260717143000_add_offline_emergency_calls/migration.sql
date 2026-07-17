CREATE TYPE "OfflineCallStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED', 'CANCELLED', 'MISSED', 'FAILED');
CREATE TYPE "OfflineCallSpeaker" AS ENUM ('CALLER', 'OPERATOR');

CREATE TABLE "offline_emergency_call" (
  "id" TEXT NOT NULL,
  "accessTokenHash" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestIpHash" TEXT NOT NULL,
  "roomName" TEXT NOT NULL,
  "status" "OfflineCallStatus" NOT NULL DEFAULT 'WAITING',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "locationAccuracy" DOUBLE PRECISION,
  "assignedOperatorId" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  CONSTRAINT "offline_emergency_call_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offline_call_transcript" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "speaker" "OfflineCallSpeaker" NOT NULL,
  "content" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "sequence" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offline_call_transcript_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offline_emergency_call_accessTokenHash_key" ON "offline_emergency_call"("accessTokenHash");
CREATE UNIQUE INDEX "offline_emergency_call_roomName_key" ON "offline_emergency_call"("roomName");
CREATE UNIQUE INDEX "offline_emergency_call_requestIpHash_idempotencyKey_key" ON "offline_emergency_call"("requestIpHash", "idempotencyKey");
CREATE INDEX "offline_emergency_call_status_createdAt_idx" ON "offline_emergency_call"("status", "createdAt");
CREATE INDEX "offline_emergency_call_assignedOperatorId_idx" ON "offline_emergency_call"("assignedOperatorId");
CREATE UNIQUE INDEX "offline_call_transcript_callId_idempotencyKey_key" ON "offline_call_transcript"("callId", "idempotencyKey");
CREATE INDEX "offline_call_transcript_callId_sequence_idx" ON "offline_call_transcript"("callId", "sequence");
CREATE INDEX "offline_call_transcript_authorId_idx" ON "offline_call_transcript"("authorId");

ALTER TABLE "offline_emergency_call" ADD CONSTRAINT "offline_emergency_call_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offline_call_transcript" ADD CONSTRAINT "offline_call_transcript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "offline_emergency_call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offline_call_transcript" ADD CONSTRAINT "offline_call_transcript_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
