"use client";

import React, { useState, useEffect } from "react";
import { debugLogger, DebugLogEntry } from "@/lib/debug";

export function DebugPanel() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (search.get("debug") === "1") {
        setIsVisible(true);
      }
    }
    return debugLogger.subscribe(setLogs);
  }, []);

  if (!isVisible) return null;

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${l.time}] [${l.stage}] ${l.message} ${l.data ? JSON.stringify(l.data) : ""}`)
      .join("\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      aria-label="Debug Panel"
      className="fixed bottom-24 inset-x-2 max-h-56 bg-black/95 text-green-400 font-mono text-[10px] p-2.5 rounded-2xl border border-green-500/40 z-50 overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl pointer-events-auto"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-green-500/20 mb-1">
        <span className="font-bold text-white uppercase tracking-wider text-[11px]">Pipeline Debug HUD</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/40"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => debugLogger.clear()}
            className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-1.5 py-0.5 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-zinc-900 pr-1">
        {logs.map((log) => (
          <div key={log.id} className="pt-1 leading-tight break-all">
            <span className="text-zinc-500">[{log.time}]</span>{" "}
            <span className="text-amber-300 font-semibold">{log.stage}:</span>{" "}
            <span className="text-zinc-100">{log.message}</span>
            {log.data && (
              <span className="text-zinc-400 block text-[9px] pl-2">{JSON.stringify(log.data)}</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
