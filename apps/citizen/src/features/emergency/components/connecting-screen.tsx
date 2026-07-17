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
  const hasStarted = useRef(false);
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
        incident.setReportId(report.id);
        navigate(ROUTE_BY_MODE[mode], { replace: true });
      } catch (error) {
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
    if (incident.reportId) {
      try {
        await cancellation.mutateAsync({
          reason: "Pelapor membatalkan saat proses koneksi",
          reportId: incident.reportId,
        });
      } catch {
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
      className="items-center justify-center gap-7"
      title="Menghubungkan laporan"
    >
      <div className="citizen-glass-surface flex size-32 items-center justify-center rounded-full! bg-primary/15!">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
          <ConnectionIcon aria-hidden="true" className="size-10" />
        </div>
      </div>
      <h1 className="text-center text-h3">
        {isOperator
          ? "Menghubungkan ke operator..."
          : "Menghubungkan ke SIAGA AI..."}
      </h1>
      <p className="max-w-sm text-center text-muted-foreground text-sm">
        Laporan sedang dibuat dan lokasi aman dikirim ke pusat SIAGA.
      </p>
      {connectionError ? (
        <Alert variant="destructive">
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      ) : null}
      <Button onClick={handleCancel} variant="stroke">
        Batalkan SOS
      </Button>
    </MobilePage>
  );
};
