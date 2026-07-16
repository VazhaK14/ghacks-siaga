import { useCallback, useEffect, useRef, useState } from "react";

import { getDetailTitle, INCIDENT_TYPE_LABELS } from "@/features/map/content";
import type {
  CallSimulationSession,
  CallSummary,
  ReportDetail,
} from "@/features/map/types";

const CONNECTING_DELAY_MS = 2000;
const DEFAULT_SESSION: CallSimulationSession = {
  connectedAt: null,
  durationSeconds: 0,
  phase: "idle",
  summary: null,
};

const buildCallSummary = (
  report: ReportDetail,
  durationSeconds: number
): CallSummary => {
  const incidentLabel = report.incidentType
    ? INCIDENT_TYPE_LABELS[report.incidentType]
    : "kejadian yang dilaporkan";
  const location = report.address ?? "lokasi laporan";
  const urgencyStatement =
    report.category === "CRITICAL" || report.category === "HIGH"
      ? "Pelapor menegaskan bantuan perlu tiba sesegera mungkin."
      : "Pelapor dapat diajak berkoordinasi dan menunggu instruksi operator.";

  return {
    callerCondition:
      report.category === "CRITICAL"
        ? "Terdengar panik, tetapi masih mampu menjawab pertanyaan operator."
        : "Kooperatif dan mampu memberikan pembaruan kondisi.",
    confidencePercent: 92,
    followUp:
      report.latestAnalysis?.recommendation ??
      report.recommendation ??
      "Pantau perubahan situasi dan teruskan pembaruan kepada unit respons.",
    keyPoints: [
      `Jenis kejadian dikonfirmasi sebagai ${incidentLabel.toLowerCase()}.`,
      `Lokasi kejadian dikonfirmasi di ${location}.`,
      urgencyStatement,
    ],
    summary: `Pelapor mengonfirmasi detail ${getDetailTitle(report).toLowerCase()} dan menyatakan informasi utama pada laporan masih sesuai. Panggilan simulasi berlangsung ${durationSeconds} detik.`,
  };
};

export const useReportCallSimulation = () => {
  const [sessions, setSessions] = useState<
    Record<string, CallSimulationSession>
  >({});
  const connectingTimers = useRef(new Map<string, number>());

  useEffect(
    () => () => {
      for (const timer of connectingTimers.current.values()) {
        window.clearTimeout(timer);
      }
      connectingTimers.current.clear();
    },
    []
  );

  const startCall = useCallback((reportId: string) => {
    const existingTimer = connectingTimers.current.get(reportId);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    setSessions((currentSessions) => ({
      ...currentSessions,
      [reportId]: {
        connectedAt: null,
        durationSeconds: 0,
        phase: "calling",
        summary: null,
      },
    }));

    const timer = window.setTimeout(() => {
      connectingTimers.current.delete(reportId);
      setSessions((currentSessions) => ({
        ...currentSessions,
        [reportId]: {
          connectedAt: Date.now(),
          durationSeconds: 0,
          phase: "connected",
          summary: null,
        },
      }));
    }, CONNECTING_DELAY_MS);
    connectingTimers.current.set(reportId, timer);
  }, []);

  const endCall = useCallback((report: ReportDetail) => {
    setSessions((currentSessions) => {
      const session = currentSessions[report.id];
      if (session?.phase !== "connected" || session.connectedAt === null) {
        return currentSessions;
      }

      const durationSeconds = Math.max(
        1,
        Math.floor((Date.now() - session.connectedAt) / 1000)
      );
      return {
        ...currentSessions,
        [report.id]: {
          connectedAt: session.connectedAt,
          durationSeconds,
          phase: "completed",
          summary: buildCallSummary(report, durationSeconds),
        },
      };
    });
  }, []);

  const getSession = useCallback(
    (reportId: string | null): CallSimulationSession =>
      (reportId ? sessions[reportId] : null) ?? DEFAULT_SESSION,
    [sessions]
  );

  return {
    endCall,
    getSession,
    startCall,
  };
};
