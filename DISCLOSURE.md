# DISCLOSURE.md: Drishti AI

Disclosure of all third-party libraries, models, and APIs used in Drishti AI per hackathon requirements.

## 1. Third-Party Frameworks & Libraries

| Dependency | Version | License | Purpose in Project |
|---|---|---|---|
| **Next.js** | `^16.4.2` | MIT | App Router, server-side API routes, Turbopack, and SSR/PWA foundation |
| **React** | `^19.3.0` | MIT | Component tree, hooks, and UI lifecycle management |
| **React DOM** | `^19.3.0` | MIT | Web DOM rendering |
| **Tailwind CSS** | `^4.0.0` | MIT | High-contrast monochrome styling and responsive design tokens |
| **TypeScript** | `^5.0.0` | Apache-2.0 | Strict compile-time static type checking |
| **@google/genai** | `^2.31.0` | Apache-2.0 | Official Google GenAI SDK for Gemini multimodal vision inference |
| **zod** | `^4.6.7` | MIT | Strict schema validation for API request bodies and structured JSON model outputs |
| **server-only** | `^0.0.1` | MIT | Guarantees server secrets and API keys are never bundled into client code |
| **vitest** | `^5.0.5` | MIT | Fast unit and security test runner (dev-only) |

## 2. Web Standards & Browser APIs Used

- **Web MediaDevices API (`getUserMedia`)**: Requests secure rear camera stream.
- **HTML5 Canvas 2D API**: Performs on-device low-resolution frame luminance diffing and client-side image compression.
- **Web Speech API (`SpeechSynthesis`)**: Speaks concise scene descriptions and urgent hazard warnings.
- **Vibration API (`navigator.vibrate`)**: Delivers directional haptic pulse feedback on supported devices.
- **Screen Wake Lock API (`navigator.wakeLock`)**: Keeps the screen active during hands-free scanning sessions.

## 3. AI Models & Services

- **Google Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`)**: Server-side multimodal vision model used for scene orientation, obstacle recognition, and text transcription. Configured with `ThinkingLevel.MINIMAL` and `MediaResolution.LOW`/`MEDIUM` for sub-3-second real-world latency.

## 4. Statement of Original Work

All application code outside the dependencies listed above was authored originally for Drishti AI:
- **Vision Pipeline & On-Device Analysis:** `hooks/useMotionDetector.ts` (instant grayscale matrix diffing and loom detection) and `hooks/useAutoScan.ts` (hands-free frame scheduling and backoff logic).
- **Speech & Haptic Engine:** `hooks/useSpeech.ts` (browser queue bug mitigations, sanitization, watchdog recovery) and `hooks/useVibration.ts` (directional spatial vibration encoding).
- **Security Hardening:** `lib/security.ts` (binary magic byte verification for JPEG/WebP, salted sliding-window IP rate limiter, strict Origin host matching) and `lib/sanitize.ts` (prompt injection output sanitization).
- **Gemini Server Route:** `app/api/describe/route.ts` and `lib/gemini.ts` (hardened server-only handler, structured schema coercion, safe fallback guarantee).
- **User Interface:** `components/LandingView.tsx`, `components/CameraView.tsx`, `components/CameraTopBar.tsx`, `components/CameraResultCard.tsx` (WCAG AAA compliant 21:1 Apple monochrome dark design).
- **Test Suite:** `tests/schema.test.ts`, `tests/security.test.ts`, `tests/sanitizer.test.ts`, `tests/injection.test.ts` (automated security and injection regression tests).

## 5. Dependency Audit Notes

Running `npm audit` reports a high severity advisory for `braces` within `eslint-config-next` (dev-only linting dependency). This advisory is confined to build/linting time and does not execute or bundle into client or serverless production runtimes.
