import { useEffect, useRef, useState } from "react";

export type VoiceTranscriptionStatus = "idle" | "listening" | "unavailable";

const NON_RECOVERABLE_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "language-not-supported",
]);

interface UseVoiceTranscriptionOptions {
  enabled: boolean;
  onFinalResult: (text: string) => void;
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
    let shouldRestart = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "id-ID";
    recognition.onresult = (event) => {
      let interim = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) {
          continue;
        }
        if (result.isFinal) {
          setInterimText("");
          callbackRef.current(transcript);
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }
      if (interim) {
        setInterimText(interim);
      }
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
      try {
        recognition.start();
      } catch {
        shouldRestart = false;
        setStatus("unavailable");
      }
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
      recognition.stop();
    };
  }, [enabled]);

  return { interimText, status };
};
