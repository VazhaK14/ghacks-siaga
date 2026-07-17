import { TRPCError } from "@trpc/server";

import {
  completedReporterProcedure,
  operatorProcedure,
  router,
} from "../../../index";
import { PrismaPushSubscriptionRepository } from "../../push/infrastructure/prisma-push-subscription-repository";
import { WebPushGateway } from "../../push/infrastructure/web-push-gateway";
import { ClaimAndTakeoverReport } from "../application/claim-and-takeover-report";
import { GetArchivedReportDetail } from "../application/get-archived-report-detail";
import { GetReportDetail } from "../application/get-report-detail";
import { GetReporterLiveKitConnection } from "../application/get-reporter-livekit-connection";
import { ListActiveMapPoints } from "../application/list-active-map-points";
import { ListActiveReports } from "../application/list-active-reports";
import { ListArchivedReports } from "../application/list-archived-reports";
import {
  AcceptIncomingOperatorCall,
  CancelOperatorCall,
  EndIncomingOperatorCall,
  EndOperatorCall,
  GetIncomingOperatorCall,
  GetOperatorCallState,
  ReconnectOperatorCall,
  RejectIncomingOperatorCall,
  StartOperatorCall,
} from "../application/operator-call-actions";
import {
  AcknowledgeReport,
  ActivateReporterSession,
  AppendReporterAcousticSignal,
  AppendReporterText,
  CreateReporterReport,
  EndReporterSession,
  GetReporterReport,
  ListReporterReports,
  RequestReporterCancellation,
  UpdateReporterLocation,
} from "../application/reporter-report-actions";
import {
  GetRealtimeTranscriptionAccess,
  SynthesizeReporterSpeech,
} from "../application/reporter-voice-actions";
import { ReviewAcousticSignal } from "../application/review-acoustic-signal";
import { UpdateReportDetail } from "../application/update-report-detail";
import { ReportUpdateApplicationError } from "../domain/entities";
import { OperatorCallError } from "../domain/operator-call";
import { ElevenLabsVoiceAiGateway } from "../infrastructure/elevenlabs-voice-gateway";
import { GeminiCallSummaryGenerator } from "../infrastructure/gemini-call-summary-generator";
import { GeminiCaseAssistant } from "../infrastructure/gemini-case-assistant";
import { LiveKitOperatorCallGateway } from "../infrastructure/livekit-operator-call-gateway";
import { LiveKitReporterTokenGateway } from "../infrastructure/livekit-token-gateway";
import { PrismaOperatorCallRepository } from "../infrastructure/prisma-operator-call-repository";
import { PrismaReportRepository } from "../infrastructure/prisma-report-repository";
import { PrismaReporterReportRepository } from "../infrastructure/prisma-reporter-report-repository";
import { WebPushIncomingCallNotifier } from "../infrastructure/web-push-incoming-call-notifier";
import {
  acknowledgeReporterInputSchema,
  activeReportPageSchema,
  appendAcousticSignalInputSchema,
  appendReporterTextInputSchema,
  archivedReportDetailSchema,
  archivedReportPageSchema,
  callSessionIdInputSchema,
  createReporterReportInputSchema,
  endOperatorCallInputSchema,
  listActiveReportsInputSchema,
  listArchivedReportsInputSchema,
  liveKitConnectionSchema,
  operatorCallStateSchema,
  realtimeTranscriptionAccessSchema,
  reportDetailSchema,
  reporterReportDetailSchema,
  reporterReportIdInputSchema,
  reporterReportListSchema,
  reportIdInputSchema,
  reportMapPointsSchema,
  requestReporterCancellationInputSchema,
  reviewAcousticSignalInputSchema,
  startOperatorCallOutputSchema,
  synthesizedSpeechSchema,
  synthesizeSpeechInputSchema,
  updateReportDetailInputSchema,
  updateReporterLocationInputSchema,
} from "./dto";
import { publishReportLiveEvent } from "./live-events";

