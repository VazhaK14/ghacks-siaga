import { TRPCError } from "@trpc/server";

import { operatorProcedure, reporterProcedure, router } from "../../../index";
import { ClaimAndTakeoverReport } from "../application/claim-and-takeover-report";
import { GetArchivedReportDetail } from "../application/get-archived-report-detail";
import { GetReportDetail } from "../application/get-report-detail";
import { GetReporterLiveKitConnection } from "../application/get-reporter-livekit-connection";
import { ListActiveMapPoints } from "../application/list-active-map-points";
import { ListActiveReports } from "../application/list-active-reports";
import { ListArchivedReports } from "../application/list-archived-reports";
import {
  AcknowledgeReport,
  ActivateReporterSession,
  AppendReporterText,
  CreateReporterReport,
  EndReporterSession,
  GetReporterReport,
  ListReporterReports,
  RequestReporterCancellation,
  SwitchReporterMode,
  UpdateReporterLocation,
} from "../application/reporter-report-actions";
import { UpdateReportDetail } from "../application/update-report-detail";
import { ReportUpdateApplicationError } from "../domain/entities";
import { LiveKitReporterTokenGateway } from "../infrastructure/livekit-token-gateway";
import { OpenRouterCaseAssistant } from "../infrastructure/openrouter-case-assistant";
import { PrismaReportRepository } from "../infrastructure/prisma-report-repository";
import { PrismaReporterReportRepository } from "../infrastructure/prisma-reporter-report-repository";
import {
  acknowledgeReporterInputSchema,
  activeReportPageSchema,
  appendReporterTextInputSchema,
  archivedReportDetailSchema,
  archivedReportPageSchema,
  createReporterReportInputSchema,
  listActiveReportsInputSchema,
  listArchivedReportsInputSchema,
  liveKitConnectionSchema,
  reportDetailSchema,
  reporterReportDetailSchema,
  reporterReportIdInputSchema,
  reporterReportListSchema,
  reportIdInputSchema,
  reportMapPointsSchema,
  requestReporterCancellationInputSchema,
  switchReporterModeInputSchema,
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
const reporterReportRepository = new PrismaReporterReportRepository();
const caseAssistant = new OpenRouterCaseAssistant();
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
const switchReporterMode = new SwitchReporterMode(reporterReportRepository);
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

const toUpdateTrpcError = (error: unknown): never => {
  if (error instanceof ReportUpdateApplicationError) {
    throw new TRPCError({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
};

export const reportRouter = router({
  acknowledge: reporterProcedure
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
  activateSession: reporterProcedure
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
  appendReporterText: reporterProcedure
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
  claimAndTakeover: operatorProcedure
    .input(reportIdInputSchema)
    .output(reportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const detail = await claimAndTakeoverReport.execute(
          input.reportId,
          ctx.session.user.id
        );
        await publishReportLiveEvent({
          reportId: detail.id,
          type: "report.updated",
          updatedAt: detail.updatedAt,
        });
        return detail;
      } catch (error) {
        return toUpdateTrpcError(error);
      }
    }),
  create: reporterProcedure
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
  endSession: reporterProcedure
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
  getLiveKitToken: reporterProcedure
    .input(reporterReportIdInputSchema)
    .output(liveKitConnectionSchema)
    .mutation(({ ctx, input }) =>
      getReporterLiveKitConnection.execute(input.reportId, ctx.session.user.id)
    ),
  getMine: reporterProcedure
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
  listMine: reporterProcedure
    .output(reporterReportListSchema)
    .query(({ ctx }) => listReporterReports.execute(ctx.session.user.id)),
  requestCancellation: reporterProcedure
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
  switchMode: reporterProcedure
    .input(switchReporterModeInputSchema)
    .output(reporterReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await switchReporterMode.execute(
        input.reportId,
        ctx.session.user.id,
        input.interactionMode
      );
      await publishReportLiveEvent({
        reportId: report.id,
        type: "report.updated",
        updatedAt: report.updatedAt,
      });
      return report;
    }),
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
        await publishReportLiveEvent({
          reportId: input.reportId,
          type: "report.updated",
          updatedAt: detail.updatedAt,
        });
        return detail;
      } catch (error) {
        return toUpdateTrpcError(error);
      }
    }),
  updateLocation: reporterProcedure
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
