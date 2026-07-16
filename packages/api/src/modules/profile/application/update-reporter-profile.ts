import type { ReporterProfileDetail } from "../domain/entities";
import type {
  ProfileRepository,
  UpdateReporterProfileInput,
} from "../domain/profile-repository";

export class UpdateReporterProfile {
  private readonly repository: ProfileRepository;

  constructor(repository: ProfileRepository) {
    this.repository = repository;
  }

  execute(input: UpdateReporterProfileInput): Promise<ReporterProfileDetail> {
    return this.repository.update(input);
  }
}
