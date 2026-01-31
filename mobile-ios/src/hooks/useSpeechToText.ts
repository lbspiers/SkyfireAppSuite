// src/hooks/useSpeechToText.ts
import { useCallback, useEffect, useRef, useState } from "react";
// Most versions use a default export named Voice
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

type LangCode = string;

export type UseSpeechToText = {
  listening: boolean;
  partial: string;
  finalText: string;
  start: (ms?: number) => void;
  stop: () => void;
  reset: () => void;
};

function useSpeechToText(language: LangCode = "en-US"): UseSpeechToText {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      Voice.destroy().catch(console.warn);
    };
  }, []);

  // Set up Voice event handlers
  useEffect(() => {
    Voice.onSpeechStart = () => {
      setListening(true);
    };

    Voice.onSpeechEnd = () => {
      setListening(false);
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] || "";
      setPartial(text);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] || "";
      setFinalText(text);
      setPartial("");
      setListening(false);
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.warn("[useSpeechToText] Error:", event.error);
      setListening(false);
      setPartial("");
    };

    return () => {
      Voice.removeAllListeners();
    };
  }, []);

  const start = useCallback(
    async (timeoutMs: number = 10000) => {
      try {
        setPartial("");
        setFinalText("");

        await Voice.start(language);

        // Set timeout to auto-stop
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
          try {
            await Voice.stop();
          } catch (e) {
            console.warn("[useSpeechToText] Timeout stop error:", e);
          }
        }, timeoutMs);
      } catch (error) {
        console.warn("[useSpeechToText] Start error:", error);
        setListening(false);
      }
    },
    [language]
  );

  const stop = useCallback(async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      await Voice.stop();
    } catch (error) {
      console.warn("[useSpeechToText] Stop error:", error);
    }
  }, []);

  const reset = useCallback(() => {
    setPartial("");
    setFinalText("");
    if (listening) {
      stop();
    }
  }, [listening, stop]);

  return {
    listening,
    partial,
    finalText,
    start,
    stop,
    reset,
  };
}

// Export both named and default for maximum compatibility
export { useSpeechToText };
export default useSpeechToText;
