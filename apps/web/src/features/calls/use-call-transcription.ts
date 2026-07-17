import {
  AudioFormat,
  CommitStrategy,
  type RealtimeConnection,
  RealtimeEvents,
  Scribe,
} from "@elevenlabs/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { trpc } from "@/utils/trpc";

import type { CallTranscriptionStatus } from "./types";

const TARGET_SAMPLE_RATE = 16_000;

const resample = (samples: Float32Array, sourceRate: number): Float32Array => {
  if (sourceRate === TARGET_SAMPLE_RATE) {
    return samples;
  }
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const output = new Float32Array(
    Math.max(1, Math.round(samples.length / ratio))
  );
  for (let index = 0; index < output.length; index += 1) {
    output[index] =
      samples[Math.min(samples.length - 1, Math.floor(index * ratio))] ?? 0;
  }
  return output;
};

const toPcmBase64 = (samples: Float32Array): string => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(
      index * 2,
      Math.round(sample < 0 ? sample * 32_768 : sample * 32_767),
      true
    );
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export const useCallTranscription = (input: {
  enabled: boolean;
  mediaStream: MediaStream | null;
  onCommittedText: (text: string) => void;
}) => {
  const { enabled, mediaStream, onCommittedText } = input;
  const tokenMutation = useMutation(
    trpc.report.getOperatorTranscriptionToken.mutationOptions()
  );
  const callbackRef = useRef(onCommittedText);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<CallTranscriptionStatus>("idle");
  callbackRef.current = onCommittedText;

  useEffect(() => {
    if (!(enabled && mediaStream)) {
      setError(null);
      setInterimText("");
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let connection: RealtimeConnection | null = null;
    let audioContext: AudioContext | null = null;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let connectionOpen = false;

    setError(null);
    setStatus("connecting");

    const start = async (): Promise<void> => {
      const access = await tokenMutation.mutateAsync();
      if (cancelled) {
        return;
      }
      if (!(access.available && access.token)) {
        setError(access.message ?? "Transkripsi AI belum tersedia.");
        setStatus("unavailable");
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
        setStatus("active");
      });
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, ({ text }) => {
        setInterimText(text);
      });
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, ({ text }) => {
        const committedText = text.trim();
        setInterimText("");
        if (committedText) {
          callbackRef.current(committedText);
        }
      });
      connection.on(RealtimeEvents.ERROR, () => {
        connectionOpen = false;
        setError("Transkripsi AI mengalami gangguan. Audio tetap aktif.");
        setStatus("failed");
      });
      connection.on(RealtimeEvents.CLOSE, () => {
        connectionOpen = false;
        if (!cancelled) {
          setError("Koneksi transkripsi AI terputus. Audio tetap aktif.");
          setStatus("failed");
        }
      });
      audioContext = new AudioContext();
      source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      const mutedOutput = audioContext.createGain();
      mutedOutput.gain.value = 0;
      processor.onaudioprocess = (event) => {
        if (!(connection && connectionOpen)) {
          return;
        }
        connection.send({
          audioBase64: toPcmBase64(
            resample(
              event.inputBuffer.getChannelData(0),
              event.inputBuffer.sampleRate
            )
          ),
        });
      };
      source.connect(processor);
      processor.connect(mutedOutput);
      mutedOutput.connect(audioContext.destination);
    };

    start().catch((caughtError: unknown) => {
      if (cancelled) {
        return;
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Transkripsi AI gagal dimulai."
      );
      setStatus("failed");
    });
    return () => {
      cancelled = true;
      processor?.disconnect();
      source?.disconnect();
      connection?.close();
      audioContext?.close().catch(() => undefined);
    };
  }, [enabled, mediaStream, tokenMutation.mutateAsync]);

  return { error, interimText, status };
};
