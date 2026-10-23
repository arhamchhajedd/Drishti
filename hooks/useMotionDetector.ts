"use client";

import { useEffect, useRef, useCallback } from "react";
import { Direction } from "./useVibration";
import { debugLogger } from "@/lib/debug";

interface UseMotionDetectorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  onInstantWarning?: (direction: Direction, isUrgent: boolean, warningText: string) => void;
}

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 36;
const MOTION_THRESHOLD = 28; // Pixel brightness delta threshold
const LOOM_THRESHOLD = 0.35; // 35% sudden center growth for approaching warning
const THROTTLE_MS = 2500; // Throttle to prevent nagging

export function useMotionDetector({
  videoRef,
  isActive,
  onInstantWarning,
}: UseMotionDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const lastSceneChangeTimeRef = useRef<number>(0);
  const sceneChangedRef = useRef<boolean>(true);

  // Initialize canvas
  useEffect(() => {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_WIDTH;
      canvas.height = SAMPLE_HEIGHT;
      canvasRef.current = canvas;
    }
  }, []);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const frameData = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const currentPixels = frameData.data;

    if (!prevPixelsRef.current) {
      prevPixelsRef.current = new Uint8ClampedArray(currentPixels);
      return;
    }

    const prevPixels = prevPixelsRef.current;
    let diffLeft = 0;
    let diffAhead = 0;
    let diffRight = 0;
    const thirdWidth = Math.floor(SAMPLE_WIDTH / 3);

    for (let y = 0; y < SAMPLE_HEIGHT; y++) {
      for (let x = 0; x < SAMPLE_WIDTH; x++) {
        const i = (y * SAMPLE_WIDTH + x) * 4;
        const curLum = currentPixels[i]! * 0.299 + currentPixels[i + 1]! * 0.587 + currentPixels[i + 2]! * 0.114;
        const prevLum = prevPixels[i]! * 0.299 + prevPixels[i + 1]! * 0.587 + prevPixels[i + 2]! * 0.114;
        const diff = Math.abs(curLum - prevLum);

        if (diff > MOTION_THRESHOLD) {
          if (x < thirdWidth) diffLeft++;
          else if (x < thirdWidth * 2) diffAhead++;
          else diffRight++;
        }
      }
    }

    // Update previous frame
    prevPixelsRef.current.set(currentPixels);

    const totalDiff = diffLeft + diffAhead + diffRight;
    const totalPixels = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    const changeRatio = totalDiff / totalPixels;

    // Record scene change if > 12% pixels changed
    if (changeRatio > 0.12) {
      sceneChangedRef.current = true;
      lastSceneChangeTimeRef.current = Date.now();
    }

    const now = Date.now();
    if (now - lastAlertTimeRef.current < THROTTLE_MS) return;

    const centerPixels = thirdWidth * SAMPLE_HEIGHT;
    const aheadRatio = diffAhead / centerPixels;

    // Detect fast approaching obstacle ahead
    if (aheadRatio > LOOM_THRESHOLD) {
      lastAlertTimeRef.current = now;
      debugLogger.log("Detector:Alert", "9. Alert: Approaching obstacle ahead (ahead loom)", { aheadRatio });
      onInstantWarning?.("ahead", true, "Caution. Approaching obstacle ahead.");
      return;
    }

    // Detect sudden directional movement on left or right
    const sideThreshold = centerPixels * 0.45;
    if (diffLeft > sideThreshold && diffLeft > diffRight * 1.5) {
      lastAlertTimeRef.current = now;
      debugLogger.log("Detector:Alert", "9. Alert: Movement on left", { diffLeft });
      onInstantWarning?.("left", false, "Movement on left.");
    } else if (diffRight > sideThreshold && diffRight > diffLeft * 1.5) {
      lastAlertTimeRef.current = now;
      debugLogger.log("Detector:Alert", "9. Alert: Movement on right", { diffRight });
      onInstantWarning?.("right", false, "Movement on right.");
    }
  }, [videoRef, onInstantWarning]);

  useEffect(() => {
    if (!isActive) {
      prevPixelsRef.current = null;
      return;
    }

    debugLogger.log("Detector:Ready", "9. On-device detector: active (CPU, 6.6 FPS, luminance grid)");
    const interval = setInterval(analyzeFrame, 150);
    return () => clearInterval(interval);
  }, [isActive, analyzeFrame]);

  // Consumed by Gemini loop: tells if the scene changed since last check
  const consumeSceneChanged = useCallback((): boolean => {
    // If more than 5s passed without check, force refresh for safety
    if (Date.now() - lastSceneChangeTimeRef.current > 5000) {
      return true;
    }
    const changed = sceneChangedRef.current;
    sceneChangedRef.current = false;
    return changed;
  }, []);

  return { consumeSceneChanged };
}
