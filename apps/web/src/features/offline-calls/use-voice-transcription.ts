import { useEffect, useRef, useState } from "react";

const NON_RECOVERABLE_ERRORS = new Set([
  "audio-capture",
  "language-not-supported",
  "not-allowed",
  "service-not-allowed",
]);
const MAX_RESTART_ATTEMPTS = 3;
const INITIAL_RESTART_DELAY_MS = 750;
const MAX_RESTART_DELAY_MS = 4000;

interface UseVoiceTranscriptionOptions {
  enabled: boolean;
  onFinalResult: (result: { confidence?: number; text: string }) => void;
}

export const useVoiceTranscription = ({
  enabled,
  onFinalResult,
}: UseVoiceTranscriptionOptions) => {
  const [interimText, setInterimText] = useState("");
  const [isUnavailable, setIsUnavailable] = useState(false);
  const callbackRef = useRef(onFinalResult);
  callbackRef.current = onFinalResult;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setIsUnavailable(true);
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
        const text = alternative?.transcript?.trim();
        if (!text) {
          continue;
        }
        if (result.isFinal) {
          setInterimText("");
          callbackRef.current({ confidence: alternative.confidence, text });
        } else {
          interim = `${interim} ${text}`.trim();
        }
      }
      setInterimText(interim);
    };
    recognition.onerror = (event) => {
      if (NON_RECOVERABLE_ERRORS.has(event.error)) {
        shouldRestart = false;
        setIsUnavailable(true);
      }
    };
    recognition.onend = () => {
      if (!shouldRestart) {
        return;
      }
      if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
        setIsUnavailable(true);
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
        } catch {
          shouldRestart = false;
          setIsUnavailable(true);
        }
      }, delay);
    };
    try {
      recognition.start();
    } catch {
      shouldRestart = false;
      setIsUnavailable(true);
    }
    return () => {
      shouldRestart = false;
      if (restartTimer) {
        clearTimeout(restartTimer);
      }
      recognition.stop();
    };
  }, [enabled]);

  return { interimText, isUnavailable };
};
