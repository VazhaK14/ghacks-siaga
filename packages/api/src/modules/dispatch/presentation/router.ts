import { TRPCError } from "@trpc/server";

import { operatorProcedure, router } from "../../../index";
import { publishReportLiveEvent } from "../../report/presentation/live-events";
import { AdvanceDispatchSimulation } from "../application/advance-dispatch-simulation";
import { CloseReport } from "../application/close-report";
import { CreateDispatch } from "../application/create-dispatch";
import { GetReportDispatch } from "../application/get-report-dispatch";
import { ListAgencyBoard } from "../application/list-agency-board";
import { ResolveDispatch } from "../application/resolve-dispatch";
import {
  DispatchApplicationError,
  type DispatchTracking,
} from "../domain/entities";
import { DispatchSimulationScheduler } from "../infrastructure/dispatch-simulation-scheduler";
import { PrismaDispatchRepository } from "../infrastructure/prisma-dispatch-repository";
import {
  agencyBoardSchema,
  closeReportInputSchema,
  closeReportResultSchema,
  createDispatchInputSchema,
  dispatchIdInputSchema,
  dispatchTrackingSchema,
  reportDispatchInputSchema,
  reportDispatchOverviewSchema,
} from "./dto";

const repository = new PrismaDispatchRepository();
const getReportDispatch = new GetReportDispatch(repository);
const createDispatch = new CreateDispatch(repository);
const advanceDispatch = new AdvanceDispatchSimulation(repository);
const resolveDispatch = new ResolveDispatch(repository);
const listAgencyBoard = new ListAgencyBoard(repository);
const closeReport = new CloseReport(repository);

const publishDispatchEvent = async (
  dispatch: DispatchTracking,
  type:
    | "dispatch.created"
    | "dispatch.updated"
    | "dispatch.arrived"
    | "dispatch.completed"
): Promise<void> => {
  await publishReportLiveEvent(
    {
      dispatchId: dispatch.id,
      reportId: dispatch.reportId,
      type,
      updatedAt: new Date().toISOString(),
    },
    { notifyReporter: true }
  );
};

const scheduler = new DispatchSimulationScheduler(
  (dispatchId) => advanceDispatch.execute(dispatchId),
  publishDispatchEvent
);

const toTrpcError = (error: unknown): never => {
  if (error instanceof DispatchApplicationError) {
    throw new TRPCError({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
};

export const dispatchRouter = router({
  closeReport: operatorProcedure
    .input(closeReportInputSchema)
    .output(closeReportResultSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await closeReport.execute({
          ...input,
          operatorId: ctx.session.user.id,
        });
        if (result.cancelledDispatchId) {
          scheduler.cancel(result.cancelledDispatchId);
          await publishReportLiveEvent(
            {
              dispatchId: result.cancelledDispatchId,
              reportId: result.reportId,
              type: "dispatch.cancelled",
              updatedAt: result.closedAt,
            },
            { notifyReporter: true }
          );
        }
        await publishReportLiveEvent(
          {
            reportId: result.reportId,
            type: "report.removed",
            updatedAt: result.closedAt,
          },
          { notifyReporter: true }
        );
        return result;
      } catch (error) {
        return toTrpcError(error);
      }
    }),
  create: operatorProcedure
    .input(createDispatchInputSchema)
    .output(dispatchTrackingSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const dispatch = await createDispatch.execute({
          ...input,
          operatorId: ctx.session.user.id,
        });
        scheduler.resume(dispatch);
        await publishDispatchEvent(dispatch, "dispatch.created");
        return dispatch;
      } catch (error) {
        return toTrpcError(error);
      }
    }),
  getReportDispatch: operatorProcedure
    .input(reportDispatchInputSchema)
    .output(reportDispatchOverviewSchema)
    .query(async ({ input }) => {
      const overview = await getReportDispatch.execute(input.reportId);
      if (!overview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Laporan tidak ditemukan",
        });
      }
      if (overview.activeDispatch) {
        scheduler.resume(overview.activeDispatch);
      }
      return overview;
    }),
  listAgencyBoard: operatorProcedure
    .output(agencyBoardSchema)
    .query(async () => {
      const agencies = await listAgencyBoard.execute();
      for (const agency of agencies) {
        if (agency.activeDispatch) {
          scheduler.resume(agency.activeDispatch);
        }
      }
      return agencies;
    }),
  resolve: operatorProcedure
    .input(dispatchIdInputSchema)
    .output(dispatchTrackingSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const dispatch = await resolveDispatch.execute({
          dispatchId: input.dispatchId,
          operatorId: ctx.session.user.id,
        });
        await publishDispatchEvent(dispatch, "dispatch.completed");
        await publishReportLiveEvent(
          {
            reportId: dispatch.reportId,
            type: "report.removed",
            updatedAt: new Date().toISOString(),
          },
          { notifyReporter: true }
        );
        return dispatch;
      } catch (error) {
        return toTrpcError(error);
      }
    }),
});
