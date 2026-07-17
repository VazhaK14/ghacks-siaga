import type {
  CallTranscriptSegment,
  IncomingCallNotifier,
  OperatorCallConnection,
  OperatorCallRepository,
  OperatorCallState,
  OperatorCallSummaryGenerator,
  OperatorCallTokenGateway,
} from "../domain/operator-call";

export class StartOperatorCall {
  private readonly notifier: IncomingCallNotifier;
  private readonly repository: OperatorCallRepository;
  private readonly tokenGateway: OperatorCallTokenGateway;

  constructor(
    repository: OperatorCallRepository,
    tokenGateway: OperatorCallTokenGateway,
    notifier: IncomingCallNotifier
  ) {
    this.repository = repository;
    this.tokenGateway = tokenGateway;
    this.notifier = notifier;
  }

  async execute(
    reportId: string,
    operatorId: string
  ): Promise<{
    call: OperatorCallState;
    connection: OperatorCallConnection;
  }> {
    const startedCall = await this.repository.start(reportId, operatorId);
    const connection = await this.tokenGateway.createConnection({
      callSessionId: startedCall.state.callSessionId,
      participantId: operatorId,
      participantRole: "operator",
      roomName: startedCall.roomName,
    });
    if (!connection.available) {
      const endedCall = await this.repository.endForOperator(
        startedCall.state.callSessionId,
        operatorId
      );
      return { call: endedCall, connection };
    }
    await this.notifier
      .notify({
        callSessionId: startedCall.state.callSessionId,
        reportId,
        reportTitle: null,
      })
      .catch(() => undefined);
    return { call: startedCall.state, connection };
  }
}

export class GetOperatorCallState {
  private readonly repository: OperatorCallRepository;

  constructor(repository: OperatorCallRepository) {
    this.repository = repository;
  }

  execute(
    callSessionId: string,
    operatorId: string
  ): Promise<OperatorCallState> {
    return this.repository.getForOperator(callSessionId, operatorId);
  }
}

export class GetIncomingOperatorCall {
  private readonly repository: OperatorCallRepository;

  constructor(repository: OperatorCallRepository) {
    this.repository = repository;
  }

  execute(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    return this.repository.getForReporter(callSessionId, reporterId);
  }
}

export class ReconnectOperatorCall {
  private readonly repository: OperatorCallRepository;
  private readonly tokenGateway: OperatorCallTokenGateway;

  constructor(
    repository: OperatorCallRepository,
    tokenGateway: OperatorCallTokenGateway
  ) {
    this.repository = repository;
    this.tokenGateway = tokenGateway;
  }

  async execute(
    callSessionId: string,
    operatorId: string
  ): Promise<OperatorCallConnection> {
    const roomName = await this.repository.getRoomForOperator(
      callSessionId,
      operatorId
    );
    return this.tokenGateway.createConnection({
      callSessionId,
      participantId: operatorId,
      participantRole: "operator",
      roomName,
    });
  }
}

export class AcceptIncomingOperatorCall {
  private readonly repository: OperatorCallRepository;
  private readonly tokenGateway: OperatorCallTokenGateway;

  constructor(
    repository: OperatorCallRepository,
    tokenGateway: OperatorCallTokenGateway
  ) {
    this.repository = repository;
    this.tokenGateway = tokenGateway;
  }

  async execute(
    callSessionId: string,
    reporterId: string
  ): Promise<{
    call: OperatorCallState;
    connection: OperatorCallConnection;
  }> {
    const accepted = await this.repository.acceptForReporter(
      callSessionId,
      reporterId
    );
    const connection = await this.tokenGateway.createConnection({
      callSessionId,
      participantId: reporterId,
      participantRole: "reporter",
      roomName: accepted.roomName,
    });
    return { call: accepted.state, connection };
  }
}

export class RejectIncomingOperatorCall {
  private readonly repository: OperatorCallRepository;

  constructor(repository: OperatorCallRepository) {
    this.repository = repository;
  }

  execute(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    return this.repository.rejectForReporter(callSessionId, reporterId);
  }
}

export class EndIncomingOperatorCall {
  private readonly repository: OperatorCallRepository;

  constructor(repository: OperatorCallRepository) {
    this.repository = repository;
  }

  execute(
    callSessionId: string,
    reporterId: string
  ): Promise<OperatorCallState> {
    return this.repository.endForReporter(callSessionId, reporterId);
  }
}

export class CancelOperatorCall {
  private readonly repository: OperatorCallRepository;

  constructor(repository: OperatorCallRepository) {
    this.repository = repository;
  }

  execute(
    callSessionId: string,
    operatorId: string
  ): Promise<OperatorCallState> {
    return this.repository.endForOperator(callSessionId, operatorId);
  }
}

export class EndOperatorCall {
  private readonly repository: OperatorCallRepository;
  private readonly summaryGenerator: OperatorCallSummaryGenerator;

  constructor(
    repository: OperatorCallRepository,
    summaryGenerator: OperatorCallSummaryGenerator
  ) {
    this.repository = repository;
    this.summaryGenerator = summaryGenerator;
  }

  async execute(input: {
    callSessionId: string;
    operatorId: string;
    transcript: CallTranscriptSegment[];
  }): Promise<OperatorCallState> {
    const endedCall = await this.repository.endForOperator(
      input.callSessionId,
      input.operatorId
    );
    if (endedCall.summary) {
      return endedCall;
    }
    const context = await this.repository.findContext(input.callSessionId);
    const summary = await this.summaryGenerator.generate({
      context,
      transcript: input.transcript,
    });
    return this.repository.saveSummary(input.callSessionId, summary);
  }
}
