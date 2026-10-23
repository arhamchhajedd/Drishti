"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { debugLogger } from "@/lib/debug";

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

export function useCamera(onError?: (errorMessage: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsTorchOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    // If stream is already active and tracks are running, avoid duplicate restarts
    if (streamRef.current && streamRef.current.active && streamRef.current.getVideoTracks().some(t => t.readyState === "live")) {
      setIsActive(true);
      setError(null);
      return;
    }

    try {
      stopCamera();

      let mediaStream: MediaStream;
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback for laptops, webcams, or browsers with strict constraint checks
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        debugLogger.log("Camera:Active", "2. Camera stream active", {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
        });
      }

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setIsActive(false);
          const msg = "Camera connection lost.";
          setError(msg);
          onErrorRef.current?.(msg);
        };
        const capabilities = videoTrack.getCapabilities() as TorchCapabilities;
        setHasTorch(Boolean(capabilities?.torch));
      }

      setError(null);
      setIsActive(true);
    } catch {
      const msg = "Camera permission denied or camera not found.";
      setError(msg);
      setIsActive(false);
      onErrorRef.current?.(msg);
    }
  }, [stopCamera]);

  // Stop camera when backgrounded or tab hidden (AGENTS.md rule)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopCamera]);

  // Capture and compress frame to max 640px long edge, JPEG 0.7 (AGENTS.md rule)
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const maxEdge = 640;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height && width > maxEdge) {
      height = Math.round((height * maxEdge) / width);
      width = maxEdge;
    } else if (height > maxEdge) {
      width = Math.round((width * maxEdge) / height);
      height = maxEdge;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
    debugLogger.log("Camera:FrameCaptured", `4. Frame captured (${sizeKb} KB)`, { sizeKb, width, height });
    return dataUrl;
  }, []);

  // Toggle torch without 'any'
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          // @ts-expect-error Torch is a valid browser extension on MediaTrackConstraints in mobile Chrome
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch {
        // Torch constraint failed
      }
    }
  }, [hasTorch, isTorchOn]);

  return {
    videoRef,
    isActive,
    error,
    hasTorch,
    isTorchOn,
    startCamera,
    stopCamera,
    captureFrame,
    toggleTorch,
  };
}
