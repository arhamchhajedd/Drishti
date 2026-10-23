"use client";

import React from "react";

interface CameraTopBarProps {
  hasTorch: boolean;
  isTorchOn: boolean;
  onBack: () => void;
  onToggleTorch: () => void;
}

export function CameraTopBar({
  hasTorch,
  isTorchOn,
  onBack,
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

      {/* Live Vision Status Pill */}
      <div
        className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-xs font-medium text-white flex items-center gap-2 min-h-[48px]"
        aria-label="Live vision active"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
        <span>Live Vision</span>
      </div>

      {/* Torch Toggle Pill */}
      {hasTorch ? (
        <button
          onClick={onToggleTorch}
          className={`px-3 py-2.5 rounded-full border text-xs font-medium transition-all min-h-[48px] min-w-[48px] flex items-center justify-center focus:ring-2 focus:ring-white ${
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
