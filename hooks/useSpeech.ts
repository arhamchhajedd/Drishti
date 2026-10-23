"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { sanitizeSpokenText } from "@/lib/sanitize";
import { debugLogger } from "@/lib/debug";

import { playFallbackBeep, getAudioContext } from "@/lib/audio";

export { playFallbackBeep };
export type SpeechPriority = "normal" | "hazard";

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const [voiceCount, setVoiceCount] = useState<number>(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load and cache voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      voicesRef.current = available;
      setVoiceCount(available.length);
      debugLogger.log("Speech:VoicesLoaded", `Loaded ${available.length} voices`);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const clearSafetyTimer = () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  // Must be called in user gesture (tap) to unlock audio and speech on mobile Safari/Chrome
  const unlockAudioAndSpeech = useCallback(() => {
    debugLogger.log("Speech:Unlock", "Unlocking AudioContext and SpeechSynthesis...");
    try {
      const ctx = getAudioContext();
      if (ctx?.state === "suspended") ctx.resume();
      playFallbackBeep(880, 80);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const silent = new SpeechSynthesisUtterance(" ");
        silent.volume = 0.01;
        window.speechSynthesis.speak(silent);
        debugLogger.log("Speech:UnlockDone", "Audio context & synthesis unlocked");
      }
    } catch (err) {
      debugLogger.log("Speech:UnlockFailed", String(err));
    }
  }, []);

  const stop = useCallback(() => {
    clearSafetyTimer();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch { /* Ignore */ }
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
      debugLogger.log("Speech:Stop", "Speech stopped");
    }
  }, []);

  // Promise-based speak that is GUARANTEED to resolve (onend, onerror, or watchdog timeout)
  const speak = useCallback(
    (text: string, interrupt = true): Promise<boolean> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          debugLogger.log("Speech:Unavailable", "SpeechSynthesis not supported on this browser");
          playFallbackBeep(440, 200);
          resolve(false);
          return;
        }

        const cleanText = sanitizeSpokenText(text, 220);
        if (!cleanText) {
          resolve(true);
          return;
        }

        debugLogger.log("Speech:SpeakCalled", `"${cleanText.slice(0, 40)}..."`, { length: cleanText.length });
        clearSafetyTimer();

        if (interrupt) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // Ignore cancel errors
          }
        }

        if (window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.resume();
          } catch {
            // Ignore resume errors
          }
        }

        setLastSpoken(cleanText);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        activeUtteranceRef.current = utterance;
        utterance.rate = 1.15;
        utterance.pitch = 1.0;
        utterance.lang = "en-US";

        // Select best available English voice
        if (voicesRef.current.length > 0) {
          const preferredVoice =
            voicesRef.current.find((v) => v.lang.startsWith("en") && v.localService) ||
            voicesRef.current.find((v) => v.lang.startsWith("en")) ||
            voicesRef.current[0];
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        let settled = false;
        const handleDone = (success: boolean, reason: string) => {
          if (settled) return;
          settled = true;
          clearSafetyTimer();
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
          debugLogger.log("Speech:Settled", reason, { success });
          resolve(success);
        };

        utterance.onstart = () => {
          setIsSpeaking(true);
          debugLogger.log("Speech:Started", `"${cleanText.slice(0, 30)}..."`);
        };

        utterance.onend = () => {
          handleDone(true, "onend event");
        };

        utterance.onerror = (e) => {
          debugLogger.log("Speech:Error", e.error || "Speech error event");
          playFallbackBeep(520, 100);
          handleDone(false, `error: ${e.error}`);
        };

        // Watchdog timeout: Guarantees resolution even if mobile browser drops onend
        const words = cleanText.split(/\s+/).length;
        const maxDurationMs = Math.max(1400, (words / 2.2) * 1000 + 1000);
        safetyTimeoutRef.current = setTimeout(() => {
          debugLogger.log("Speech:WatchdogTimeout", `Watchdog fired after ${maxDurationMs}ms`);
          handleDone(true, "watchdog timeout fallback");
        }, maxDurationMs);

        // Allow micro-tick after cancel() for audio queue clearing
        setTimeout(() => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            debugLogger.log("Speech:Exception", String(err));
            playFallbackBeep(440, 200);
            handleDone(false, "speak() exception");
          }
        }, 35);
      });
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
    unlockAudioAndSpeech,
    isSpeaking,
    lastSpoken,
    voiceCount,
  };
}
