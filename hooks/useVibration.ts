"use client";

import { useCallback } from "react";

export type VibrationPattern = "tap" | "success" | "hazard" | "custom";

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
      // Gracefully ignore devices blocking vibrate
    }
  }, []);

  return { vibrate };
}
