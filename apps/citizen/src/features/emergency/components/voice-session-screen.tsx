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
import { AUDIO_WARMUP_TIMEOUT_MS, withTimeout } from "../audio-timeout";
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

const SILENT_AUDIO_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

const AI_PLAYBACK_GAIN = 1.8;

const connectAmplifiedPlayback = (
  audioContext: AudioContext,
  audio: HTMLAudioElement
): (() => void) => {
  const source = audioContext.createMediaElementSource(audio);
  const gain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();

  gain.gain.value = AI_PLAYBACK_GAIN;
  compressor.threshold.value = -8;
  compressor.knee.value = 6;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.18;

  source.connect(gain);
  gain.connect(compressor);
  compressor.connect(audioContext.destination);

  let isConnected = true;
  return () => {
    if (!isConnected) {
      return;
    }
    isConnected = false;
    source.disconnect();
    gain.disconnect();
    compressor.disconnect();
  };
};

const tryConnectAmplifiedPlayback = (
  audioContext: AudioContext | null,
  audio: HTMLAudioElement
): (() => void) | null => {
  if (!audioContext) {
    return null;
  }
  try {
    return connectAmplifiedPlayback(audioContext, audio);
  } catch {
    return null;
  }
};

/**
 * Memanaskan audio iOS secara best-effort. Task-nya harus sudah dimulai oleh pemanggil
 * (sinkron di dalam handler gesture) agar iOS tetap mengizinkan audio. Mengembalikan
 * catatan kegagalan untuk ditampilkan, bukan melempar: sesi darurat tidak boleh mati
 * hanya karena pemanasan audio gagal.
 */
const runAudioWarmUp = async (
  audioContextTask: Promise<unknown>,
  playbackUnlockTask: Promise<unknown>
): Promise<string | null> => {
  const results = await Promise.allSettled([
    withTimeout(audioContextTask, "AudioContext.resume()"),
    withTimeout(playbackUnlockTask, "HTMLAudioElement.play()"),
  ]);
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) =>
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason)
    );
  return failures.length > 0 ? failures.join(" | ") : null;
};

