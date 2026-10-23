"use client";

import React, { useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { useSpeech } from "@/hooks/useSpeech";
import { useVibration } from "@/hooks/useVibration";

interface LandingViewProps {
  onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
  const [isPlayingGuide, setIsPlayingGuide] = useState(false);
  const { speak, stop } = useSpeech();
  const { vibrate } = useVibration();

  const handleStart = () => {
    vibrate("success");
    speak(
      "Opening camera. Drishti is an experimental assistance tool, never a replacement for a cane or guide dog. Images are analyzed in memory and not stored.",
      true
    );
    onStart();
  };

  const handleToggleGuide = () => {
    if (isPlayingGuide) {
      stop();
      setIsPlayingGuide(false);
      return;
    }
    setIsPlayingGuide(true);
    vibrate("tap");
    speak(
      "Welcome to Drishti. Point your phone forward and tap anywhere to hear your surroundings. " +
      "Tap the white button in the center to open the camera.",
      true
    );
  };

  return (
    <main
      className="flex flex-col min-h-screen bg-black text-white px-6 py-6 max-w-md mx-auto w-full justify-between select-none"
      role="main"
      aria-label="Drishti AI Accessibility Assistant"
    >
      <LandingHeader isPlayingGuide={isPlayingGuide} onToggleGuide={handleToggleGuide} />

      {/* Apple Minimal Hero Section */}
      <section className="flex flex-col items-center text-center my-auto py-10 gap-8">
        <div className="space-y-3">
          <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
            See the world <br />
            <span className="text-zinc-400 font-normal">through sound.</span>
          </p>
          <p className="text-sm text-zinc-400 font-medium">
            Tap the button below to start real-time assistance.
          </p>
        </div>

        {/* Apple Style Giant Shutter Pill Button */}
        <button
          onClick={handleStart}
          autoFocus
          className="w-full py-6 px-8 rounded-full bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all font-semibold text-xl tracking-tight flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] min-h-[76px] focus:ring-4 focus:ring-zinc-400 focus:outline-none"
          aria-label="Open Camera and begin vision assistance"
        >
          <span className="w-3 h-3 rounded-full bg-black animate-ping" aria-hidden="true" />
          <span>Open Camera</span>
        </button>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-medium">
            Scene Description
          </span>
          <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-medium">
            Text Reader
          </span>
          <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-medium">
            Haptic Cues
          </span>
        </div>
      </section>

      {/* Safety Notice Footer */}
      <footer className="pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
          <strong>Notice:</strong> Experimental aid only. Not a substitute for a cane, guide dog, or personal care.
        </p>
      </footer>
    </main>
  );
}
