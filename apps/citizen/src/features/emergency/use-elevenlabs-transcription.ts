import {
  AudioFormat,
  CommitStrategy,
  type RealtimeConnection,
  RealtimeEvents,
  Scribe,
} from "@elevenlabs/client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRealtimeTranscriptionTokenMutation } from "./api";

type TranscriptionStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "paused"
  | "error";

interface ElevenLabsTranscriptionOptions {
  enabled: boolean;
  mediaStream: MediaStream | null;
  onCommittedText: (text: string) => Promise<void>;
  paused?: boolean;
}

const TARGET_SAMPLE_RATE = 16_000;
const MAX_AUTO_RECONNECTS = 2;
const RECONNECT_BASE_DELAY_MS = 1000;

const resample = (samples: Float32Array, sourceRate: number): Float32Array => {
  if (sourceRate === TARGET_SAMPLE_RATE) {
    return samples;
  }
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.round(samples.length / ratio));
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = Math.min(samples.length - 1, Math.floor(index * ratio));
    output[index] = samples[sourceIndex] ?? 0;
  }
  return output;
};

const toPcmBase64 = (samples: Float32Array): string => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    const pcm = sample < 0 ? sample * 32_768 : sample * 32_767;
    view.setInt16(index * 2, Math.round(pcm), true);
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export const useElevenLabsTranscription = ({
  enabled,
  mediaStream,
  onCommittedText,
  paused = false,
}: ElevenLabsTranscriptionOptions) => {
  const tokenMutation = useRealtimeTranscriptionTokenMutation();
  const callbackRef = useRef(onCommittedText);
  const pausedRef = useRef(paused);
  const reconnectAttempts = useRef(0);
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  callbackRef.current = onCommittedText;
  pausedRef.current = paused;

  const retry = useCallback(() => {
    reconnectAttempts.current = 0;
    setGeneration((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!(enabled && mediaStream)) {
      setStatus("idle");
      return;
    }
    if (generation > 0) {
      setInterimText("");
    }
    let cancelled = false;
    let connection: RealtimeConnection | null = null;
    let audioContext: AudioContext | null = null;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let connectionOpen = false;
    let reconnectTimer: number | null = null;
    let reconnectScheduled = false;

    const scheduleReconnect = (message: string): void => {
      if (cancelled || reconnectScheduled) {
        return;
      }
      setError(message);
      if (reconnectAttempts.current >= MAX_AUTO_RECONNECTS) {
        setStatus("error");
        return;
      }
      reconnectScheduled = true;
      const delay = RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts.current;
      reconnectAttempts.current += 1;
      setStatus("connecting");
      reconnectTimer = window.setTimeout(() => {
        setGeneration((current) => current + 1);
      }, delay);
    };

    const start = async (): Promise<void> => {
      setStatus("connecting");
      setError(null);
      const access = await tokenMutation.mutateAsync();
      if (!(access.available && access.token)) {
        throw new Error(access.message ?? "Token transkripsi tidak tersedia.");
      }
      if (cancelled) {
        return;
      }
      connection = Scribe.connect({
        audioFormat: AudioFormat.PCM_16000,
        commitStrategy: CommitStrategy.VAD,
        languageCode: "id",
        minSilenceDurationMs: 150,
        minSpeechDurationMs: 150,
        modelId: access.modelId,
        noVerbatim: true,
        sampleRate: TARGET_SAMPLE_RATE,
        token: access.token,
        vadSilenceThresholdSecs: 0.8,
        vadThreshold: 0.4,
      });
      connection.on(RealtimeEvents.OPEN, () => {
        connectionOpen = true;
        reconnectAttempts.current = 0;
        setStatus("listening");
      });
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, ({ text }) => {
        if (!pausedRef.current) {
          setInterimText(text);
        }
      });
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, async ({ text }) => {
        if (pausedRef.current) {
          return;
        }
        const committedText = text.trim();
        setInterimText("");
        if (committedText) {
          await callbackRef.current(committedText);
        }
      });
      connection.on(RealtimeEvents.ERROR, ({ error: nextError }) => {
        scheduleReconnect(nextError);
      });
      connection.on(RealtimeEvents.CLOSE, () => {
        connectionOpen = false;
        if (!cancelled) {
          scheduleReconnect("Koneksi transkripsi terputus.");
        }
      });

      audioContext = new AudioContext();
      source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      const mutedOutput = audioContext.createGain();
      mutedOutput.gain.value = 0;
      processor.onaudioprocess = (event) => {
        if (!(connection && connectionOpen) || pausedRef.current) {
          return;
        }
        const input = event.inputBuffer.getChannelData(0);
        const pcm = resample(input, event.inputBuffer.sampleRate);
        connection.send({ audioBase64: toPcmBase64(pcm) });
      };
      source.connect(processor);
      processor.connect(mutedOutput);
      mutedOutput.connect(audioContext.destination);
    };

    start().catch((caughtError: unknown) => {
      if (!cancelled) {
        scheduleReconnect(
          caughtError instanceof Error
            ? caughtError.message
            : "Transkripsi suara gagal dimulai."
        );
      }
    });

    return () => {
      cancelled = true;
      processor?.disconnect();
      source?.disconnect();
      connection?.close();
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      audioContext?.close().catch(() => undefined);
    };
  }, [enabled, generation, mediaStream, tokenMutation.mutateAsync]);

  const effectiveStatus = paused && status === "listening" ? "paused" : status;
  return {
    error,
    interimText: paused ? "" : interimText,
    retry,
    status: effectiveStatus,
  };
};
