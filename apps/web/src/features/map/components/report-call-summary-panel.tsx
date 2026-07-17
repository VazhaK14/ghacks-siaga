import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { cn } from "@siaga-app/ui/lib/utils";
import {
  AudioLinesIcon,
  BrainCircuitIcon,
  LoaderCircleIcon,
  PhoneCallIcon,
  PhoneOffIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { OperatorCallSession } from "@/features/calls/types";
import type { ReportDetail } from "@/features/map/types";

interface ReportCallSummaryPanelProps {
  className?: string;
  onEndCall: () => Promise<void>;
  onStartCall: (reportId: string) => Promise<void>;
  report: ReportDetail | null;
  session: OperatorCallSession;
}

const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getSpeakerLabel = (speaker: "OPERATOR" | "REPORTER"): string =>
  speaker === "OPERATOR" ? "Operator" : "Pelapor";

const isConnectingPhase = (phase: OperatorCallSession["phase"]): boolean =>
  phase === "requesting" || phase === "ringing";

const useLiveCallDuration = (session: OperatorCallSession): number => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    if (session.phase !== "connected") {
      return;
    }
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session.phase]);
  if (session.phase !== "connected" || session.connectedAt === null) {
    return session.durationSeconds;
  }
  return Math.max(0, Math.floor((currentTime - session.connectedAt) / 1000));
};

