-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REPORTER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('REPORTER', 'AI_AGENT', 'OPERATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CallEndReason" AS ENUM ('COMPLETED', 'USER_HANGUP', 'ERROR', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "DispatchAgencyType" AS ENUM ('POLICE', 'FIRE_DEPARTMENT', 'AMBULANCE', 'SAR', 'OTHER');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('REQUESTED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'AI_GATHERING', 'READY_FOR_REVIEW', 'DISPATCH_PENDING', 'DISPATCHED', 'HELP_EN_ROUTE', 'HELP_ARRIVED', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('UNCATEGORIZED', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('CRIME', 'FIRE', 'MEDICAL', 'TRAFFIC_ACCIDENT', 'NATURAL_DISASTER', 'DOMESTIC_VIOLENCE', 'MISSING_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "HandlingMode" AS ENUM ('AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('VOICE', 'CHAT');

-- CreateEnum
CREATE TYPE "ChannelSwitchReason" AS ENUM ('USER_CHOICE', 'VOICE_ERROR', 'CALL_ENDED', 'OPERATOR_REQUEST');

-- CreateTable
CREATE TABLE "ai_analysis_snapshot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "triggeredByMessageId" TEXT,
    "summary" TEXT NOT NULL,
    "recommendation" TEXT,
    "category" "ReportCategory" NOT NULL,
    "incidentType" "IncidentType",
    "extractedData" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" TEXT NOT NULL,
    "analysisSnapshotId" TEXT NOT NULL,
    "reviewedByOperatorId" TEXT NOT NULL,
    "wasAccurate" BOOLEAN NOT NULL,
    "correctedCategory" "ReportCategory",
    "correctedIncidentType" "IncidentType",
    "correctedSummary" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REPORTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporter_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "bloodType" "BloodType",
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "homeAddress" TEXT,
    "homeLatitude" DOUBLE PRECISION,
    "homeLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporter_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "senderUserId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcriptConfidence" DOUBLE PRECISION,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_session" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalCallId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "endReason" "CallEndReason",
    "durationSeconds" INTEGER,
    "recordingUrl" TEXT,

    CONSTRAINT "call_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DispatchAgencyType" NOT NULL,
    "contactPhone" TEXT,
    "jurisdiction" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dispatch_agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_request" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "agencyId" TEXT,
    "agencyType" "DispatchAgencyType" NOT NULL,
    "dispatchedByOperatorId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'REQUESTED',
    "structuredReportSnapshot" JSONB NOT NULL,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "dispatch_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "category" "ReportCategory" NOT NULL DEFAULT 'UNCATEGORIZED',
    "incidentType" "IncidentType",
    "title" TEXT,
    "summary" TEXT,
    "recommendation" TEXT,
    "extractedData" JSONB,
    "contactPhoneSnapshot" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "activeChannel" "CommunicationChannel",
    "handlingMode" "HandlingMode" NOT NULL DEFAULT 'AI',
    "assignedOperatorId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "emergency_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_status_event" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fromStatus" "ReportStatus",
    "toStatus" "ReportStatus" NOT NULL,
    "note" TEXT,
    "actorType" "MessageSenderType" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_status_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_switch_event" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fromChannel" "CommunicationChannel",
    "toChannel" "CommunicationChannel" NOT NULL,
    "reason" "ChannelSwitchReason" NOT NULL,
    "switchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_switch_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_event" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fromMode" "HandlingMode" NOT NULL,
    "toMode" "HandlingMode" NOT NULL,
    "operatorId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handoff_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analysis_snapshot_reportId_idx" ON "ai_analysis_snapshot"("reportId");

-- CreateIndex
CREATE INDEX "ai_feedback_analysisSnapshotId_idx" ON "ai_feedback"("analysisSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reporter_profile_userId_key" ON "reporter_profile"("userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "message_reportId_sequence_idx" ON "message"("reportId", "sequence");

-- CreateIndex
CREATE INDEX "call_session_reportId_idx" ON "call_session"("reportId");

-- CreateIndex
CREATE INDEX "dispatch_request_reportId_idx" ON "dispatch_request"("reportId");

-- CreateIndex
CREATE INDEX "dispatch_request_agencyId_idx" ON "dispatch_request"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_report_accessToken_key" ON "emergency_report"("accessToken");

-- CreateIndex
CREATE INDEX "emergency_report_status_category_idx" ON "emergency_report"("status", "category");

-- CreateIndex
CREATE INDEX "emergency_report_reporterId_idx" ON "emergency_report"("reporterId");

-- CreateIndex
CREATE INDEX "emergency_report_assignedOperatorId_idx" ON "emergency_report"("assignedOperatorId");

-- CreateIndex
CREATE INDEX "report_status_event_reportId_idx" ON "report_status_event"("reportId");

-- CreateIndex
CREATE INDEX "channel_switch_event_reportId_idx" ON "channel_switch_event"("reportId");

-- CreateIndex
CREATE INDEX "handoff_event_reportId_idx" ON "handoff_event"("reportId");

-- AddForeignKey
ALTER TABLE "ai_analysis_snapshot" ADD CONSTRAINT "ai_analysis_snapshot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_snapshot" ADD CONSTRAINT "ai_analysis_snapshot_triggeredByMessageId_fkey" FOREIGN KEY ("triggeredByMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_analysisSnapshotId_fkey" FOREIGN KEY ("analysisSnapshotId") REFERENCES "ai_analysis_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_reviewedByOperatorId_fkey" FOREIGN KEY ("reviewedByOperatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporter_profile" ADD CONSTRAINT "reporter_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_request" ADD CONSTRAINT "dispatch_request_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_request" ADD CONSTRAINT "dispatch_request_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "dispatch_agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_request" ADD CONSTRAINT "dispatch_request_dispatchedByOperatorId_fkey" FOREIGN KEY ("dispatchedByOperatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_report" ADD CONSTRAINT "emergency_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_report" ADD CONSTRAINT "emergency_report_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_event" ADD CONSTRAINT "report_status_event_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_switch_event" ADD CONSTRAINT "channel_switch_event_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_event" ADD CONSTRAINT "handoff_event_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_event" ADD CONSTRAINT "handoff_event_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
