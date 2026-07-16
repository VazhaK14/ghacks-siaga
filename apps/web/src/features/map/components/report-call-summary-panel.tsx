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
  BrainCircuitIcon,
  LoaderCircleIcon,
  PhoneCallIcon,
  PhoneOffIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CallSimulationSession, ReportDetail } from "@/features/map/types";

interface ReportCallSummaryPanelProps {
  className?: string;
  onEndCall: (report: ReportDetail) => void;
  onStartCall: (reportId: string) => void;
  report: ReportDetail | null;
  session: CallSimulationSession;
}

const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function useLiveCallDuration(session: CallSimulationSession): number {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (session.phase !== "connected") {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session.phase]);

  if (session.phase !== "connected" || session.connectedAt === null) {
    return session.durationSeconds;
  }

  return Math.max(0, Math.floor((currentTime - session.connectedAt) / 1000));
}

export function ReportCallSummaryPanel({
  className,
  onEndCall,
  onStartCall,
  report,
  session,
}: ReportCallSummaryPanelProps) {
  const liveDuration = useLiveCallDuration(session);
  const hasPhoneNumber = Boolean(report?.contactPhone);
  const handleStartCall = useCallback(() => {
    if (report) {
      onStartCall(report.id);
    }
  }, [onStartCall, report]);
  const handleEndCall = useCallback(() => {
    if (report) {
      onEndCall(report);
    }
  }, [onEndCall, report]);

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
              Ringkasan Panggilan AI
            </CardTitle>
            <CardDescription className="mt-1">
              Hasil simulasi panggilan balik operator.
            </CardDescription>
          </span>
          <Badge variant="outline">Simulasi</Badge>
        </span>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto py-3">
        {report ? null : (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyTitle>Pilih laporan</EmptyTitle>
              <EmptyDescription>
                Ringkasan panggilan mengikuti laporan yang sedang dibuka.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {report && session.phase === "idle" ? (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PhoneCallIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada panggilan</EmptyTitle>
              <EmptyDescription>
                Hubungi pelapor untuk menghasilkan ringkasan AI mock.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              disabled={!hasPhoneNumber}
              onClick={handleStartCall}
              size="sm"
              type="button"
            >
              <PhoneCallIcon data-icon="inline-start" />
              Hubungi Kembali
            </Button>
            {hasPhoneNumber ? null : (
              <p className="text-center text-[10px] text-muted-foreground">
                Nomor telepon pelapor tidak tersedia.
              </p>
            )}
          </Empty>
        ) : null}

        {report && session.phase === "calling" ? (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LoaderCircleIcon className="animate-spin" />
              </EmptyMedia>
              <EmptyTitle>Memanggil pelapor</EmptyTitle>
              <EmptyDescription>{report.contactPhone}</EmptyDescription>
            </EmptyHeader>
            <Button disabled size="sm" type="button">
              <LoaderCircleIcon
                className="animate-spin"
                data-icon="inline-start"
              />
              Menyambungkan
            </Button>
          </Empty>
        ) : null}

        {report && session.phase === "connected" ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
              <PhoneCallIcon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-foreground text-sm">
                Panggilan tersambung
              </span>
              <span className="mt-1 block font-mono text-muted-foreground text-xs">
                {formatDuration(liveDuration)}
              </span>
            </span>
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

        {report && session.phase === "completed" && session.summary ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-[10px] text-muted-foreground">
                  Durasi panggilan
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {formatDuration(session.durationSeconds)}
                </span>
              </span>
              <Badge variant="secondary">
                Confidence {session.summary.confidencePercent}%
              </Badge>
            </div>

            <section>
              <h3 className="font-semibold text-foreground text-xs">
                Rangkuman
              </h3>
              <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                {session.summary.summary}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-xs">
                Poin penting
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
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

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <span>
                <span className="block font-semibold text-foreground text-xs">
                  Kondisi pelapor
                </span>
                <span className="mt-1 block text-muted-foreground text-xs">
                  {session.summary.callerCondition}
                </span>
              </span>
              <span>
                <span className="block font-semibold text-foreground text-xs">
                  Tindak lanjut
                </span>
                <span className="mt-1 block text-muted-foreground text-xs">
                  {session.summary.followUp}
                </span>
              </span>
            </section>

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
