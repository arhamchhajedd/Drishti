"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mode } from "@/components/CameraTopBar";

interface UseAutoScanProps {
  isActive: boolean;
  mode: Mode;
  captureFrame: () => string | null;
  speak: (text: string, interrupt?: boolean, onEnd?: () => void) => void;
  vibrate: (pattern: "tap" | "success" | "hazard") => void;
}

const SESSION_REQUEST_CAP = 120; // Guardrail to prevent endless quota consumption
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity auto-pause

export function useAutoScan({
  isActive,
  mode,
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
  const lastOutputRef = useRef<string>("");
  const requestCountRef = useRef(0);

  const clearScanTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isScanning) {
        setIsScanning(false);
        clearScanTimer();
        speak("Scanning paused due to inactivity. Tap anywhere to resume.");
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [isScanning, speak]);

  const scheduleNext = useCallback((delayMs: number) => {
    clearScanTimer();
    timerRef.current = setTimeout(() => {
      if (runnerRef.current) {
        runnerRef.current();
      }
    }, delayMs);
  }, []);

  const processNextFrame = useCallback(async () => {
    if (!isMountedRef.current || !isActive || isProcessing || !isScanning) return;

    // Check session request limit
    if (requestCountRef.current >= SESSION_REQUEST_CAP) {
      setIsScanning(false);
      clearScanTimer();
      speak("Session limit reached. Tap anywhere to continue scanning.");
      return;
    }

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      scheduleNext(300);
      return;
    }

    setIsProcessing(true);
    requestCountRef.current += 1;

    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mode }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const output = data.spoken_summary?.trim() || "Scene clear.";
      const hasHazards = Array.isArray(data.hazards) && data.hazards.length > 0;

      if (isMountedRef.current) {
        setResultText(output);
        resetInactivityTimer();

        if (hasHazards) {
          vibrate("hazard");
        } else {
          vibrate("success");
        }

        const isDuplicate = output.toLowerCase() === lastOutputRef.current.toLowerCase();
        lastOutputRef.current = output;

        if (isDuplicate) {
          scheduleNext(2500);
        } else {
          speak(output, true, () => {
            if (isMountedRef.current && isScanning) {
              scheduleNext(600);
            }
          });
        }
      }
    } catch {
      if (isMountedRef.current && isScanning) {
        scheduleNext(2000);
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearScanTimer();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  const toggleScanning = useCallback(() => {
    clearScanTimer();
    if (requestCountRef.current >= SESSION_REQUEST_CAP) {
      requestCountRef.current = 0; // Reset session budget on manual tap
    }
    resetInactivityTimer();

    setIsScanning((prev) => {
      const next = !prev;
      vibrate("tap");
      speak(next ? "Scanning resumed." : "Scanning paused.");
      return next;
    });
  }, [speak, vibrate, resetInactivityTimer]);

  return {
    isScanning,
    isProcessing,
    resultText,
    toggleScanning,
  };
}
