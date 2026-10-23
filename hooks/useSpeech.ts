"use client";

import { useState, useCallback, useRef } from "react";

function sanitizeSpokenText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "") // Remove URLs
    .replace(/<[^>]*>/g, "") // Remove HTML markup
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .trim()
    .slice(0, 300); // Cap length
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSafetyTimer = () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearSafetyTimer();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, interrupt: boolean = true, onEnd?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onEnd?.();
        return;
      }

      const cleanText = sanitizeSpokenText(text);
      if (!cleanText) {
        onEnd?.();
        return;
      }

      clearSafetyTimer();

      if (interrupt) {
        window.speechSynthesis.cancel();
      }

      // Resume if browser suspended speech synthesis queue
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      setLastSpoken(cleanText);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      activeUtteranceRef.current = utterance;
      utterance.rate = 1.1; // Crisp, fast tempo optimized for blind accessibility
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      let finished = false;
      const handleDone = () => {
        if (finished) return;
        finished = true;
        clearSafetyTimer();
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = handleDone;
      utterance.onerror = handleDone;

      // Watchdog: If browser drops onend (known mobile Chrome/Safari bug), recover after speech time
      const estimatedDurationMs = Math.max(1200, (cleanText.split(/\s+/).length / 2.2) * 1000 + 1000);
      safetyTimeoutRef.current = setTimeout(handleDone, estimatedDurationMs);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const repeatLast = useCallback(() => {
    if (lastSpoken) {
      speak(lastSpoken, true);
    }
  }, [speak, lastSpoken]);

  return {
    speak,
    stop,
    repeatLast,
    isSpeaking,
    lastSpoken,
  };
}
