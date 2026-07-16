import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";

export type VoiceTranscriptionStatus = "idle" | "listening" | "unavailable";

const RECOGNITION_OPTIONS = {
  continuous: true,
  interimResults: true,
  lang: "id-ID",
} as const;

const NON_RECOVERABLE_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "language-not-supported",
]);

interface UseVoiceTranscriptionOptions {
  enabled: boolean;
  onFinalResult: (text: string) => void;
}

/**
 * On-device speech-to-text for voice mode. Converts spoken emergency
 * reports into text locally (expo-speech-recognition), then hands the
 * recognized text to the same appendReporterText path text-mode already
 * uses — no backend/AI changes needed, since OpenRouterCaseAssistant only
 * ever reads report.messages[] regardless of how the text arrived.
 */
export function useVoiceTranscription({
  enabled,
  onFinalResult,
}: UseVoiceTranscriptionOptions) {
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<VoiceTranscriptionStatus>("idle");
  const onFinalResultRef = useRef(onFinalResult);
  const shouldRestartRef = useRef(true);
  onFinalResultRef.current = onFinalResult;

  useEffect(() => {
    if (!enabled) {
      ExpoSpeechRecognitionModule.stop();
      setStatus("idle");
      return;
    }

    shouldRestartRef.current = true;
    let cancelled = false;

    (async () => {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (cancelled) {
        return;
      }
      if (!permission.granted) {
        shouldRestartRef.current = false;
        setStatus("unavailable");
        return;
      }
      ExpoSpeechRecognitionModule.start(RECOGNITION_OPTIONS);
      setStatus("listening");
    })();

    return () => {
      cancelled = true;
      shouldRestartRef.current = false;
      ExpoSpeechRecognitionModule.stop();
    };
  }, [enabled]);

  useSpeechRecognitionEvent("result", (event) => {
    if (!enabled) {
      return;
    }
    const transcript = event.results[0]?.transcript;
    if (!transcript) {
      return;
    }
    if (event.isFinal) {
      setInterimText("");
      onFinalResultRef.current(transcript);
    } else {
      setInterimText(transcript);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (!(enabled && NON_RECOVERABLE_ERRORS.has(event.error))) {
      return;
    }
    shouldRestartRef.current = false;
    setStatus("unavailable");
  });

  useSpeechRecognitionEvent("end", () => {
    if (!(enabled && shouldRestartRef.current)) {
      return;
    }
    // iOS/Android both stop recognition after a pause even in continuous
    // mode — restart to keep listening for the rest of the call.
    ExpoSpeechRecognitionModule.start(RECOGNITION_OPTIONS);
  });

  return { interimText, status };
}
