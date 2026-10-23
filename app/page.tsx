"use client";

import React, { useState } from "react";
import LandingView from "@/components/LandingView";
import CameraView from "@/components/CameraView";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<"landing" | "camera">("landing");

  return (
    <div className="flex-1 w-full bg-black min-h-screen">
      {activeScreen === "landing" ? (
        <LandingView onStart={() => setActiveScreen("camera")} />
      ) : (
        <CameraView onBack={() => setActiveScreen("landing")} />
      )}
    </div>
  );
}
