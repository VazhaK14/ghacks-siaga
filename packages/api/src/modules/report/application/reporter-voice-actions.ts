import type {
  RealtimeTranscriptionAccess,
  SynthesizedSpeech,
  VoiceAiGateway,
} from "../domain/reporter-report";

export class GetRealtimeTranscriptionAccess {
  private readonly gateway: VoiceAiGateway;

  constructor(gateway: VoiceAiGateway) {
    this.gateway = gateway;
  }

  execute(): Promise<RealtimeTranscriptionAccess> {
    return this.gateway.createRealtimeTranscriptionAccess();
  }
}

export class SynthesizeReporterSpeech {
  private readonly gateway: VoiceAiGateway;

  constructor(gateway: VoiceAiGateway) {
    this.gateway = gateway;
  }

  execute(text: string): Promise<SynthesizedSpeech> {
    return this.gateway.synthesize(text);
  }
}
