"use client";

import React from "react";

interface LandingHeaderProps {
  isPlayingGuide: boolean;
  onToggleGuide: () => void;
}

export function LandingHeader({ isPlayingGuide, onToggleGuide }: LandingHeaderProps) {
  return (
    <header className="flex items-center justify-between w-full pt-4 pb-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
          <span className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">
            Drishti · AI Vision
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          Drishti
        </h1>
      </div>

      <button
        onClick={onToggleGuide}
        className="px-4 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-semibold tracking-wide text-zinc-200 transition-all focus:ring-2 focus:ring-white focus:outline-none min-h-[48px] flex items-center gap-2"
        aria-label={isPlayingGuide ? "Stop audio introduction" : "Listen to audio introduction"}
      >
        <span aria-hidden="true">{isPlayingGuide ? "◼" : "▶"}</span>
        <span>{isPlayingGuide ? "Stop Audio" : "Audio Guide"}</span>
      </button>
    </header>
  );
}
