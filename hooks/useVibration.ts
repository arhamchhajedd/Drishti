"use client";

import { useCallback } from "react";

export type VibrationPattern = "tap" | "success" | "hazard" | "custom";
export type Direction = "left" | "ahead" | "right";

export function useVibration() {
  const vibrate = useCallback((type: VibrationPattern = "tap", customPattern?: number[]) => {
    if (typeof window === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    try {
      if (type === "tap") {
        navigator.vibrate(35);
      } else if (type === "success") {
        navigator.vibrate([40, 60, 40]);
      } else if (type === "hazard") {
        navigator.vibrate([200, 80, 200, 80, 300]);
      } else if (type === "custom" && customPattern) {
        navigator.vibrate(customPattern);
      }
    } catch {
      // Gracefully ignore devices without vibration support (e.g. iOS Safari)
    }
  }, []);

  const vibrateDirection = useCallback(
    (direction: Direction, urgency: "normal" | "urgent" = "normal") => {
      if (typeof window === "undefined" || !("vibrate" in navigator)) {
        return;
      }

      try {
        if (urgency === "urgent") {
          // Urgent pattern: long heavy bursts
          if (direction === "left") navigator.vibrate([180, 70, 70]);
          else if (direction === "ahead") navigator.vibrate([250, 80, 250, 80, 300]);
          else if (direction === "right") navigator.vibrate([70, 70, 180]);
        } else {
          // Normal directional pattern
          if (direction === "left") navigator.vibrate([70, 50, 40]);
          else if (direction === "ahead") navigator.vibrate([100, 60, 100]);
          else if (direction === "right") navigator.vibrate([40, 50, 70]);
        }
      } catch {
        // Ignored
      }
    },
    []
  );

  return { vibrate, vibrateDirection };
}
