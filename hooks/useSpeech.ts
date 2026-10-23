"use client";

import { useState, useCallback } from "react";

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

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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

      if (interrupt) {
        window.speechSynthesis.cancel();
      }

      setLastSpoken(cleanText);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

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
