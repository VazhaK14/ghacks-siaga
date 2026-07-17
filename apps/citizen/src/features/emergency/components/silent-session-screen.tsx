import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  ActivityIcon,
  CircleCheckIcon,
  HeadphonesIcon,
  MicOffIcon,
  SendIcon,
  VolumeXIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";

import {
  useAppendAcousticSignalMutation,
  useAppendReporterTextMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
} from "../api";
import { useIncident } from "../context";
import { useAcousticMonitoring } from "../use-acoustic-monitoring";
import { useElevenLabsTranscription } from "../use-elevenlabs-transcription";
import { useLiveLocationReporting } from "../use-live-location-reporting";
import { useReportAudioSession } from "../use-report-audio-session";

const SIGNAL_LABELS = {
  AGGRESSIVE_SHOUTING: "teriakan keras",
  CRYING: "tangisan",
  EXPLOSION: "ledakan",
  GLASS_BREAKING: "pecahan kaca",
  GUNSHOT: "tembakan",
  SCREAM: "jeritan",
} as const;

const getMonitoringMessage = (status: string): string => {
  if (status === "loading") {
    return "Menyiapkan model deteksi di perangkat...";
  }
  if (status === "listening") {
    return "Mikrofon aktif selama halaman ini tetap terbuka.";
  }
  return "Menunggu akses mikrofon.";
};

export const SilentSessionScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendSignal = useAppendAcousticSignalMutation();
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const isCollecting = reportQuery.data?.intakeStatus !== "FINALIZED";
  const collectingRef = useRef(isCollecting);
  const transcriptQueue = useRef(Promise.resolve());

  useEffect(() => {
    collectingRef.current = isCollecting;
  }, [isCollecting]);
  const audioSession = useReportAudioSession(
    reportId,
    Boolean(reportId && isCollecting)
  );
  useLiveLocationReporting(reportId);

  const handleDetection = useCallback(
    async (detection: {
      code: keyof typeof SIGNAL_LABELS;
      confidence: number;
      endedAt: Date;
      startedAt: Date;
    }): Promise<void> => {
      if (!reportId) {
        return;
      }
      try {
        const report = await appendSignal.mutateAsync({
          code: detection.code,
          confidence: detection.confidence,
          endedAt: detection.endedAt.toISOString(),
          modelId: "yamnet",
          modelVersion: "tflite-1",
          reportId,
          startedAt: detection.startedAt.toISOString(),
        });
        collectingRef.current = report.intakeStatus !== "FINALIZED";
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Sinyal suara belum tersimpan."
        );
      }
    },
    [appendSignal, reportId]
  );
  const monitoring = useAcousticMonitoring({
    enabled: Boolean(reportId && isCollecting),
    mediaStream: audioSession.mediaStream,
    onDetection: handleDetection,
  });
  const appendSilentTranscript = useCallback(
    async (content: string): Promise<void> => {
      transcriptQueue.current = transcriptQueue.current.then(async () => {
        if (!(reportId && collectingRef.current)) {
          return;
        }
        try {
          const report = await appendText.mutateAsync({
            content,
            idempotencyKey: `silent-${crypto.randomUUID()}`,
            reportId,
            source: "SILENT_TRANSCRIPT",
          });
          collectingRef.current = report.intakeStatus !== "FINALIZED";
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Transkrip sekitar belum tersimpan."
          );
        }
      });
      await transcriptQueue.current;
    },
    [appendText, reportId]
  );
  const transcription = useElevenLabsTranscription({
    enabled: Boolean(reportId && isCollecting),
    mediaStream: audioSession.mediaStream,
    onCommittedText: appendSilentTranscript,
  });
  const { latestDetection } = monitoring;

  const handleFinalize = async (): Promise<void> => {
    if (!reportId) {
      return;
    }
    try {
      await endSession.mutateAsync({ reportId });
      toast.success("Laporan diteruskan ke operator.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Laporan belum dapat dikirim."
      );
    }
  };
  const handleSupport = () => navigate("/chat", { replace: true });
  const handleDispatch = () => navigate("/dispatch", { replace: true });
  const handleHistory = () => navigate("/history", { replace: true });

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHistory}>Ke riwayat</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-4" title="Mode sunyi">
      <Alert>
        <VolumeXIcon aria-hidden="true" />
        <AlertTitle>
          {isCollecting ? "Mode sunyi aktif" : "Laporan sudah dikirim"}
        </AlertTitle>
        <AlertDescription>
          {isCollecting
            ? "Laporan awal sudah terlihat operator. SIAGA mengirim transkrip dan sinyal bahaya tanpa memutar suara atau getaran."
            : "AI mendeteksi sinyal kuat atau intake dihentikan. Operator dapat meninjau rekaman dan lokasi."}
        </AlertDescription>
      </Alert>

      <section className="citizen-glass-surface flex flex-col items-center gap-5 p-6 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/15 text-primary">
          {isCollecting ? (
            <ActivityIcon aria-hidden="true" className="size-10" />
          ) : (
            <CircleCheckIcon aria-hidden="true" className="size-10" />
          )}
        </div>
        <div>
          <h1 className="text-h4">
            {isCollecting
              ? "Menganalisis suara sekitar"
              : "Informasi diteruskan"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {getMonitoringMessage(monitoring.status)} Transkrip hanya terlihat
            oleh operator.
          </p>
        </div>
        <Badge
          variant={monitoring.status === "listening" ? "default" : "secondary"}
        >
          {monitoring.status === "listening" ? "Mendengarkan" : "Menyiapkan"}
        </Badge>
      </section>

      {latestDetection === null ? null : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          Terdeteksi {SIGNAL_LABELS[latestDetection.code]} dengan keyakinan
          {Math.round(latestDetection.confidence * 100)}%.
        </div>
      )}

      {audioSession.status === "unavailable" ||
      monitoring.status === "error" ? (
        <Alert variant="destructive">
          <MicOffIcon aria-hidden="true" />
          <AlertTitle>Analisis audio tidak tersedia</AlertTitle>
          <AlertDescription>
            {audioSession.error ??
              monitoring.error ??
              "Mikrofon tidak tersedia."}{" "}
            Laporan awal dan lokasi tetap sudah masuk.
          </AlertDescription>
        </Alert>
      ) : null}

      {transcription.status === "error" && isCollecting ? (
        <Alert>
          <MicOffIcon aria-hidden="true" />
          <AlertTitle>Transkripsi sekitar terbatas</AlertTitle>
          <AlertDescription>
            {transcription.error} Deteksi sinyal akustik dan laporan awal tetap
            aktif.
          </AlertDescription>
        </Alert>
      ) : null}

      {isCollecting ? (
        <Button
          disabled={endSession.isPending}
          onClick={handleFinalize}
          variant="secondary"
        >
          <SendIcon data-icon="inline-start" />
          Berhenti dan kirim laporan
        </Button>
      ) : (
        <div className="grid gap-2">
          <Button onClick={handleSupport}>
            <HeadphonesIcon data-icon="inline-start" />
            Buka AI pendamping
          </Button>
          <Button onClick={handleDispatch} variant="stroke">
            Lihat progres operator
          </Button>
        </div>
      )}
    </MobilePage>
  );
};
