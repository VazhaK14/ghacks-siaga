import { TRPCError } from "@trpc/server";

import { operatorProcedure, router } from "../../../index";
import { GetReportDetail } from "../application/get-report-detail";
import { ListActiveMapPoints } from "../application/list-active-map-points";
import { ListActiveReports } from "../application/list-active-reports";
import { PrismaReportRepository } from "../infrastructure/prisma-report-repository";
import {
  activeReportPageSchema,
  listActiveReportsInputSchema,
  reportDetailSchema,
  reportIdInputSchema,
  reportMapPointsSchema,
} from "./dto";

const reportRepository = new PrismaReportRepository();
const listActiveReports = new ListActiveReports(reportRepository);
const getReportDetail = new GetReportDetail(reportRepository);
const listActiveMapPoints = new ListActiveMapPoints(reportRepository);

export const reportRouter = router({
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
});
