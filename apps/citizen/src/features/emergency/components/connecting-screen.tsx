import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import { BotIcon, HeadphonesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import {
  useCreateReporterReportMutation,
  useRequestCancellationMutation,
} from "../api";
import { useIncident } from "../context";
import type { EmergencyCategory, ReportMode } from "../types";
import { ConnectionPulse } from "./connection-pulse";

const INCIDENT_TYPE_BY_CATEGORY: Record<
  EmergencyCategory,
  "CRIME" | "FIRE" | "MEDICAL" | "TRAFFIC_ACCIDENT" | "NATURAL_DISASTER"
> = {
  Bencana: "NATURAL_DISASTER",
  Kebakaran: "FIRE",
  Kecelakaan: "TRAFFIC_ACCIDENT",
  Kriminal: "CRIME",
  Medis: "MEDICAL",
};

const INTERACTION_MODE_BY_REPORT_MODE: Record<
  ReportMode,
  "VOICE" | "TEXT" | "SILENT"
> = {
  silent: "SILENT",
  text: "TEXT",
  voice: "VOICE",
};

const ROUTE_BY_MODE: Record<ReportMode, string> = {
  silent: "/silent-session",
  text: "/chat",
  voice: "/voice-session",
};

export const ConnectingScreen = () => {
  const navigate = useNavigate();
  const incident = useIncident();
  const createReport = useCreateReporterReportMutation();
  const cancellation = useRequestCancellationMutation();
  const cancellationRequested = useRef(false);
  const hasStarted = useRef(false);
  const pendingReportId = useRef<Promise<string> | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isOperator = incident.connectionTarget === "operator";

  useEffect(() => {
    if (
      hasStarted.current ||
      incident.reportId ||
      !(incident.idempotencyKey && incident.mode)
    ) {
      return;
    }
    const { idempotencyKey, mode } = incident;
    hasStarted.current = true;

    const connect = async () => {
      try {
        const createReportId = async (): Promise<string> => {
          const report = await createReport.mutateAsync({
            address: incident.location?.address,
            idempotencyKey,
            incidentType: incident.category
              ? INCIDENT_TYPE_BY_CATEGORY[incident.category]
              : undefined,
            interactionMode: INTERACTION_MODE_BY_REPORT_MODE[mode],
            latitude: incident.location?.latitude,
            longitude: incident.location?.longitude,
            responderPreference: isOperator ? "OPERATOR" : "AI",
          });
          return report.id;
        };
        pendingReportId.current = createReportId();
        const reportId = await pendingReportId.current;
        if (cancellationRequested.current) {
          return;
        }
        incident.setReportId(reportId);
        navigate(ROUTE_BY_MODE[mode], { replace: true });
      } catch (error) {
        if (cancellationRequested.current) {
          return;
        }
        hasStarted.current = false;
        setConnectionError(
          error instanceof Error
            ? error.message
            : "Laporan belum berhasil dibuat. Coba lagi."
        );
      }
    };
    connect();
  }, [createReport, incident, isOperator, navigate]);

  const handleCancel = async () => {
    if (isCancelling) {
      return;
    }
    cancellationRequested.current = true;
    setIsCancelling(true);
    let { reportId } = incident;
    const inFlightReportId = pendingReportId.current;
    if (!reportId && inFlightReportId) {
      try {
        reportId = await inFlightReportId;
      } catch {
        reportId = null;
      }
    }
    if (reportId) {
      try {
        await cancellation.mutateAsync({
          reason: "Pelapor membatalkan saat proses koneksi",
          reportId,
        });
      } catch {
        cancellationRequested.current = false;
        incident.setReportId(reportId);
        setIsCancelling(false);
        setConnectionError(
          "Permintaan pembatalan belum terkirim. Laporan tetap aktif."
        );
        return;
      }
    }
    incident.cancelIncident();
    navigate("/history", { replace: true });
  };
  const handleRestart = () => navigate("/sos", { replace: true });

  if (!(incident.idempotencyKey && incident.mode)) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Data SOS tidak ditemukan.</p>
        <Button onClick={handleRestart}>Mulai ulang</Button>
      </MobilePage>
    );
  }

  const ConnectionIcon = isOperator ? HeadphonesIcon : BotIcon;
  return (
    <MobilePage
      className="items-center justify-center gap-6 overflow-hidden text-center"
      title="Menghubungkan laporan"
    >
      <div className="absolute top-1/4 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
      <ConnectionPulse
        icon={ConnectionIcon}
        label={
          isOperator
            ? "Sedang menghubungkan ke operator"
            : "Sedang menghubungkan ke SIAGA AI"
        }
      />
      <div className="max-w-sm">
        <p className="mb-2 font-semibold text-primary text-xs tracking-[0.2em]">
          SIAGA AKTIF
        </p>
        <h1 className="text-h3">
          {isOperator
            ? "Menghubungkan ke operator..."
            : "Menghubungkan ke SIAGA AI..."}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Tetap tenang. Laporan dan lokasi kamu sedang diamankan untuk petugas.
        </p>
      </div>
      {connectionError ? (
        <Alert variant="destructive">
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      ) : null}
      <Button disabled={isCancelling} onClick={handleCancel} variant="stroke">
        {isCancelling ? "Membatalkan..." : "Batalkan SOS"}
      </Button>
    </MobilePage>
  );
};
