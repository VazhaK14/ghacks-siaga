import type {
  LiveKitConnection,
  LiveKitTokenGateway,
  ReporterReportRepository,
} from "../domain/reporter-report";

export class GetReporterLiveKitConnection {
  private readonly repository: ReporterReportRepository;
  private readonly gateway: LiveKitTokenGateway;

  constructor(
    repository: ReporterReportRepository,
    gateway: LiveKitTokenGateway
  ) {
    this.repository = repository;
    this.gateway = gateway;
  }

  async execute(
    reportId: string,
    reporterId: string
  ): Promise<LiveKitConnection> {
    const session = await this.repository.prepareLiveSession(
      reportId,
      reporterId
    );
    return this.gateway.createReporterConnection({
      ...session,
      reporterId,
    });
  }
}
