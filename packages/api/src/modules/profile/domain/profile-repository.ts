import type { ReporterProfileDetail } from "./entities";

export interface UpdateReporterProfileInput {
  profile: ReporterProfileDetail;
  userId: string;
}

export interface ProfileRepository {
  findByUserId: (userId: string) => Promise<ReporterProfileDetail>;
  update: (input: UpdateReporterProfileInput) => Promise<ReporterProfileDetail>;
}