const reportRepository = new PrismaReportRepository();
const listActiveReports = new ListActiveReports(reportRepository);
const getReportDetail = new GetReportDetail(reportRepository);
const getArchivedReportDetail = new GetArchivedReportDetail(reportRepository);
const listActiveMapPoints = new ListActiveMapPoints(reportRepository);
const listArchivedReports = new ListArchivedReports(reportRepository);
const updateReportDetail = new UpdateReportDetail(reportRepository);
const reviewAcousticSignal = new ReviewAcousticSignal(reportRepository);
const reporterReportRepository = new PrismaReporterReportRepository();
const caseAssistant = new GeminiCaseAssistant();
const createReporterReport = new CreateReporterReport(reporterReportRepository);
const getReporterReport = new GetReporterReport(reporterReportRepository);
const listReporterReports = new ListReporterReports(reporterReportRepository);
const appendReporterText = new AppendReporterText(
  reporterReportRepository,
  caseAssistant
);
const updateReporterLocation = new UpdateReporterLocation(
  reporterReportRepository
);
const appendReporterAcousticSignal = new AppendReporterAcousticSignal(
  reporterReportRepository
);
const endReporterSession = new EndReporterSession(reporterReportRepository);
const requestReporterCancellation = new RequestReporterCancellation(
  reporterReportRepository
);
const acknowledgeReport = new AcknowledgeReport(reporterReportRepository);
const activateReporterSession = new ActivateReporterSession(
  reporterReportRepository
);
const claimAndTakeoverReport = new ClaimAndTakeoverReport(reportRepository);
const liveKitTokenGateway = new LiveKitReporterTokenGateway();
const getReporterLiveKitConnection = new GetReporterLiveKitConnection(
  reporterReportRepository,
  liveKitTokenGateway
);
const voiceAiGateway = new ElevenLabsVoiceAiGateway();
const getRealtimeTranscriptionAccess = new GetRealtimeTranscriptionAccess(
  voiceAiGateway
);
const synthesizeReporterSpeech = new SynthesizeReporterSpeech(voiceAiGateway);
const operatorCallRepository = new PrismaOperatorCallRepository();
const operatorCallTokenGateway = new LiveKitOperatorCallGateway();
const incomingCallNotifier = new WebPushIncomingCallNotifier(
  new PrismaPushSubscriptionRepository(),
  new WebPushGateway()
);
const startOperatorCall = new StartOperatorCall(
  operatorCallRepository,
  operatorCallTokenGateway,
  incomingCallNotifier
);
const getOperatorCallState = new GetOperatorCallState(operatorCallRepository);
const getIncomingOperatorCall = new GetIncomingOperatorCall(
  operatorCallRepository
);
const reconnectOperatorCall = new ReconnectOperatorCall(
  operatorCallRepository,
  operatorCallTokenGateway
);
const acceptIncomingOperatorCall = new AcceptIncomingOperatorCall(
  operatorCallRepository,
  operatorCallTokenGateway
);
const rejectIncomingOperatorCall = new RejectIncomingOperatorCall(
  operatorCallRepository
);
const endIncomingOperatorCall = new EndIncomingOperatorCall(
  operatorCallRepository
);
const cancelOperatorCall = new CancelOperatorCall(operatorCallRepository);
const endOperatorCall = new EndOperatorCall(
  operatorCallRepository,
  new GeminiCallSummaryGenerator()
);

