import { Button } from "@siaga-app/ui/components/button";
import {
  LoaderCircleIcon,
  MicIcon,
  MicOffIcon,
  PhoneCallIcon,
  PhoneOffIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useIncomingCall } from "./use-incoming-call";

export const IncomingCallScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const callSessionId = searchParams.get("callSessionId");
  const reportId = searchParams.get("reportId");
  const call = useIncomingCall(callSessionId);
  const goBack = useCallback(() => {
    navigate(
      reportId
        ? `/status?reportId=${encodeURIComponent(reportId)}`
        : "/history",
      {
        replace: true,
      }
    );
  }, [navigate, reportId]);
  const acceptCall = useCallback(() => {
    call.accept().catch(() => undefined);
  }, [call.accept]);
  const rejectCall = useCallback(() => {
    call.reject().catch(() => undefined);
  }, [call.reject]);
  const endCall = useCallback(() => {
    call.end().catch(() => undefined);
  }, [call.end]);
  const toggleMute = useCallback(() => {
    call.toggleMute().catch(() => undefined);
  }, [call.toggleMute]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-8 text-foreground">
      <section className="citizen-glass-surface w-full max-w-md overflow-hidden p-6 text-center">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          {call.phase === "loading" || call.phase === "connecting" ? (
            <LoaderCircleIcon className="size-10 animate-spin text-primary" />
          ) : (
            <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {call.phase === "ringing" ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
              ) : null}
              <PhoneCallIcon className="relative size-7" />
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          {call.phase === "active" ? "Panggilan aktif" : "Operator SIAGA"}
        </p>
        <h1 className="mt-2 font-bold text-2xl">
          {call.call?.operator.name ?? "Panggilan masuk"}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-muted-foreground text-sm leading-relaxed">
          {call.phase === "ringing"
            ? "Operator ingin mengonfirmasi kondisi dan detail laporan kamu."
            : null}
          {call.phase === "connecting"
            ? "Mengaktifkan mikrofon dan menyambungkan panggilan aman…"
            : null}
          {call.phase === "active"
            ? "Kamu sedang berbicara langsung dengan operator manusia."
            : null}
          {call.phase === "ended" ? "Panggilan telah berakhir." : null}
          {call.phase === "error" ? call.error : null}
        </p>

        <div className="mt-7 flex items-center justify-center gap-4">
          {call.phase === "ringing" ? (
            <>
              <Button
                aria-label="Tolak panggilan"
                className="size-14 rounded-full"
                onClick={rejectCall}
                size="icon"
                type="button"
                variant="destructive"
              >
                <PhoneOffIcon className="size-6" />
              </Button>
              <Button
                aria-label="Jawab panggilan"
                className="size-14 rounded-full bg-success text-success-foreground hover:bg-success/90"
                onClick={acceptCall}
                size="icon"
                type="button"
              >
                <PhoneCallIcon className="size-6" />
              </Button>
            </>
          ) : null}
          {call.phase === "active" ? (
            <>
              <Button
                aria-label={
                  call.isMuted ? "Aktifkan mikrofon" : "Matikan mikrofon"
                }
                className="size-14 rounded-full"
                onClick={toggleMute}
                size="icon"
                type="button"
                variant="secondary"
              >
                {call.isMuted ? (
                  <MicOffIcon className="size-6" />
                ) : (
                  <MicIcon className="size-6" />
                )}
              </Button>
              <Button
                aria-label="Akhiri panggilan"
                className="size-14 rounded-full"
                onClick={endCall}
                size="icon"
                type="button"
                variant="destructive"
              >
                <PhoneOffIcon className="size-6" />
              </Button>
            </>
          ) : null}
          {call.phase === "ended" || call.phase === "error" ? (
            <Button onClick={goBack} type="button" variant="secondary">
              Kembali ke laporan
            </Button>
          ) : null}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-3 text-left">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            AI hanya membantu membuat transkrip dan ringkasan untuk operator.
            Percakapan tetap dilakukan oleh manusia. SIAGA tidak menyimpan
            transkrip mentah ke database.
          </p>
        </div>
      </section>
    </main>
  );
};
