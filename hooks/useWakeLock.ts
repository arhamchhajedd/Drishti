"use client";

import { useEffect, useRef, useCallback } from "react";

export function useWakeLock(enabled: boolean = true) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator) || sentinelRef.current) {
      return;
    }
    try {
      sentinelRef.current = await navigator.wakeLock.request("screen");
      sentinelRef.current.onrelease = () => {
        sentinelRef.current = null;
      };
    } catch {
      // Ignored if device blocks wake lock
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Ignored
      }
      sentinelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      requestLock();
    } else {
      releaseLock();
    }

    const handleVisibility = () => {
      if (document.hidden) {
        releaseLock();
      } else if (enabled) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return { requestLock, releaseLock };
}