const IdleCallContent = ({
  onStart,
  report,
}: {
  onStart: () => void;
  report: ReportDetail;
}) => {
  if (report.reporter.isGuest) {
    return (
      <Empty className="min-h-40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PhoneCallIcon />
          </EmptyMedia>
          <EmptyTitle>Penelepon tanpa akun</EmptyTitle>
          <EmptyDescription>
            Callback aplikasi tidak tersedia. Panggilan tamu hanya dapat
            berlangsung dari antrean Panggilan Tanpa Akun.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Empty className="min-h-40">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PhoneCallIcon />
        </EmptyMedia>
        <EmptyTitle>Hubungi {report.reporter.name}</EmptyTitle>
        <EmptyDescription>
          Pelapor menerima notifikasi panggilan di aplikasi SIAGA.
        </EmptyDescription>
      </EmptyHeader>
      <Button onClick={onStart} size="sm" type="button">
        <PhoneCallIcon data-icon="inline-start" />
        Mulai Panggilan
      </Button>
    </Empty>
  );
};

export function ReportCallSummaryPanel({
  className,
  onEndCall,
  onStartCall,
  report,
  session,
}: ReportCallSummaryPanelProps) {
  const liveDuration = useLiveCallDuration(session);
  const handleStartCall = useCallback(() => {
    if (report) {
      onStartCall(report.id).catch(() => undefined);
    }
  }, [onStartCall, report]);
  const handleEndCall = useCallback(() => {
    onEndCall().catch(() => undefined);
  }, [onEndCall]);
  const isConnecting = isConnectingPhase(session.phase);

  return (
    <Card
      className={cn(
        "min-h-0 gap-0 overflow-hidden rounded-lg bg-popover/95 py-0 shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="border-b py-3">
        <span className="flex items-start justify-between gap-3">
          <span>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuitIcon aria-hidden className="size-4" />
              Panggilan & Ringkasan AI
            </CardTitle>
            <CardDescription className="mt-1">
              Operator berbicara langsung; AI hanya mentranskripsikan.
            </CardDescription>
          </span>
          <Badge variant="outline">Live</Badge>
        </span>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto py-3">
        {report ? null : (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyTitle>Pilih laporan</EmptyTitle>
              <EmptyDescription>
                Panggilan mengikuti laporan yang sedang dibuka.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {report && session.phase === "idle" ? (
          <IdleCallContent onStart={handleStartCall} report={report} />
        ) : null}

        {report && isConnecting ? (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LoaderCircleIcon className="animate-spin" />
              </EmptyMedia>
              <EmptyTitle>
                {session.phase === "ringing"
                  ? "Menunggu pelapor menjawab"
                  : "Menyiapkan panggilan"}
              </EmptyTitle>
              <EmptyDescription>
                Tautan aman LiveKit sedang disambungkan.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              onClick={handleEndCall}
              size="sm"
              type="button"
              variant="stroke"
            >
              Batalkan
            </Button>
          </Empty>
        ) : null}

        {report && session.phase === "connected" ? (
          <div className="flex min-h-40 flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-success text-xs">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-3 rounded-full bg-success" />
                </span>
                Tersambung
              </span>
              <span className="font-mono text-muted-foreground text-xs">
                {formatDuration(liveDuration)}
              </span>
            </div>
            <div className="rounded-md border bg-background/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                <AudioLinesIcon className="size-3.5" />
                Transkrip sementara
              </div>
              <div
                aria-live="polite"
                className="max-h-28 space-y-2 overflow-y-auto"
              >
                {session.transcript.slice(-5).map((segment) => (
                  <p
                    className="text-xs"
                    key={`${segment.timestampMs}-${segment.speaker}`}
                  >
                    <span className="font-semibold">
                      {getSpeakerLabel(segment.speaker)}:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {segment.text}
                    </span>
                  </p>
                ))}
                {session.interimOperatorText ? (
                  <p className="text-muted-foreground text-xs italic">
                    Operator: {session.interimOperatorText}
                  </p>
                ) : null}
                {session.interimReporterText ? (
                  <p className="text-muted-foreground text-xs italic">
                    Pelapor: {session.interimReporterText}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              onClick={handleEndCall}
              size="sm"
              type="button"
              variant="destructive"
            >
              <PhoneOffIcon data-icon="inline-start" />
              Akhiri Panggilan
            </Button>
          </div>
        ) : null}

        {report && session.phase === "finalizing" ? (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LoaderCircleIcon className="animate-spin" />
              </EmptyMedia>
              <EmptyTitle>Menyusun ringkasan</EmptyTitle>
              <EmptyDescription>
                Transkrip diproses lalu dibuang; hanya ringkasan terstruktur
                yang disimpan.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {report && session.phase === "failed" ? (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyTitle>Panggilan tidak dapat dilanjutkan</EmptyTitle>
              <EmptyDescription>
                {session.error ?? "Periksa izin mikrofon dan koneksi."}
              </EmptyDescription>
            </EmptyHeader>
            <Button
              onClick={handleStartCall}
              size="sm"
              type="button"
              variant="stroke"
            >
              <RotateCcwIcon data-icon="inline-start" />
              Coba Lagi
            </Button>
          </Empty>
        ) : null}

        {report && session.phase === "completed" && session.summary ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono font-semibold text-xs">
                {formatDuration(session.durationSeconds)}
              </span>
              <Badge variant="secondary">
                Confidence {session.summary.confidencePercent}%
              </Badge>
            </div>
            <section>
              <h3 className="font-semibold text-xs">Rangkuman</h3>
              <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                {session.summary.summary}
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-xs">Poin penting</h3>
              <ul className="mt-2 space-y-2">
                {session.summary.keyPoints.map((keyPoint) => (
                  <li
                    className="flex gap-2 text-muted-foreground text-xs"
                    key={keyPoint}
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-300"
                    />
                    {keyPoint}
                  </li>
                ))}
              </ul>
            </section>
            <div className="grid gap-3">
              <p className="text-xs">
                <span className="font-semibold">Kondisi pelapor: </span>
                <span className="text-muted-foreground">
                  {session.summary.callerCondition}
                </span>
              </p>
              <p className="text-xs">
                <span className="font-semibold">Tindak lanjut: </span>
                <span className="text-muted-foreground">
                  {session.summary.followUp}
                </span>
              </p>
            </div>
            <Button
              onClick={handleStartCall}
              size="sm"
              type="button"
              variant="stroke"
            >
              <RotateCcwIcon data-icon="inline-start" />
              Hubungi Ulang
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
