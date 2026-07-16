import { reporterProcedure, router } from "../../../index";
import { GetReporterProfile } from "../application/get-reporter-profile";
import { UpdateReporterProfile } from "../application/update-reporter-profile";
import { PrismaProfileRepository } from "../infrastructure/prisma-profile-repository";
import {
  reporterProfileOutputSchema,
  reporterProfileUpdateSchema,
} from "./dto";

const repository = new PrismaProfileRepository();
const getReporterProfile = new GetReporterProfile(repository);
const updateReporterProfile = new UpdateReporterProfile(repository);

export const profileRouter = router({
  get: reporterProcedure
    .output(reporterProfileOutputSchema)
    .query(({ ctx }) => getReporterProfile.execute(ctx.session.user.id)),
  update: reporterProcedure
    .input(reporterProfileUpdateSchema)
    .output(reporterProfileOutputSchema)
    .mutation(({ ctx, input }) =>
      updateReporterProfile.execute({
        profile: input,
        userId: ctx.session.user.id,
      })
    ),
});
