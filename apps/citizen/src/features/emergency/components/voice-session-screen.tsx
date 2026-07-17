import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import { HeadphonesIcon, PhoneOffIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";

import {
  useAppendReporterTextMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useSynthesizeSpeechMutation,
} from "../api";
import { useIncident } from "../context";
import type { ReporterReport } from "../types";
import { useElevenLabsTranscription } from "../use-elevenlabs-transcription";
import { useLiveLocationReporting } from "../use-live-location-reporting";
import { useReportAudioSession } from "../use-report-audio-session";
import { AudioWaveform } from "./audio-waveform";

type VoicePhase =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ending"
  | "error";

const PHASE_CONTENT: Record<
  VoicePhase,
  { description: string; label: string }
> = {
  connecting: {
    description: "Menyiapkan mikrofon dan suara SIAGA.",
    label: "MENGHUBUNGKAN",
  },
  ending: {
    description: "Menutup percakapan dengan aman.",
    label: "MENGAKHIRI PERCAKAPAN",
  },
  error: {
    description: "Percakapan suara membutuhkan perhatian.",
    label: "KONEKSI TERGANGGU",
  },
  idle: {
    description: "Sentuh tombol untuk mulai berbicara dengan SIAGA.",
    label: "SIAP MEMULAI",
  },
  listening: {
    description: "Silakan bicara. SIAGA akan menjawab setelah kamu selesai.",
    label: "SIAGA MENDENGARKAN",
  },
  speaking: {
    description: "Dengarkan arahan singkat dari SIAGA.",
    label: "SIAGA BERBICARA",
  },
  thinking: {
    description: "SIAGA memahami situasi dan menyiapkan respons.",
    label: "SIAGA MEMPROSES",
  },
};

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

const AUDIO_ENVELOPE_BUCKETS = 480;

const createAudioEnvelope = async (audioBase64: string): Promise<number[]> => {
  const binaryAudio = window.atob(audioBase64);
  const audioBytes = Uint8Array.from(binaryAudio, (character) =>
    character.charCodeAt(0)
  );
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer);
    const samples = audioBuffer.getChannelData(0);
    const bucketSize = Math.max(
      1,
      Math.floor(samples.length / AUDIO_ENVELOPE_BUCKETS)
    );
    const envelope: number[] = [];
    let highestPeak = 0;
    for (let offset = 0; offset < samples.length; offset += bucketSize) {
      const bucketEnd = Math.min(samples.length, offset + bucketSize);
      let peak = 0;
      for (
        let sampleIndex = offset;
        sampleIndex < bucketEnd;
        sampleIndex += 1
      ) {
        peak = Math.max(peak, Math.abs(samples[sampleIndex] ?? 0));
      }
      highestPeak = Math.max(highestPeak, peak);
      envelope.push(peak);
    }
    if (highestPeak === 0) {
      return envelope;
    }
    return envelope.map((peak) => Math.max(0.08, peak / highestPeak));
  } finally {
    await audioContext.close();
  }
};

const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

const getWaveformStatusLabel = (
  isListening: boolean,
  isSpeaking: boolean,
  fallbackLabel: string
): string => {
  if (isListening) {
    return "Mikrofon mendengarkan";
  }
  if (isSpeaking) {
    return "Suara SIAGA aktif";
  }
  return fallbackLabel;
};

const playAudio = (audio: HTMLAudioElement): Promise<void> =>
  new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio respons AI gagal diputar."));
    audio.play().catch(reject);
  });

