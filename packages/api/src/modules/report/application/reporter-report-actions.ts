import type {
  AppendReporterTextInput,
  CaseAssistant,
  CreateReporterReportInput,
  ReporterAcknowledgementType,
  ReporterInteractionMode,
  ReporterReportDetail,
  ReporterReportListItem,
  ReporterReportRepository,
} from "../domain/reporter-report";

export class CreateReporterReport {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(input: CreateReporterReportInput): Promise<ReporterReportDetail> {
    return this.repository.create(input);
  }
}

export class GetReporterReport {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    reporterId: string
  ): Promise<ReporterReportDetail | null> {
    return this.repository.findMine(reportId, reporterId);
  }
}

export class ListReporterReports {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(reporterId: string): Promise<ReporterReportListItem[]> {
    return this.repository.listMine(reporterId);
  }
}

export class AppendReporterText {
  private readonly repository: ReporterReportRepository;
  private readonly assistant: CaseAssistant;

  constructor(repository: ReporterReportRepository, assistant: CaseAssistant) {
    this.repository = repository;
    this.assistant = assistant;
  }

  async execute(input: AppendReporterTextInput): Promise<ReporterReportDetail> {
    const report = await this.repository.appendReporterText(input);
    const update = await this.assistant.analyze(report);
    if (!update) {
      return report;
    }
    return this.repository.applyAssistantUpdate(report.id, update);
  }
}

export class UpdateReporterLocation {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    reporterId: string,
    location: { address?: string; latitude: number; longitude: number }
  ): Promise<ReporterReportDetail> {
    return this.repository.updateLocation(reportId, reporterId, location);
  }
}

export class SwitchReporterMode {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    reporterId: string,
    mode: ReporterInteractionMode
  ): Promise<ReporterReportDetail> {
    return this.repository.switchMode(reportId, reporterId, mode);
  }
}

export class EndReporterSession {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(reportId: string, reporterId: string): Promise<ReporterReportDetail> {
    return this.repository.endSession(reportId, reporterId);
  }
}

export class ActivateReporterSession {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(reportId: string, reporterId: string): Promise<ReporterReportDetail> {
    return this.repository.activateSession(reportId, reporterId);
  }
}

export class RequestReporterCancellation {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    reporterId: string,
    reason: string
  ): Promise<ReporterReportDetail> {
    return this.repository.requestCancellation(reportId, reporterId, reason);
  }
}

export class AcknowledgeReport {
  private readonly repository: ReporterReportRepository;

  constructor(repository: ReporterReportRepository) {
    this.repository = repository;
  }

  execute(
    reportId: string,
    reporterId: string,
    type: ReporterAcknowledgementType
  ): Promise<ReporterReportDetail> {
    return this.repository.acknowledge(reportId, reporterId, type);
  }
}
