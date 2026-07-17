import type {
  AssistantReportUpdate,
  CriticalIntakeField,
  IntakeDecision,
  ReporterReportDetail,
} from "./reporter-report";

const MAX_INTAKE_QUESTIONS = 6;
const URGENT_SIGNAL_PATTERN =
  /tembakan|senjata|ledakan|tidak bernapas|tidak bernafas|terjebak|api besar|pendarahan hebat|perdarahan hebat/i;

const hasValue = (
  extractedData: Record<string, string>,
  keys: string[]
): boolean => keys.some((key) => Boolean(extractedData[key]?.trim()));

const getMissingCriticalFields = (
  report: ReporterReportDetail,
  update: AssistantReportUpdate
): CriticalIntakeField[] => {
  const missing: CriticalIntakeField[] = [];
  const { extractedData } = update;

  if (
    !(
      update.incidentType ||
      hasValue(extractedData, ["incidentDescription", "incident"])
    )
  ) {
    missing.push("INCIDENT");
  }
  if (
    (report.latitude === null || report.longitude === null) &&
    !hasValue(extractedData, ["location", "address"])
  ) {
    missing.push("LOCATION");
  }
  if (
    !hasValue(extractedData, [
      "immediateDanger",
      "ongoingThreat",
      "currentSituation",
    ])
  ) {
    missing.push("IMMEDIATE_DANGER");
  }
  if (
    !hasValue(extractedData, [
      "peopleAffected",
      "victimCount",
      "victimCondition",
    ])
  ) {
    missing.push("PEOPLE_AFFECTED");
  }

  return missing;
};

const containsUrgentSignal = (update: AssistantReportUpdate): boolean => {
  if (
    update.category === "CRITICAL" ||
    update.intakeRecommendation === "URGENT_FINALIZE"
  ) {
    return true;
  }
  return Object.values(update.extractedData).some((value) =>
    URGENT_SIGNAL_PATTERN.test(value)
  );
};

export const decideIntake = (
  report: ReporterReportDetail,
  update: AssistantReportUpdate
): IntakeDecision => {
  const missingCriticalFields = getMissingCriticalFields(report, update);
  if (report.intakeStatus !== "COLLECTING") {
    return {
      missingCriticalFields,
      reason: null,
      shouldFinalize: false,
    };
  }

  if (containsUrgentSignal(update)) {
    return {
      missingCriticalFields,
      reason:
        missingCriticalFields.length === 0
          ? "ENOUGH_INFORMATION"
          : "URGENT_PARTIAL",
      shouldFinalize: true,
    };
  }

  if (missingCriticalFields.length === 0) {
    return {
      missingCriticalFields,
      reason: "ENOUGH_INFORMATION",
      shouldFinalize: true,
    };
  }

  if (report.intakeQuestionCount + 1 >= MAX_INTAKE_QUESTIONS) {
    return {
      missingCriticalFields,
      reason: "QUESTION_LIMIT",
      shouldFinalize: true,
    };
  }

  return {
    missingCriticalFields,
    reason: null,
    shouldFinalize: false,
  };
};

export const INTAKE_FINALIZED_MESSAGE =
  "Informasi utama sudah cukup. Saya akan mengirim laporan ini ke operator sekarang. Tetap di sini, saya akan menemani Anda.";
