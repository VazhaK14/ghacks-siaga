import { TRPCError } from "@trpc/server";

import { operatorProcedure, router } from "../../../index";
import { GetArchivedReportDetail } from "../application/get-archived-report-detail";
import { GetReportDetail } from "../application/get-report-detail";
import { ListActiveMapPoints } from "../application/list-active-map-points";
import { ListActiveReports } from "../application/list-active-reports";
import { ListArchivedReports } from "../application/list-archived-reports";
import { PrismaReportRepository } from "../infrastructure/prisma-report-repository";
import {
  activeReportPageSchema,
  archivedReportDetailSchema,
  archivedReportPageSchema,
  listActiveReportsInputSchema,
  listArchivedReportsInputSchema,
  reportDetailSchema,
  reportIdInputSchema,
  reportMapPointsSchema,
} from "./dto";

const reportRepository = new PrismaReportRepository();
const listActiveReports = new ListActiveReports(reportRepository);
const getReportDetail = new GetReportDetail(reportRepository);
const getArchivedReportDetail = new GetArchivedReportDetail(reportRepository);
const listActiveMapPoints = new ListActiveMapPoints(reportRepository);
const listArchivedReports = new ListArchivedReports(reportRepository);

export const reportRouter = router({
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
});
