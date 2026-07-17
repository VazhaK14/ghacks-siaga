import type { ReporterProfileDetail } from "./entities";

export interface UpdateReporterProfileInput {
  profile: Omit<ReporterProfileDetail, "isComplete">;
  userId: string;
}

export interface ProfileRepository {
  findByUserId: (userId: string) => Promise<ReporterProfileDetail>;
  update: (input: UpdateReporterProfileInput) => Promise<ReporterProfileDetail>;
}
