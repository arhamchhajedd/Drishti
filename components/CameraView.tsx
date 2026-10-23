"use client";

import React, { useState, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useSpeech } from "@/hooks/useSpeech";
import { useVibration } from "@/hooks/useVibration";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState("");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      stopSpeech();
    };
  }, [startCamera, stopCamera, stopSpeech]);

  const handleCapture = async () => {
    if (isProcessing) return;
    vibrate("tap");

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      speak("Camera is still warming up. Please hold on.");
      return;
    }

    setIsProcessing(true);
    speak(mode === "scene" ? "Analyzing scene." : "Scanning text.");

    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mode }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const output = data.spoken_summary || "Scene analyzed.";
      setResultText(output);
      vibrate("success");
      speak(output);
    } catch {
      const fallback = "Unable to process. Please tap again to retry.";
      setResultText(fallback);
      vibrate("hazard");
      speak(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    vibrate("tap");
    setMode(newMode);
    speak(newMode === "scene" ? "Scene mode." : "Text reader mode.");
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
      <CameraTopBar
        mode={mode}
        hasTorch={hasTorch}
        isTorchOn={isTorchOn}
        onBack={onBack}
        onToggleMode={handleModeChange}
        onToggleTorch={toggleTorch}
      />

      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center">
        <video ref={videoRef} playsInline autoPlay muted className="absolute inset-0 w-full h-full object-cover" />

        {/* Minimal Apple Viewport Brackets */}
        <div className="absolute inset-10 border border-white/15 rounded-3xl pointer-events-none" aria-hidden="true" />

        {error && (
          <div className="absolute inset-6 bg-black/90 p-6 rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center gap-4 z-30">
            <p className="text-sm font-medium text-zinc-300">{error}</p>
            <button onClick={startCamera} className="px-6 py-3 bg-white text-black font-semibold rounded-full min-h-[48px]">
              Enable Camera
            </button>
          </div>
        )}
      </div>

      <CameraResultCard mode={mode} resultText={resultText} onRepeat={repeatLast} />

      {/* Apple Minimal Giant Shutter Pill Button */}
      <footer className="absolute bottom-0 inset-x-0 p-6 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-2 z-20">
        <button
          onClick={handleCapture}
          disabled={isProcessing || !isActive}
          className={`w-full max-w-md py-6 px-8 rounded-full font-semibold text-lg transition-all min-h-[76px] flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] ${
            isProcessing ? "bg-zinc-800 text-zinc-400" : "bg-white text-black hover:bg-zinc-200"
          }`}
          aria-label={mode === "scene" ? "Tap to describe surroundings" : "Tap to read text"}
        >
          {isProcessing ? (
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-ping mr-2" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-black mr-2" />
          )}
          <span>{isProcessing ? "Processing..." : mode === "scene" ? "Describe Scene" : "Read Text"}</span>
        </button>
      </footer>
    </div>
  );
}