export const VoiceSessionScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const synthesizeSpeech = useSynthesizeSpeechMutation();
  const [hasStarted, setHasStarted] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [playbackAudio, setPlaybackAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [assistantEnvelope, setAssistantEnvelope] = useState<number[] | null>(
    null
  );
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const finalizedRef = useRef(false);
  const lastAssistantText = useRef<string | null>(null);
  const isFinalized = reportQuery.data?.intakeStatus === "FINALIZED";

  useEffect(() => {
    finalizedRef.current = isFinalized;
  }, [isFinalized]);

  const audioSession = useReportAudioSession(reportId, hasStarted);
  useLiveLocationReporting(reportId);

  const speakAssistant = useCallback(
    async (text: string): Promise<void> => {
      lastAssistantText.current = text;
      setPhase("speaking");
      setVoiceError(null);
      const speech = await synthesizeSpeech.mutateAsync({ text });
      if (!(speech.available && speech.audioBase64)) {
        throw new Error(speech.message ?? "Suara AI tidak tersedia.");
      }
      currentAudio.current?.pause();
      const audio = new Audio(
        `data:${speech.mimeType};base64,${speech.audioBase64}`
      );
      currentAudio.current = audio;
      setPlaybackAudio(audio);
      setAssistantEnvelope(null);
      const prepareEnvelope = async (): Promise<void> => {
        try {
          const envelope = await createAudioEnvelope(speech.audioBase64 ?? "");
          if (currentAudio.current === audio) {
            setAssistantEnvelope(envelope);
          }
        } catch {
          setAssistantEnvelope(null);
        }
      };
      const envelopeTask = prepareEnvelope();
      await waitForNextPaint();
      try {
        await playAudio(audio);
      } finally {
        await envelopeTask;
        if (currentAudio.current === audio) {
          currentAudio.current = null;
          setPlaybackAudio(null);
          setAssistantEnvelope(null);
        }
      }
      setPhase("listening");
    },
    [synthesizeSpeech]
  );

  const appendTranscript = useCallback(
    async (content: string): Promise<void> => {
      if (!reportId) {
        return;
      }
      setPhase("thinking");
      try {
        const report = await appendText.mutateAsync({
          content,
          idempotencyKey: `voice-${crypto.randomUUID()}`,
          reportId,
          source: finalizedRef.current
            ? "VOICE_SUPPORT_TRANSCRIPT"
            : "VOICE_TRANSCRIPT",
        });
        finalizedRef.current = report.intakeStatus === "FINALIZED";
        const assistantMessage = getLatestAssistantMessage(report.messages);
        const lastMessage = report.messages.at(-1);
        if (
          !assistantMessage ||
          lastMessage?.senderType !== "AI_AGENT" ||
          lastMessage.id !== assistantMessage.id
        ) {
          throw new Error("AI belum dapat memberikan respons suara.");
        }
        await speakAssistant(assistantMessage.content);
      } catch (error) {
        setVoiceError(
          error instanceof Error ? error.message : "Percakapan suara terputus."
        );
        setPhase("error");
      }
    },
    [appendText, reportId, speakAssistant]
  );

  const transcription = useElevenLabsTranscription({
    enabled: hasStarted,
    mediaStream: audioSession.mediaStream,
    onCommittedText: appendTranscript,
    paused: phase !== "listening",
  });

  useEffect(() => {
    if (!hasStarted) {
      return;
    }
    const intervalId = window.setInterval(
      () => setSeconds((current) => current + 1),
      1000
    );
    return () => window.clearInterval(intervalId);
  }, [hasStarted]);

  useEffect(
    () => () => {
      currentAudio.current?.pause();
    },
    []
  );

  const handleStart = async (): Promise<void> => {
    const initialMessage = getLatestAssistantMessage(
      reportQuery.data?.messages ?? []
    );
    if (!initialMessage) {
      setVoiceError("Pesan pembuka SIAGA belum tersedia.");
      setPhase("error");
      return;
    }
    setHasStarted(true);
    setPhase("connecting");
    try {
      await speakAssistant(initialMessage.content);
    } catch (error) {
      setVoiceError(
        error instanceof Error ? error.message : "Suara AI tidak tersedia."
      );
      setPhase("error");
    }
  };

  const handleRetryVoice = async (): Promise<void> => {
    const text = lastAssistantText.current;
    if (!text) {
      setPhase("listening");
      return;
    }
    try {
      await speakAssistant(text);
    } catch (error) {
      setVoiceError(
        error instanceof Error ? error.message : "Suara AI tidak tersedia."
      );
      setPhase("error");
    }
  };

  const handleRetryTranscription = (): void => {
    transcription.retry();
    setVoiceError(null);
    setPhase("listening");
  };

  const handleEndConversation = async (): Promise<void> => {
    if (!reportId) {
      return;
    }
    currentAudio.current?.pause();
    setPlaybackAudio(null);
    setAssistantEnvelope(null);
    setPhase("ending");
    try {
      await endSession.mutateAsync({ reportId });
      toast.success("Percakapan selesai. Laporan tersedia untuk operator.");
      navigate("/dispatch", { replace: true });
    } catch (error) {
      setVoiceError(
        error instanceof Error
          ? error.message
          : "Percakapan belum dapat diakhiri."
      );
      setPhase("error");
    }
  };

  const handleHistory = () => navigate("/history", { replace: true });
  const isConnectionPending =
    phase === "listening" &&
    (audioSession.status === "starting" ||
      transcription.status === "connecting");
  const displayedPhase = isConnectionPending ? "connecting" : phase;
  const phaseContent = PHASE_CONTENT[displayedPhase];
  const isListening = displayedPhase === "listening";
  const isSpeaking = displayedPhase === "speaking";
  const isWaveformActive = hasStarted && displayedPhase !== "error";

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHistory}>Ke riwayat</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-4 overflow-hidden" title="Percakapan suara">
      <div className="absolute top-1/3 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-muted-foreground">
            {isFinalized ? "Laporan terkirim" : "Sesi aman aktif"}
          </span>
        </div>
        <span className="font-mono text-sm tabular-nums">
          {formatDuration(seconds)}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-7">
          <p className="font-semibold text-primary text-xs tracking-[0.2em]">
            SIAGA VOICE
          </p>
          <h1 className="mt-3 text-h3">{phaseContent.label}</h1>
          <p className="mx-auto mt-2 max-w-xs text-muted-foreground text-sm leading-relaxed">
            {phaseContent.description}
          </p>
        </div>

        <div className="relative w-full max-w-md py-5">
          <div className="absolute inset-x-10 top-1/2 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          <AudioWaveform
            active={isWaveformActive}
            audioElement={isSpeaking ? playbackAudio : null}
            audioEnvelope={isSpeaking ? assistantEnvelope : null}
            className={isSpeaking ? "text-primary" : "text-primary/90"}
            label={
              isListening
                ? "Gelombang suara mikrofon pengguna"
                : "Gelombang suara SIAGA"
            }
            mediaStream={isListening ? audioSession.mediaStream : null}
          />
        </div>

        <Badge className="rounded-full px-3" variant="secondary">
          {getWaveformStatusLabel(isListening, isSpeaking, phaseContent.label)}
        </Badge>
      </section>

      {hasStarted ? null : (
        <Button
          disabled={reportQuery.isPending}
          onClick={handleStart}
          size="lg"
        >
          <HeadphonesIcon data-icon="inline-start" />
          Mulai percakapan
        </Button>
      )}

      {audioSession.error ? (
        <Alert>
          <AlertTitle>Recording pusat terbatas</AlertTitle>
          <AlertDescription>{audioSession.error}</AlertDescription>
        </Alert>
      ) : null}

      {transcription.status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Mikrofon AI terputus</AlertTitle>
          <AlertDescription>{transcription.error}</AlertDescription>
          <Button onClick={handleRetryTranscription} size="sm" variant="stroke">
            <RefreshCwIcon data-icon="inline-start" />
            Sambungkan ulang
          </Button>
        </Alert>
      ) : null}

      {voiceError ? (
        <Alert variant="destructive">
          <AlertTitle>Respons suara tidak tersedia</AlertTitle>
          <AlertDescription>{voiceError}</AlertDescription>
          {lastAssistantText.current ? (
            <Button onClick={handleRetryVoice} size="sm" variant="stroke">
              <RefreshCwIcon data-icon="inline-start" />
              Putar ulang respons
            </Button>
          ) : null}
        </Alert>
      ) : null}

      {hasStarted ? (
        <Button
          className="h-13 rounded-xl"
          disabled={endSession.isPending}
          onClick={handleEndConversation}
          variant="secondary"
        >
          <PhoneOffIcon data-icon="inline-start" />
          Akhiri percakapan
        </Button>
      ) : null}
    </MobilePage>
  );
};
