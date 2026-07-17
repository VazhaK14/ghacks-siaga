import type {
  AudioClassifier as AudioClassifierInstance,
  Category,
} from "@mediapipe/tasks-audio";
import { useEffect, useRef, useState } from "react";

import type { ReporterReport } from "./types";

type AcousticCode = ReporterReport["acousticSignals"][number]["code"];

interface AcousticDetection {
  code: AcousticCode;
  confidence: number;
  endedAt: Date;
  startedAt: Date;
}

interface AcousticMonitoringOptions {
  enabled: boolean;
  mediaStream: MediaStream | null;
  onDetection: (detection: AcousticDetection) => Promise<void>;
}

type AcousticMonitoringStatus = "idle" | "loading" | "listening" | "error";

const MODEL_URL =
  "https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.35/wasm";
const REGULAR_THRESHOLD = 0.8;
const CRITICAL_THRESHOLD = 0.9;
const DETECTION_COOLDOWN_MS = 10_000;
const CLASSIFICATION_INTERVAL_MS = 750;

const CLASS_LABELS: Array<{
  code: AcousticCode;
  pattern: RegExp;
}> = [
  { code: "GUNSHOT", pattern: /gunshot|gunfire|machine gun/i },
  { code: "EXPLOSION", pattern: /explosion|boom/i },
  { code: "SCREAM", pattern: /screaming|scream/i },
  { code: "CRYING", pattern: /crying|sobbing|wail/i },
  { code: "GLASS_BREAKING", pattern: /glass|shatter/i },
  { code: "AGGRESSIVE_SHOUTING", pattern: /shout|yell/i },
];

const toAcousticCode = (categoryName: string): AcousticCode | null => {
  for (const candidate of CLASS_LABELS) {
    if (candidate.pattern.test(categoryName)) {
      return candidate.code;
    }
  }
  return null;
};

interface DetectionWindowState {
  lastReportedAt: Map<AcousticCode, number>;
  recentDetections: Map<AcousticCode, boolean[]>;
}

const getHighestScores = (
  categories: Category[]
): Map<AcousticCode, number> => {
  const highestByCode = new Map<AcousticCode, number>();
  for (const category of categories) {
    const code = toAcousticCode(category.categoryName);
    if (code) {
      highestByCode.set(
        code,
        Math.max(highestByCode.get(code) ?? 0, category.score)
      );
    }
  }
  return highestByCode;
};

const isCriticalCode = (code: AcousticCode): boolean =>
  code === "GUNSHOT" || code === "EXPLOSION";

const updateDetectionHistory = (
  code: AcousticCode,
  detected: boolean,
  state: DetectionWindowState
): number => {
  const history = state.recentDetections.get(code) ?? [];
  history.push(detected);
  if (history.length > 3) {
    history.shift();
  }
  state.recentDetections.set(code, history);
  return history.filter(Boolean).length;
};

const getQualifiedDetections = (
  categories: Category[],
  now: number,
  state: DetectionWindowState
): AcousticDetection[] => {
  const highestByCode = getHighestScores(categories);
  const detections: AcousticDetection[] = [];
  for (const { code } of CLASS_LABELS) {
    const confidence = highestByCode.get(code) ?? 0;
    const threshold = isCriticalCode(code)
      ? CRITICAL_THRESHOLD
      : REGULAR_THRESHOLD;
    const hits = updateDetectionHistory(code, confidence >= threshold, state);
    const qualifies = isCriticalCode(code)
      ? confidence >= threshold
      : hits >= 2;
    const lastReported = state.lastReportedAt.get(code) ?? 0;
    if (!(qualifies && now - lastReported >= DETECTION_COOLDOWN_MS)) {
      continue;
    }
    state.lastReportedAt.set(code, now);
    const endedAt = new Date();
    detections.push({
      code,
      confidence,
      endedAt,
      startedAt: new Date(endedAt.getTime() - 1000),
    });
  }
  return detections;
};

export const useAcousticMonitoring = ({
  enabled,
  mediaStream,
  onDetection,
}: AcousticMonitoringOptions) => {
  const callbackRef = useRef(onDetection);
  const [status, setStatus] = useState<AcousticMonitoringStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [latestDetection, setLatestDetection] =
    useState<AcousticDetection | null>(null);
  callbackRef.current = onDetection;

  useEffect(() => {
    if (!(enabled && mediaStream)) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let audioContext: AudioContext | null = null;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let classifier: AudioClassifierInstance | null = null;
    let lastClassificationAt = 0;
    const detectionState: DetectionWindowState = {
      lastReportedAt: new Map(),
      recentDetections: new Map(),
    };

    const start = async (): Promise<void> => {
      setStatus("loading");
      setError(null);
      const { AudioClassifier: AudioClassifierFactory, FilesetResolver } =
        await import("@mediapipe/tasks-audio");
      const fileset = await FilesetResolver.forAudioTasks(WASM_URL);
      classifier = await AudioClassifierFactory.createFromOptions(fileset, {
        baseOptions: { delegate: "CPU", modelAssetPath: MODEL_URL },
        maxResults: 8,
        scoreThreshold: 0.5,
      });
      if (cancelled) {
        classifier.close();
        return;
      }
      audioContext = new AudioContext();
      source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(16_384, 1, 1);
      const mutedOutput = audioContext.createGain();
      mutedOutput.gain.value = 0;
      processor.onaudioprocess = async (event) => {
        const now = performance.now();
        if (now - lastClassificationAt < CLASSIFICATION_INTERVAL_MS) {
          return;
        }
        lastClassificationAt = now;
        const input = new Float32Array(event.inputBuffer.getChannelData(0));
        const results = classifier?.classify(
          input,
          event.inputBuffer.sampleRate
        );
        const categories = results?.[0]?.classifications[0]?.categories ?? [];
        const detections = getQualifiedDetections(
          categories,
          now,
          detectionState
        );
        const latest = detections.at(-1);
        if (latest) {
          setLatestDetection(latest);
        }
        await Promise.all(detections.map((item) => callbackRef.current(item)));
      };
      source.connect(processor);
      processor.connect(mutedOutput);
      mutedOutput.connect(audioContext.destination);
      setStatus("listening");
    };

    start().catch((caughtError: unknown) => {
      if (!cancelled) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Model analisis suara gagal dimuat."
        );
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      processor?.disconnect();
      source?.disconnect();
      classifier?.close();
      audioContext?.close().catch(() => undefined);
    };
  }, [enabled, mediaStream]);

  return { error, latestDetection, status };
};
