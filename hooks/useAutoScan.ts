"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { debugLogger } from "@/lib/debug";
import { playFallbackBeep } from "@/lib/audio";

interface UseAutoScanProps {
  isActive: boolean;
  mode?: "scene" | "text";
  captureFrame: () => string | null;
  speak: (text: string, interrupt?: boolean) => Promise<boolean>;
  vibrate: (pattern: "tap" | "success" | "hazard") => void;
}

const SESSION_REQUEST_CAP = 120;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const NEVER_SILENT_INTERVAL_MS = 10_000;

export function useAutoScan({
  isActive,
  mode = "scene",
  captureFrame,
  speak,
  vibrate,
}: UseAutoScanProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState("");
  const isMountedRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const runnerRef = useRef<(() => void) | null>(null);
  const requestCountRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const lastSpokenTimestampRef = useRef<number>(Date.now());

  const clearScanTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = useCallback((delayMs: number) => {
    clearScanTimer();
    timerRef.current = setTimeout(() => {
      if (runnerRef.current) runnerRef.current();
    }, delayMs);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isScanning) {
        setIsScanning(false);
        clearScanTimer();
        speak("Scanning paused due to inactivity. Tap anywhere to resume.");
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [isScanning, speak]);

  const processNextFrame = useCallback(async () => {
    if (!isMountedRef.current || !isActive || isProcessing || !isScanning) return;

    if (requestCountRef.current >= SESSION_REQUEST_CAP) {
      setIsScanning(false);
      clearScanTimer();
      speak("Session limit reached. Tap anywhere to continue scanning.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      debugLogger.log("Network:Offline", "Navigator reported offline");
      await speak("You are offline. Please check your internet connection.");
      scheduleNext(4000);
      return;
    }

    // Never silent rule: If 10s passed with no speech, announce status
    if (Date.now() - lastSpokenTimestampRef.current > NEVER_SILENT_INTERVAL_MS) {
      debugLogger.log("Scan:NeverSilent", "7. Decision: 10s silent timeout reached, speaking reminder");
      lastSpokenTimestampRef.current = Date.now();
      await speak("Nothing clear ahead. Please slowly re-aim.");
    }

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      debugLogger.log("Camera:FrameWait", "Video not ready or frame empty, retrying in 250ms");
      scheduleNext(250);
      return;
    }

    setIsProcessing(true);
    requestCountRef.current += 1;

    let nextDelayMs = 350;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 7000);
    const fetchStart = Date.now();

    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mode }),
        signal: abortController.signal,
      });

      const latencyMs = Date.now() - fetchStart;
      debugLogger.log("API:Response", `5. /api/describe HTTP ${res.status}`, { latencyMs, status: res.status });

      if (!res.ok) {
        consecutiveErrorsRef.current += 1;
        if (res.status === 429) {
          nextDelayMs = 3000;
          await speak("Server busy. Pausing briefly.");
        } else if (res.status === 504) {
          nextDelayMs = 2000;
          await speak("Vision request timed out. Retrying.");
        } else {
          nextDelayMs = 2500;
          if (consecutiveErrorsRef.current >= 2) {
            await speak("Service problem, still trying.");
            playFallbackBeep(440, 150);
          }
        }
        return;
      }

      consecutiveErrorsRef.current = 0;
      const data = await res.json();
      debugLogger.log("API:Parsed", "6. Response parsed", {
        confidence: data.confidence,
        hazards: data.hazards?.length || 0,
        objects: data.objects?.length || 0,
      });

      const output = data.spoken_summary?.trim() || "Scene clear.";
      const hasHazards = Array.isArray(data.hazards) && data.hazards.length > 0;

      if (isMountedRef.current) {
        setResultText(output);
        resetInactivityTimer();
        vibrate(hasHazards ? "hazard" : "success");

        lastSpokenTimestampRef.current = Date.now();
        debugLogger.log("Scan:Decision", `7. Decision: spoken (${output.slice(0, 30)}...)`);
        debugLogger.log("Speech:Calling", `8. speak() called for: "${output.slice(0, 30)}..."`);
        await speak(output, true);
        debugLogger.log("Speech:Finished", "8. speak() resolved");
        nextDelayMs = 300;
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      debugLogger.log("API:Exception", isAbort ? "Request timed out" : String(err));
      consecutiveErrorsRef.current += 1;
      nextDelayMs = 2000;

      if (isAbort) {
        await speak("Vision request timed out.");
      } else if (consecutiveErrorsRef.current >= 2) {
        await speak("Service problem, still trying.");
        playFallbackBeep(440, 150);
      }
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setIsProcessing(false);
        if (isScanning) {
          scheduleNext(nextDelayMs);
        }
      }
    }
  }, [isActive, isProcessing, isScanning, mode, captureFrame, speak, vibrate, scheduleNext, resetInactivityTimer]);

  useEffect(() => {
    runnerRef.current = processNextFrame;
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (isActive && isScanning && !isProcessing) {
      scheduleNext(150);
      resetInactivityTimer();
    }
    return () => {
      clearScanTimer();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isActive, isScanning, isProcessing, scheduleNext, resetInactivityTimer]);

  const toggleScanning = useCallback(() => {
    clearScanTimer();
    if (requestCountRef.current >= SESSION_REQUEST_CAP) requestCountRef.current = 0;
    resetInactivityTimer();
    setIsScanning((prev) => {
      const next = !prev;
      vibrate("tap");
      speak(next ? "Scanning resumed." : "Scanning paused.");
      return next;
    });
  }, [speak, vibrate, resetInactivityTimer]);

  return { isScanning, isProcessing, resultText, toggleScanning };
}
