import { useEffect, useRef, useState } from "react";

export type VoiceTranscriptionStatus = "idle" | "listening" | "unavailable";

const NON_RECOVERABLE_ERRORS = new Set([
  "audio-capture",
  "language-not-supported",
  "not-allowed",
  "service-not-allowed",
]);
const MAX_RESTART_ATTEMPTS = 3;
const INITIAL_RESTART_DELAY_MS = 750;
const MAX_RESTART_DELAY_MS = 4000;

interface FinalTranscript {
  confidence?: number;
  text: string;
}

interface UseVoiceTranscriptionOptions {
  enabled: boolean;
  onFinalResult: (result: FinalTranscript) => void;
}

export const useVoiceTranscription = ({
  enabled,
  onFinalResult,
}: UseVoiceTranscriptionOptions) => {
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<VoiceTranscriptionStatus>("idle");
  const callbackRef = useRef(onFinalResult);
  callbackRef.current = onFinalResult;

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("unavailable");
      return;
    }

    const recognition = new Recognition();
    let restartAttempts = 0;
    let restartTimer: ReturnType<typeof setTimeout> | undefined;
    let shouldRestart = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "id-ID";
    recognition.onresult = (event) => {
      restartAttempts = 0;
      let interim = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const alternative = result?.[0];
        const transcript = alternative?.transcript?.trim();
        if (!transcript) {
          continue;
        }
        if (result.isFinal) {
          setInterimText("");
          callbackRef.current({
            confidence: alternative.confidence,
            text: transcript,
          });
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }
      setInterimText(interim);
    };
    recognition.onerror = (event) => {
      if (NON_RECOVERABLE_ERRORS.has(event.error)) {
        shouldRestart = false;
        setStatus("unavailable");
      }
    };
    recognition.onend = () => {
      if (!shouldRestart) {
        return;
      }
      if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
        shouldRestart = false;
        setStatus("unavailable");
        return;
      }
      const delay = Math.min(
        INITIAL_RESTART_DELAY_MS * 2 ** restartAttempts,
        MAX_RESTART_DELAY_MS
      );
      restartAttempts += 1;
      restartTimer = setTimeout(() => {
        try {
          recognition.start();
          setStatus("listening");
        } catch {
          shouldRestart = false;
          setStatus("unavailable");
        }
      }, delay);
    };

    try {
      recognition.start();
      setStatus("listening");
    } catch {
      shouldRestart = false;
      setStatus("unavailable");
    }

    return () => {
      shouldRestart = false;
      if (restartTimer) {
        clearTimeout(restartTimer);
      }
      recognition.stop();
    };
  }, [enabled]);

  return { interimText, status };
};
