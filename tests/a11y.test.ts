import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Accessibility Standards & Contract Verifications", () => {
  it("enforces WCAG AAA contrast ratio tokens in Tailwind globals", () => {
    const cssPath = path.resolve(import.meta.dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Must enforce pure black background and white foreground tokens
    expect(cssContent).toContain("--background: #000000;");
    expect(cssContent).toContain("--foreground: #ffffff;");
  });

  it("verifies prefers-reduced-motion media query is configured", () => {
    const cssPath = path.resolve(import.meta.dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).toContain("animation-duration: 0.01ms");
  });

  it("verifies LandingHeader and CameraTopBar include minimum 48px touch targets", () => {
    const headerPath = path.resolve(import.meta.dirname, "../components/LandingHeader.tsx");
    const topBarPath = path.resolve(import.meta.dirname, "../components/CameraTopBar.tsx");

    const headerContent = fs.readFileSync(headerPath, "utf-8");
    const topBarContent = fs.readFileSync(topBarPath, "utf-8");

    // All touch targets must enforce 48px minimum height
    expect(headerContent).toContain("min-h-[48px]");
    expect(topBarContent).toContain("min-h-[48px]");
  });

  it("verifies live ARIA regions are declared in CameraResultCard", () => {
    const cardPath = path.resolve(import.meta.dirname, "../components/CameraResultCard.tsx");
    const cardContent = fs.readFileSync(cardPath, "utf-8");

    expect(cardContent).toContain('aria-live="polite"');
    expect(cardContent).toContain('aria-atomic="true"');
  });

  it("verifies screen wake lock is hooked into CameraView", () => {
    const viewPath = path.resolve(import.meta.dirname, "../components/CameraView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");

    expect(viewContent).toContain("useWakeLock");
  });
});
