"use client";

import React from "react";

export type Mode = "scene" | "text";

interface CameraTopBarProps {
  mode: Mode;
  hasTorch: boolean;
  isTorchOn: boolean;
  onBack: () => void;
  onToggleMode: (mode: Mode) => void;
  onToggleTorch: () => void;
}

export function CameraTopBar({
  mode,
  hasTorch,
  isTorchOn,
  onBack,
  onToggleMode,
  onToggleTorch,
}: CameraTopBarProps) {
  return (
    <header className="absolute top-0 inset-x-0 p-4 pt-6 flex items-center justify-between z-20 pointer-events-auto">
      {/* Back Button Pill */}
      <button
        onClick={onBack}
        className="px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white font-medium text-xs hover:bg-white/20 active:scale-95 transition-all min-h-[48px] flex items-center gap-1.5 focus:ring-2 focus:ring-white"
        aria-label="Return to home screen"
      >
        <span aria-hidden="true">‹</span>
        <span>Back</span>
      </button>

      {/* Segmented Mode Control */}
      <div className="flex items-center bg-black/60 backdrop-blur-xl p-1 rounded-full border border-white/20">
        <button
          onClick={() => onToggleMode("scene")}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-[44px] ${
            mode === "scene"
              ? "bg-white text-black shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
          aria-pressed={mode === "scene"}
          aria-label="Scene mode"
        >
          Scene
        </button>
        <button
          onClick={() => onToggleMode("text")}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-[44px] ${
            mode === "text"
              ? "bg-white text-black shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
          aria-pressed={mode === "text"}
          aria-label="Text reader mode"
        >
          Text
        </button>
      </div>

      {/* Torch Toggle Pill */}
      {hasTorch ? (
        <button
          onClick={onToggleTorch}
          className={`px-3 py-2.5 rounded-full border text-xs font-medium transition-all min-h-[48px] min-w-[48px] flex items-center justify-center ${
            isTorchOn
              ? "bg-white border-white text-black"
              : "bg-black/60 backdrop-blur-xl border-white/20 text-white hover:bg-white/10"
          }`}
          aria-label={isTorchOn ? "Turn off torch" : "Turn on torch"}
        >
          {isTorchOn ? "● Light" : "○ Light"}
        </button>
      ) : (
        <div className="w-12" aria-hidden="true" />
      )}
    </header>
  );
}
