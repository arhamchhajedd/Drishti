"use client";

import React, { useState, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useSpeech } from "@/hooks/useSpeech";
import { useVibration } from "@/hooks/useVibration";
import { useAutoScan } from "@/hooks/useAutoScan";
import { useWakeLock } from "@/hooks/useWakeLock";
import { CameraTopBar, Mode } from "./CameraTopBar";
import { CameraResultCard } from "./CameraResultCard";

interface CameraViewProps {
  onBack: () => void;
}

export default function CameraView({ onBack }: CameraViewProps) {
  const { videoRef, isActive, error, hasTorch, isTorchOn, startCamera, stopCamera, captureFrame, toggleTorch } =
    useCamera();
  const { speak, stop: stopSpeech, repeatLast } = useSpeech();
  const { vibrate } = useVibration();

  const [mode, setMode] = useState<Mode>("scene");

  const { isScanning, isProcessing, resultText, toggleScanning } = useAutoScan({
    isActive,
    mode,
    captureFrame,
    speak,
    vibrate,
  });

  // Screen Wake Lock: keeps display awake during hands-free scanning
  useWakeLock(isActive && isScanning);

  useEffect(() => {
    startCamera();
    vibrate("success");
    speak("Ready.");
    return () => {
      stopCamera();
      stopSpeech();
    };
  }, [startCamera, stopCamera, stopSpeech, speak, vibrate]);

  const handleModeChange = (newMode: Mode) => {
    vibrate("tap");
    setMode(newMode);
    speak(newMode === "scene" ? "Scene description mode." : "Text reading mode.");
  };

  return (
    <div
      onClick={toggleScanning}
      className="relative flex flex-col h-[100dvh] w-full bg-black text-white overflow-hidden select-none cursor-pointer"
      role="region"
      aria-label="Drishti Live Camera View. Tap anywhere to pause or resume scanning."
    >
      <div onClick={(e) => e.stopPropagation()}>
        <CameraTopBar
          mode={mode}
          hasTorch={hasTorch}
          isTorchOn={isTorchOn}
          onBack={onBack}
          onToggleMode={handleModeChange}
          onToggleTorch={toggleTorch}
        />
      </div>

      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center pointer-events-none">
        <video ref={videoRef} playsInline autoPlay muted className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-10 border border-white/15 rounded-3xl pointer-events-none" aria-hidden="true" />

        {error && (
          <div className="absolute inset-6 bg-black/90 p-6 rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center gap-4 z-30 pointer-events-auto">
            <p className="text-sm font-medium text-zinc-300">{error}</p>
            <button onClick={startCamera} className="px-6 py-3 bg-white text-black font-semibold rounded-full min-h-[48px]">
              Enable Camera
            </button>
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <CameraResultCard mode={mode} resultText={resultText} onRepeat={repeatLast} />
      </div>

      <footer className="absolute bottom-0 inset-x-0 p-6 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-2 z-20 pointer-events-none">
        <div
          className={`w-full max-w-md py-6 px-8 rounded-full font-semibold text-lg transition-all min-h-[76px] flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] ${
            !isScanning
              ? "bg-zinc-800 text-zinc-200 border border-white/20"
              : isProcessing
              ? "bg-white/90 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isScanning ? (
            <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
          )}
          <span>
            {!isScanning
              ? "Paused · Tap Anywhere to Resume"
              : isProcessing
              ? "Analyzing Scene..."
              : "Scanning Live · Tap Anywhere to Pause"}
          </span>
        </div>
      </footer>
    </div>
  );
}
