"use client";

import { useState, useCallback, useRef } from "react";

export type SpeechPriority = "normal" | "hazard";

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
  const currentPriorityRef = useRef<SpeechPriority>("normal");
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
      currentPriorityRef.current = "normal";
      activeUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, interrupt: boolean = true, onEnd?: () => void, priority: SpeechPriority = "normal") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onEnd?.();
        return;
      }

      const cleanText = sanitizeSpokenText(text);
      if (!cleanText) {
        onEnd?.();
        return;
      }

      // Hazards always interrupt other speech. Normal speech cannot interrupt an active hazard.
      if (activeUtteranceRef.current && currentPriorityRef.current === "hazard" && priority === "normal") {
        onEnd?.();
        return;
      }

      clearSafetyTimer();

      if (interrupt || priority === "hazard") {
        window.speechSynthesis.cancel();
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      setLastSpoken(cleanText);
      currentPriorityRef.current = priority;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      activeUtteranceRef.current = utterance;
      utterance.rate = priority === "hazard" ? 1.15 : 1.1;
      utterance.pitch = priority === "hazard" ? 1.1 : 1.0;
      utterance.lang = "en-US";

      let finished = false;
      const handleDone = () => {
        if (finished) return;
        finished = true;
        clearSafetyTimer();
        activeUtteranceRef.current = null;
        currentPriorityRef.current = "normal";
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = handleDone;
      utterance.onerror = handleDone;

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
