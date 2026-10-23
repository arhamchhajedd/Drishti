"use client";

import React from "react";

interface CameraResultCardProps {
  resultText: string;
  onRepeat: () => void;
}

export function CameraResultCard({
  resultText,
  onRepeat,
}: CameraResultCardProps) {
  if (!resultText) return null;

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className="absolute top-20 inset-x-4 max-w-md mx-auto bg-black/85 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 z-20 shadow-2xl space-y-3 pointer-events-auto"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
          Description
        </span>
        <button
          onClick={onRepeat}
          className="text-xs text-white/90 hover:text-white font-medium flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 min-h-[48px] focus:ring-2 focus:ring-white focus:outline-none"
          aria-label="Repeat description aloud"
        >
          <span>↺</span>
          <span>Repeat</span>
        </button>
      </div>

      <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
        {resultText}
      </p>
    </section>
  );
}
