import { operatorProcedure, router } from "../../../index";
import { GetDashboardOverview } from "../application/get-dashboard-overview";
import { PrismaOverviewRepository } from "../infrastructure/prisma-overview-repository";
import { dashboardOverviewInputSchema, dashboardOverviewSchema } from "./dto";

const repository = new PrismaOverviewRepository();
const getDashboardOverview = new GetDashboardOverview(repository);

export const overviewRouter = router({
  getDashboard: operatorProcedure
    .input(dashboardOverviewInputSchema)
    .output(dashboardOverviewSchema)
    .query(({ input }) => getDashboardOverview.execute(input.period)),
});