const useStalledAfter = (active: boolean, delayMs: number): boolean => {
  const [isStalled, setIsStalled] = useState(false);
  useEffect(() => {
    if (!active) {
      setIsStalled(false);
      return;
    }
    const timer = window.setTimeout(() => setIsStalled(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);
  return isStalled;
};

/**
 * Menggantikan devtools: iOS Safari tidak bisa di-inspect tanpa Mac, jadi status
 * audio harus terbaca langsung dari perangkat saat sesi macet.
 */
const AudioDiagnostics = ({
  audioContextState,
  audioSessionStatus,
  lastError,
  transcriptionStatus,
  warmupNote,
}: {
  audioContextState: AudioContextState | null;
  audioSessionStatus: string;
  lastError: string | null;
  transcriptionStatus: string;
  warmupNote: string | null;
}) => (
  <ul className="space-y-0.5 font-mono text-xs">
    <li>AudioContext: {audioContextState ?? "belum ada"}</li>
    <li>Sesi audio: {audioSessionStatus}</li>
    <li>Transkripsi: {transcriptionStatus}</li>
    <li>Warm-up: {warmupNote ?? "ok"}</li>
    <li>Error: {lastError ?? "tidak ada"}</li>
  </ul>
);

const VoiceResponseErrorAlert = ({
  canRetry,
  error,
  onRetry,
}: {
  canRetry: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
}) => {
  if (!error) {
    return null;
  }
  return (
    <Alert variant="destructive">
      <AlertTitle>Respons suara tidak tersedia</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      {canRetry ? (
        <Button onClick={onRetry} size="sm" variant="stroke">
          <RefreshCwIcon data-icon="inline-start" />
          Putar ulang respons
        </Button>
      ) : null}
    </Alert>
  );
};

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
  const [audioWarmupNote, setAudioWarmupNote] = useState<string | null>(null);
  const [playbackAudio, setPlaybackAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [assistantEnvelope, setAssistantEnvelope] = useState<number[] | null>(
    null
  );
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const playbackAudioContext = useRef<AudioContext | null>(null);
  const playbackGraphCleanup = useRef<(() => void) | null>(null);
  const finalizedRef = useRef(false);
  const lastAssistantText = useRef<string | null>(null);
  const isFinalized = reportQuery.data?.intakeStatus === "FINALIZED";

  useEffect(() => {
    finalizedRef.current = isFinalized;
  }, [isFinalized]);

  const audioSession = useReportAudioSession(reportId, hasStarted);
  useLiveLocationReporting(reportId);

  const ensurePlaybackAudioContext =
    useCallback(async (): Promise<AudioContext | null> => {
      try {
        let audioContext = playbackAudioContext.current;
        if (!audioContext || audioContext.state === "closed") {
          audioContext = new AudioContext();
          playbackAudioContext.current = audioContext;
        }
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        return audioContext.state === "running" ? audioContext : null;
      } catch {
        return null;
      }
    }, []);

  const getPlaybackAudio = useCallback((): HTMLAudioElement => {
    let audio = currentAudio.current;
    if (!audio) {
      audio = new Audio();
      audio.setAttribute("playsinline", "");
      audio.preload = "auto";
      audio.volume = 1;
      currentAudio.current = audio;
    }
    return audio;
  }, []);

  const unlockPlaybackAudio = useCallback(async (): Promise<void> => {
    const audio = getPlaybackAudio();
    audio.src = SILENT_AUDIO_DATA_URI;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  }, [getPlaybackAudio]);

  const speakAssistant = useCallback(
    async (text: string): Promise<void> => {
      lastAssistantText.current = text;
      setPhase("speaking");
      setVoiceError(null);
      const speech = await synthesizeSpeech.mutateAsync({ text });
      if (!(speech.available && speech.audioBase64)) {
        throw new Error(speech.message ?? "Suara AI tidak tersedia.");
      }
      const audio = getPlaybackAudio();
      audio.pause();
      audio.src = `data:${speech.mimeType};base64,${speech.audioBase64}`;
      audio.load();
      if (!playbackGraphCleanup.current) {
        const audioContext = await withTimeout(
          ensurePlaybackAudioContext(),
          "AudioContext.resume()"
        ).catch(() => null);
        playbackGraphCleanup.current = tryConnectAmplifiedPlayback(
          audioContext,
          audio
        );
      }
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
          setPlaybackAudio(null);
          setAssistantEnvelope(null);
        }
      }
      setPhase("listening");
    },
    [ensurePlaybackAudioContext, getPlaybackAudio, synthesizeSpeech]
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
      const audio = currentAudio.current;
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
      playbackGraphCleanup.current?.();
      playbackAudioContext.current?.close().catch(() => undefined);
    },
    []
  );

  /**
   * Harus dipanggil sinkron dari handler gesture agar iOS tetap mengizinkan audio.
   * Kegagalannya tidak fatal: sesi darurat tetap lanjut walau pemanasan audio gagal.
   */
  const warmUpAudio = useCallback(
    (): Promise<void> =>
      runAudioWarmUp(ensurePlaybackAudioContext(), unlockPlaybackAudio()).then(
        setAudioWarmupNote
      ),
    [ensurePlaybackAudioContext, unlockPlaybackAudio]
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
    const warmUpTask = warmUpAudio();
    setHasStarted(true);
    setPhase("connecting");
    try {
      await warmUpTask;
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
    const warmUpTask = warmUpAudio();
    try {
      await warmUpTask;
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
    playbackGraphCleanup.current?.();
    playbackGraphCleanup.current = null;
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

  const isStalled = useStalledAfter(
    displayedPhase === "connecting",
    AUDIO_WARMUP_TIMEOUT_MS
  );

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

      {isStalled ? (
        <Alert>
          <AlertTitle>Audio lama merespons</AlertTitle>
          <AlertDescription>
            <AudioDiagnostics
              audioContextState={playbackAudioContext.current?.state ?? null}
              audioSessionStatus={audioSession.status}
              lastError={
                voiceError ?? audioSession.error ?? transcription.error ?? null
              }
              transcriptionStatus={transcription.status}
              warmupNote={audioWarmupNote}
            />
          </AlertDescription>
        </Alert>
      ) : null}

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

      <VoiceResponseErrorAlert
        canRetry={Boolean(lastAssistantText.current)}
        error={voiceError}
        onRetry={handleRetryVoice}
      />

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
