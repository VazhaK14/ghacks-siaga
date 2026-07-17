import { describe, expect, test } from "bun:test";

import {
  assistantDeliveryForSource,
  isReporterTextSourceAllowed,
  reporterMessageChannelForSource,
  reporterMessageTypeForSource,
} from "./reporter-message-policy";

describe("reporter message policy", () => {
  test("locks collecting transcripts to their selected interaction mode", () => {
    expect(
      isReporterTextSourceAllowed("VOICE", "COLLECTING", "VOICE_TRANSCRIPT")
    ).toBeTrue();
    expect(
      isReporterTextSourceAllowed("SILENT", "COLLECTING", "SILENT_TRANSCRIPT")
    ).toBeTrue();
    expect(
      isReporterTextSourceAllowed("VOICE", "COLLECTING", "SILENT_TRANSCRIPT")
    ).toBeFalse();
  });

  test("allows spoken support only for finalized voice reports", () => {
    expect(
      isReporterTextSourceAllowed(
        "VOICE",
        "FINALIZED",
        "VOICE_SUPPORT_TRANSCRIPT"
      )
    ).toBeTrue();
    expect(
      isReporterTextSourceAllowed(
        "SILENT",
        "FINALIZED",
        "VOICE_SUPPORT_TRANSCRIPT"
      )
    ).toBeFalse();
    expect(
      isReporterTextSourceAllowed("SILENT", "FINALIZED", "SUPPORT_CHAT")
    ).toBeTrue();
  });

  test("persists transcripts and chooses the correct assistant delivery", () => {
    expect(
      reporterMessageTypeForSource("SILENT_TRANSCRIPT", "COLLECTING")
    ).toBe("TRANSCRIPT_FINAL");
    expect(
      reporterMessageTypeForSource("VOICE_SUPPORT_TRANSCRIPT", "FINALIZED")
    ).toBe("SUPPLEMENTAL_TEXT");
    expect(
      reporterMessageChannelForSource("VOICE_SUPPORT_TRANSCRIPT", "VOICE")
    ).toBe("VOICE");
    expect(assistantDeliveryForSource("SILENT_TRANSCRIPT")).toBe("SILENT");
    expect(assistantDeliveryForSource("VOICE_TRANSCRIPT")).toBe("VOICE");
  });
});
