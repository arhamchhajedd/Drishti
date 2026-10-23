"use client";

import React, { useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { useSpeech } from "@/hooks/useSpeech";
import { useVibration } from "@/hooks/useVibration";
import { DebugPanel } from "./DebugPanel";
import { debugLogger } from "@/lib/debug";

interface LandingViewProps {
  onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
  const [isPlayingGuide, setIsPlayingGuide] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const { speak, stop, unlockAudioAndSpeech, voiceCount } = useSpeech();
  const { vibrate } = useVibration();

  const handleStart = () => {
    debugLogger.log("Start", "1. Start tap received");
    vibrate("success");
    unlockAudioAndSpeech();
    speak("Vision starting.");
    onStart();
  };

  const handleTestVoice = async () => {
    debugLogger.log("Speech:Test", "Testing voice synthesis and audio playback...");
    vibrate("tap");
    setIsTestingVoice(true);
    unlockAudioAndSpeech();
    await speak("Voice test successful. Drishti is ready to speak.");
    setIsTestingVoice(false);
  };

  const handleToggleGuide = () => {
    if (isPlayingGuide) {
      stop();
      setIsPlayingGuide(false);
      return;
    }
    setIsPlayingGuide(true);
    vibrate("tap");
    unlockAudioAndSpeech();
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

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center my-auto py-8 gap-6">
        <div className="space-y-2">
          <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
            See the world <br />
            <span className="text-zinc-400 font-normal">through sound.</span>
          </p>
          <p className="text-sm text-zinc-400 font-medium">
            Tap the button below to start real-time assistance.
          </p>
        </div>

        {/* Giant Shutter Pill Button */}
        <button
          onClick={handleStart}
          autoFocus
          className="w-full py-6 px-8 rounded-full bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all font-semibold text-xl tracking-tight flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] min-h-[76px] focus:ring-4 focus:ring-zinc-400 focus:outline-none cursor-pointer"
          aria-label="Open Camera and begin vision assistance"
        >
          <span className="w-3 h-3 rounded-full bg-black animate-ping" aria-hidden="true" />
          <span>Open Camera</span>
        </button>

        {/* Secondary Test Voice Button (Accessible 48px Target) */}
        <button
          onClick={handleTestVoice}
          disabled={isTestingVoice}
          className="w-full py-3.5 px-6 rounded-full border border-white/20 bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all font-medium text-sm flex items-center justify-center gap-2 min-h-[48px] focus:ring-2 focus:ring-white cursor-pointer"
          aria-label="Test speech output on this phone"
        >
          <span>{isTestingVoice ? "🔊 Playing Test..." : "🔊 Test Voice"}</span>
          {voiceCount > 0 && <span className="text-xs text-zinc-500">({voiceCount} voices)</span>}
        </button>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-medium">
            Live Objects
          </span>
          <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-medium">
            Hazards First
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

      <DebugPanel />
    </main>
  );
}
