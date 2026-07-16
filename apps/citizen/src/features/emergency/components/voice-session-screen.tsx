import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import { Field, FieldLabel } from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import {
  MessageCircleIcon,
  MicIcon,
  PhoneOffIcon,
  SendIcon,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";

import {
  useAppendReporterTextMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useSwitchReporterModeMutation,
} from "../api";
import { useIncident } from "../context";
import type { ReporterReport } from "../types";
import { useLiveLocationReporting } from "../use-live-location-reporting";

const getLatestAssistantMessage = (
  messages: ReporterReport["messages"]
): ReporterReport["messages"][number] | null => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.senderType === "AI_AGENT") {
      return message;
    }
  }
  return null;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export const VoiceSessionScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [seconds, setSeconds] = useState(0);
  const [fallbackDraft, setFallbackDraft] = useState("");
  const lastSpokenMessageId = useRef<string | null>(null);
  useLiveLocationReporting(reportId);

  const appendTranscript = useCallback(
    async (content: string) => {
      if (!reportId) {
        return;
      }
      try {
        await appendText.mutateAsync({
          content,
          idempotencyKey: `voice-${crypto.randomUUID()}`,
          reportId,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Transkrip belum terkirim."
        );
      }
    },
    [appendText, reportId]
  );
  const transcription = useVoiceTranscription({
    enabled: Boolean(reportId),
    onFinalResult: (content) => {
      appendTranscript(content);
    },
  });

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setSeconds((current) => current + 1),
      1000
    );
    return () => window.clearInterval(intervalId);
  }, []);

  const latestAssistantMessage = getLatestAssistantMessage(
    reportQuery.data?.messages ?? []
  );
  useEffect(() => {
    if (
      !latestAssistantMessage ||
      latestAssistantMessage.id === lastSpokenMessageId.current ||
      !("speechSynthesis" in window)
    ) {
      return;
    }
    lastSpokenMessageId.current = latestAssistantMessage.id;
    const utterance = new SpeechSynthesisUtterance(
      latestAssistantMessage.content
    );
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  }, [latestAssistantMessage]);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    []
  );

  const handleFallbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = fallbackDraft.trim();
    if (!content) {
      return;
    }
    setFallbackDraft("");
    await appendTranscript(content);
  };

  const handleUseText = async () => {
    if (!reportId) {
      return;
    }
    await switchMode.mutateAsync({ interactionMode: "TEXT", reportId });
    navigate("/chat", { replace: true });
  };

  const handleEnd = async () => {
    if (reportId) {
      await endSession.mutateAsync({ reportId });
    }
    navigate("/dispatch", { replace: true });
  };
  const handleHome = () => navigate("/", { replace: true });
  const handleFallbackChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFallbackDraft(event.target.value);
  };

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHome}>Ke beranda</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-5" title="Laporan suara">
      <p className="text-center text-sm">{formatDuration(seconds)}</p>
      <section className="citizen-glass-surface flex flex-col gap-2 p-5">
        <p className="font-semibold text-primary text-xs">SIAGA AKTIF</p>
        <h1 className="text-h4">
          {reportQuery.data?.assignedOperator
            ? "Operator sudah mengambil alih"
            : "Ceritakan keadaan daruratnya"}
        </h1>
      </section>

      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="citizen-glass-surface flex size-24 items-center justify-center rounded-full! bg-primary/20! text-primary-foreground">
          <MicIcon aria-hidden="true" className="size-10" />
        </div>
        <p className="font-semibold text-xs">
          {transcription.status === "listening"
            ? "SIAGA SEDANG MENDENGARKAN"
            : "SUARA TIDAK TERSEDIA"}
        </p>
        <p className="min-h-12 text-muted-foreground text-sm">
          {transcription.interimText ||
            "Transkrip sementara akan muncul saat kamu berbicara."}
        </p>
      </div>

      {transcription.status === "unavailable" ? (
        <Alert>
          <AlertTitle>Gunakan fallback ketik</AlertTitle>
          <AlertDescription>
            Browser ini tidak mendukung transkripsi suara atau izinnya ditolak.
          </AlertDescription>
        </Alert>
      ) : null}
      {transcription.status === "unavailable" ? (
        <form className="flex items-end gap-2" onSubmit={handleFallbackSubmit}>
          <Field className="flex-1">
            <FieldLabel className="sr-only" htmlFor="voice-fallback">
              Pesan darurat
            </FieldLabel>
            <Input
              id="voice-fallback"
              onChange={handleFallbackChange}
              placeholder="Ketik keadaan darurat..."
              value={fallbackDraft}
            />
          </Field>
          <Button aria-label="Kirim pesan" size="icon-lg" type="submit">
            <SendIcon />
          </Button>
        </form>
      ) : null}

      <Button onClick={handleUseText} variant="stroke">
        <MessageCircleIcon data-icon="inline-start" />
        Pindah ke chat
      </Button>
      <Button
        disabled={endSession.isPending}
        onClick={handleEnd}
        variant="secondary"
      >
        <PhoneOffIcon data-icon="inline-start" />
        Akhiri komunikasi
      </Button>
    </MobilePage>
  );
};