const toUpdateTrpcError = (error: unknown): never => {
  if (error instanceof ReportUpdateApplicationError) {
    throw new TRPCError({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
};

const toOperatorCallTrpcError = (error: unknown): never => {
  if (error instanceof OperatorCallError) {
    throw new TRPCError({ code: error.code, message: error.message });
  }
  throw error;
};

export const reportRouter = router({
  acceptIncomingCall: completedReporterProcedure
    .input(callSessionIdInputSchema)
    .output(startOperatorCallOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await acceptIncomingOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  acknowledge: completedReporterProcedure
    .input(acknowledgeReporterInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await acknowledgeReport.execute(
        input.reportId,
        ctx.session.user.id,
        input.type
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  activateSession: completedReporterProcedure
    .input(reporterReportIdInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await activateReporterSession.execute(
        input.reportId,
        ctx.session.user.id
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  appendAcousticSignal: completedReporterProcedure
    .input(appendAcousticSignalInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await appendReporterAcousticSignal.execute({
        ...input,
        endedAt: new Date(input.endedAt),
        reporterId: ctx.session.user.id,
        startedAt: new Date(input.startedAt),
      });
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  appendReporterText: completedReporterProcedure
    .input(appendReporterTextInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await appendReporterText.execute({
        ...input,
        reporterId: ctx.session.user.id,
      });
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  cancelOperatorCall: operatorProcedure
    .input(callSessionIdInputSchema)
    .output(operatorCallStateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await cancelOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  claimAndTakeover: operatorProcedure
    .input(reportIdInputSchema)
    .output(reportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const detail = await claimAndTakeoverReport.execute(
          input.reportId,
          ctx.session.user.id
        );
        await publishReportLiveEvent(
          {
            reportId: detail.id,
            type: "report.updated",
            updatedAt: detail.updatedAt,
          },
          { notifyReporter: true }
        );
        return detail;
      } catch (error) {
        return toUpdateTrpcError(error);
      }
    }),
  create: completedReporterProcedure
    .input(createReporterReportInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await createReporterReport.execute({
        ...input,
        reporterId: ctx.session.user.id,
      });
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.created",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  endIncomingCall: completedReporterProcedure
    .input(callSessionIdInputSchema)
    .output(operatorCallStateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await endIncomingOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  endOperatorCall: operatorProcedure
    .input(endOperatorCallInputSchema)
    .output(operatorCallStateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await endOperatorCall.execute({
          ...input,
          operatorId: ctx.session.user.id,
        });
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  endSession: completedReporterProcedure
    .input(reporterReportIdInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await endReporterSession.execute(
        input.reportId,
        ctx.session.user.id
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  getArchivedDetail: operatorProcedure
    .input(reportIdInputSchema)
    .output(archivedReportDetailSchema)
    .query(async ({ input }) => {
      const report = await getArchivedReportDetail.execute(input.reportId);

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Archived report not found",
        });
      }

      return report;
    }),
  getDetail: operatorProcedure
    .input(reportIdInputSchema)
    .output(reportDetailSchema)
    .query(async ({ input }) => {
      const report = await getReportDetail.execute(input.reportId);

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active report not found",
        });
      }

      return report;
    }),
  getIncomingCall: completedReporterProcedure
    .input(callSessionIdInputSchema)
    .output(operatorCallStateSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await getIncomingOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  getLiveKitToken: completedReporterProcedure
    .input(reporterReportIdInputSchema)
    .output(liveKitConnectionSchema)
    .mutation(({ ctx, input }) =>
      getReporterLiveKitConnection.execute(input.reportId, ctx.session.user.id)
    ),
  getMine: completedReporterProcedure
    .input(reporterReportIdInputSchema)
    .output(reporterReportDetailSchema)
    .query(async ({ ctx, input }) => {
      const report = await getReporterReport.execute(
        input.reportId,
        ctx.session.user.id
      );
      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Laporan tidak ditemukan",
        });
      }
      return report;
    }),
  getOperatorCallConnection: operatorProcedure
    .input(callSessionIdInputSchema)
    .output(liveKitConnectionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await reconnectOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  getOperatorCallState: operatorProcedure
    .input(callSessionIdInputSchema)
    .output(operatorCallStateSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await getOperatorCallState.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  getOperatorTranscriptionToken: operatorProcedure
    .output(realtimeTranscriptionAccessSchema)
    .mutation(() => getRealtimeTranscriptionAccess.execute()),
  getRealtimeTranscriptionToken: completedReporterProcedure
    .output(realtimeTranscriptionAccessSchema)
    .mutation(() => getRealtimeTranscriptionAccess.execute()),
  listActive: operatorProcedure
    .input(listActiveReportsInputSchema)
    .output(activeReportPageSchema)
    .query(({ input }) => listActiveReports.execute(input)),
  listActiveMapPoints: operatorProcedure
    .output(reportMapPointsSchema)
    .query(() => listActiveMapPoints.execute()),
  listArchived: operatorProcedure
    .input(listArchivedReportsInputSchema)
    .output(archivedReportPageSchema)
    .query(({ input }) => listArchivedReports.execute(input)),
  listMine: completedReporterProcedure
    .output(reporterReportListSchema)
    .query(({ ctx }) => listReporterReports.execute(ctx.session.user.id)),
  rejectIncomingCall: completedReporterProcedure
    .input(callSessionIdInputSchema)
    .output(operatorCallStateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await rejectIncomingOperatorCall.execute(
          input.callSessionId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  requestCancellation: completedReporterProcedure
    .input(requestReporterCancellationInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await requestReporterCancellation.execute(
        input.reportId,
        ctx.session.user.id,
        input.reason
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
  reviewAcousticSignal: operatorProcedure
    .input(reviewAcousticSignalInputSchema)
    .output(reportDetailSchema)
    .mutation(async ({ input }) => {
      const detail = await reviewAcousticSignal.execute(
        input.reportId,
        input.signalId,
        input.status
      );
      await publishReportLiveEvent({
        reportId: detail.id,
        type: "report.updated",
        updatedAt: detail.updatedAt,
      });
      return detail;
    }),
  startOperatorCall: operatorProcedure
    .input(reportIdInputSchema)
    .output(startOperatorCallOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await startOperatorCall.execute(
          input.reportId,
          ctx.session.user.id
        );
      } catch (error) {
        return toOperatorCallTrpcError(error);
      }
    }),
  synthesizeSpeech: completedReporterProcedure
    .input(synthesizeSpeechInputSchema)
    .output(synthesizedSpeechSchema)
    .mutation(({ input }) => synthesizeReporterSpeech.execute(input.text)),
  updateDetail: operatorProcedure
    .input(updateReportDetailInputSchema)
    .output(reportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const detail = await updateReportDetail.execute({
          detail: input.detail,
          expectedUpdatedAt: new Date(input.expectedUpdatedAt),
          operatorId: ctx.session.user.id,
          reportId: input.reportId,
        });
        await publishReportLiveEvent(
          {
            reportId: input.reportId,
            type: "report.updated",
            updatedAt: detail.updatedAt,
          },
          { notifyReporter: true }
        );
        return detail;
      } catch (error) {
        return toUpdateTrpcError(error);
      }
    }),
  updateLocation: completedReporterProcedure
    .input(updateReporterLocationInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await updateReporterLocation.execute(
        input.reportId,
        ctx.session.user.id,
        {
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
        }
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
});
