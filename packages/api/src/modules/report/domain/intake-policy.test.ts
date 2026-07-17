import { describe, expect, it } from "bun:test";
import { decideIntake } from "./intake-policy";
import type {
  AssistantReportUpdate,
  ReporterReportDetail,
} from "./reporter-report";

const report = {
  intakeQuestionCount: 0,
  intakeStatus: "COLLECTING",
  latitude: -6.2,
  longitude: 106.8,
} as ReporterReportDetail;

const completeUpdate: AssistantReportUpdate = {
  category: "HIGH",
  extractedData: {
    immediateDanger: "Pelaku sudah pergi",
    peopleAffected: "Satu korban",
  },
  incidentType: "CRIME",
  intakeRecommendation: "FINALIZE",
  missingCriticalFields: [],
  recommendation: null,
  reply: "Baik.",
  summary: "Satu korban kriminal dan pelaku sudah pergi.",
  title: "Laporan kriminal",
};

describe("decideIntake", () => {
  it("finalizes when all critical information exists", () => {
    expect(decideIntake(report, completeUpdate)).toEqual({
      missingCriticalFields: [],
      reason: "ENOUGH_INFORMATION",
      shouldFinalize: true,
    });
  });

  it("finalizes an urgent partial report immediately", () => {
    const decision = decideIntake(report, {
      ...completeUpdate,
      category: "CRITICAL",
      extractedData: { immediateDanger: "Terdengar tembakan" },
      incidentType: null,
    });

    expect(decision.shouldFinalize).toBe(true);
    expect(decision.reason).toBe("URGENT_PARTIAL");
    expect(decision.missingCriticalFields).toContain("INCIDENT");
  });

  it("stops after six intake questions", () => {
    const decision = decideIntake(
      { ...report, intakeQuestionCount: 5 } as ReporterReportDetail,
      {
        ...completeUpdate,
        extractedData: {},
        incidentType: null,
        intakeRecommendation: "CONTINUE",
      }
    );

    expect(decision.reason).toBe("QUESTION_LIMIT");
    expect(decision.shouldFinalize).toBe(true);
  });

  it("never re-finalizes support chat", () => {
    const decision = decideIntake(
      { ...report, intakeStatus: "FINALIZED" } as ReporterReportDetail,
      completeUpdate
    );

    expect(decision.shouldFinalize).toBe(false);
    expect(decision.reason).toBeNull();
  });
});
