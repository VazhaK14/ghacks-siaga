import type { ReporterProfileDetail } from "../domain/entities";
import type { ProfileRepository } from "../domain/profile-repository";

export class GetReporterProfile {
  private readonly repository: ProfileRepository;

  constructor(repository: ProfileRepository) {
    this.repository = repository;
  }

  execute(userId: string): Promise<ReporterProfileDetail> {
    return this.repository.findByUserId(userId);
  }
}
