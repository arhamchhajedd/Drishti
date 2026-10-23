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
      scheduleNext(400);
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
      const output = data.spoken_summary || "Scene analyzed.";

      if (isMountedRef.current) {
        setResultText(output);
        vibrate("success");
        speak(output, true, () => {
          if (isMountedRef.current && isScanning) {
            scheduleNext(1500);
          }
        });
      }
    } catch {
      if (isMountedRef.current && isScanning) {
        scheduleNext(3000);
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [isActive, isProcessing, isScanning, mode, captureFrame, speak, vibrate, scheduleNext]);

  // Keep runnerRef updated with the latest callback
  useEffect(() => {
    runnerRef.current = processNextFrame;
  });

  // Start continuous loop when camera is active and scanning is enabled
  useEffect(() => {
    isMountedRef.current = true;
    if (isActive && isScanning && !isProcessing) {
      scheduleNext(200);
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
      speak(next ? "Continuous scanning resumed." : "Scanning paused.");
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
