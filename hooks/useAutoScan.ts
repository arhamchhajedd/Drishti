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
  const runnerRef = useRef<(() => void) | null>(null);
  const lastOutputRef = useRef<string>("");

  const clearScanTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = useCallback((delayMs: number) => {
    clearScanTimer();
    timerRef.current = setTimeout(() => {
      if (runnerRef.current) {
        runnerRef.current();
      }
    }, delayMs);
  }, []);

  const processNextFrame = useCallback(async () => {
    if (!isMountedRef.current || !isActive || isProcessing) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      scheduleNext(300);
      return;
    }

    setIsProcessing(true);

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

        // Alert user via distinct vibration
        if (hasHazards) {
          vibrate("hazard");
        } else {
          vibrate("success");
        }

        const isDuplicate = output.toLowerCase() === lastOutputRef.current.toLowerCase();
        lastOutputRef.current = output;

        if (isDuplicate) {
          // If scene is unchanged, wait quietly for 2.5s before taking next snapshot
          scheduleNext(2500);
        } else {
          // Live speaking: Speak immediately with crisp tempo
          speak(output, true, () => {
            if (isMountedRef.current && isScanning) {
              // Rapid sequential cadence for blind live navigation (600ms gap)
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
  }, [isActive, isProcessing, isScanning, mode, captureFrame, speak, vibrate, scheduleNext]);

  useEffect(() => {
    runnerRef.current = processNextFrame;
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (isActive && isScanning && !isProcessing) {
      scheduleNext(150);
    }
    return () => {
      clearScanTimer();
    };
  }, [isActive, isScanning, isProcessing, scheduleNext]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearScanTimer();
    };
  }, []);

  const toggleScanning = useCallback(() => {
    clearScanTimer();
    setIsScanning((prev) => {
      const next = !prev;
      vibrate("tap");
      speak(next ? "Scanning resumed." : "Scanning paused.");
      return next;
    });
  }, [speak, vibrate]);

  return {
    isScanning,
    isProcessing,
    resultText,
    toggleScanning,
  };
}
