# Drishti AI (दृष्टि)

> **SAFETY DISCLAIMER**: Drishti is an experimental assistive aid for blind and visually impaired individuals. It is **NOT** a replacement for a white cane, guide dog, mobility training, or human assistance. Never rely on Drishti for navigation in hazardous, vehicular, or life-critical environments. Drishti's AI models can make errors, hallucinate, or misjudge distances.

Drishti AI is a mobile-first accessibility Progressive Web Application (PWA). It provides hands-free real-time environmental awareness through live speech synthesis and directional haptic alerts, powered by a two-layer vision architecture.

---

## The Problem & Target User

Blind and visually impaired individuals navigate physical spaces designed almost exclusively for sighted people. While traditional mobility tools like white canes detect immediate ground obstacles, they cannot read signs, identify approaching objects from a distance, or describe room layouts. Drishti provides an autonomous, hands-free auditory and haptic stream that empowers visually impaired users to perceive and orient themselves in real-world environments with confidence.

---

## Problem Statement Alignment

| Problem Statement Phrase | Implementation in Drishti AI | Verifiable Code / Evidence |
|---|---|---|
| **Intelligent Reasoning** | Analyzes multimodal visual scenes to prioritize safety hazards first (stairs, vehicles, obstacles), evaluates confidence, and transcribes visible text. | `lib/gemini.ts` (system prompt with hazard prioritization, strict JSON response schema, confidence estimation). |
| **Autonomy** | Fully hands-free perceive-decide-act loop. Exactly one touch on "Open Camera" begins continuous vision assistance without requiring further taps or prompts. | `components/CameraView.tsx`, `hooks/useAutoScan.ts` (continuous background frame acquisition and speech queue). |
| **Data-Driven Decisions** | Real-time pixel luminance matrix analysis (48x36 grid) calculates motion vectors, approaching loom ratios, and triggers directional haptic feedback. | `hooks/useMotionDetector.ts`, `hooks/useVibration.ts` (instant sub-150ms local warning layer). |
| **Secure Implementation** | Binary magic bytes verification (`FF D8 FF`, `RIFF...WEBP`), strict Zod schemas rejecting unknown fields, origin verification, and prompt-injection defense. | `lib/security.ts`, `lib/sanitize.ts`, `tests/security.test.ts`, `tests/injection.test.ts`, `SECURITY.md`. |
| **Measurable Efficiency** | Client-side 640px JPEG compression reduces bandwidth by 99.8% vs raw frames. Low output token usage keeps cost to ~$0.028/hour. | `scripts/benchmark.mjs`, real benchmark output table below. |
| **Reliable End-to-End Performance** | Fail-closed error handling: graceful low-light admission, network offline alerts, watchdog timers for mobile browser speech bugs, and screen wake lock. | `hooks/useSpeech.ts`, `hooks/useWakeLock.ts`, `docs/TESTING.md`. |

---

## Beyond a Basic Chatbot: What Makes Drishti Original

Traditional AI chatbots require users to type or record audio, send a single prompt, and wait for a conversational text response. Drishti is an **autonomous sensory vision agent**:
1. **Continuous Hands-Free Feedback Loop:** Once opened, Drishti continuously samples frames, detects movement, and speaks environmental changes without asking the user for commands.
2. **Two-Layer Perception Architecture:** Urgent physical safety warnings (looming obstacles) are processed on-device in under 150ms with zero network dependency, while cloud multimodal vision handles high-level spatial understanding.
3. **No Image Storage or Chat History:** Unlike conversational chatbots that save message histories, Drishti treats images as strictly ephemeral data—processed in memory and discarded immediately to preserve total user privacy.

---

## Google Technologies Used

- **Google Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`)**: Server-side multimodal vision model used for scene orientation, obstacle recognition, and text transcription. Configured with `ThinkingLevel.MINIMAL` and `MediaResolution.LOW`/`MEDIUM` for low-latency live assistance.
- **Official `@google/genai` SDK**: Used exclusively server-side (`import "server-only";`) for robust API calls, structured JSON coercion, and strict token budgets.

---

## Architecture: Two-Layer Vision System

```
                         [ Device Camera ]
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Layer 1: On-Device Motion   │        │  Layer 2: Gemini Multimodal  │
│  (Sub-second Instant Alert)  │        │  (Deep Scene Description)    │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • 48x36 Canvas Pixel-Diffing │        │ • Client-side 640px JPEG 0.7 │
│ • 150ms Loop Interval        │        │ • Server-side API route      │
│ • Detects: Approaching loom  │        │ • Gemini 3.5 Flash Lite      │
│ • Directional Vibration      │        │ • Strict Zod Schema JSON     │
│ • Zero Network Overhead      │        │ • Live Spoken Feedback       │
└──────────────────────────────┘        └──────────────────────────────┘
```

---

## Empirical Benchmark Results

Measured on October 23, 2026 using `node scripts/benchmark.mjs` against live `gemini-3.5-flash-lite`:

| Metric | Real Measured Value | Evaluation & Source |
|---|---|---|
| **Average Latency** | **1,997 ms** (~2.0 s) | `scripts/benchmark.mjs` (3-run live API test) |
| **p50 Latency** | **1,436 ms** (~1.4 s) | `scripts/benchmark.mjs` |
| **p95 Latency** | **3,128 ms** (~3.1 s) | `scripts/benchmark.mjs` |
| **Local Loom Alert** | **< 150 ms** | Local CPU canvas luminance loop (`useMotionDetector.ts`) |
| **Client Frame Size** | **8 KB** | Compressed 640px JPEG |
| **Bandwidth Reduction**| **99.87%** | Compared against raw uncompressed 1080p frame (~6,075 KB) |
| **Estimated Tokens** | **135 Prompt / 30 Output** | Minimal thinking budget enabled |
| **Cost per 1,000 Scans**| **$0.0191 USD** (~2 cents) | Based on official Gemini 3.5 Flash Lite pricing |
| **Cost per Active Hour**| **$0.0287 USD** (~3 cents) | Continuous hands-free active scanning (25 req/min) |

---

## Verification & Unified Check Command

Run the complete validation suite (lint, typecheck, tests, and build) in a single command:
```bash
npm run check
```

Individual checks:
```bash
# Run 44 automated Vitest tests (security, schemas, route, sanitizer, injection, a11y)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint validation (0 warnings required)
npm run lint

# Run Next.js production build
npm run build

# Run automated efficiency & latency benchmarks
node scripts/benchmark.mjs
```

---

## Accessibility Compliance

- **Contrast Ratio:** 21:1 Apple monochrome dark mode (pure `#000000` background, pure `#FFFFFF` typography).
- **Target Sizes:** Dominant full-screen pause/resume touch area (>64px, covering 100dvh), minimum 48px on all control pills.
- **Screen Reader Support:** Full TalkBack (Android) and VoiceOver (iOS) hierarchy with live regions (`aria-live="polite"` for scene status, `aria-live="assertive"` for hazards).
- **Reduced Motion:** Fully complies with `@media (prefers-reduced-motion: reduce)`.
- **Documentation Index:**
  - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Two-layer system architecture, data flow diagrams, and latency budgets.
  - [docs/PROBLEM_STATEMENT.md](docs/PROBLEM_STATEMENT.md): Hackathon challenge alignment and requirement-to-evidence matrix.
  - [docs/API.md](docs/API.md): Hardened `/api/describe` specification, Zod schemas, and rate limiting.
  - [docs/ETHICS_AND_SAFETY.md](docs/ETHICS_AND_SAFETY.md): Responsible AI principles, fail-closed boundaries, and non-profiling rules.
  - [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md): WCAG 2.2 AAA conformance breakdown and assistive tech testing.
  - [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Google Cloud Run containerization and Vercel production deployment guide.
  - [docs/TESTING.md](docs/TESTING.md): Eyes-closed manual phone test checklist and device matrix.
  - [docs/DEMO.md](docs/DEMO.md): 3-minute judging demo script and pitch flow.
  - [SECURITY.md](SECURITY.md): Threat model, attack tree, and zero-retention privacy policy.
  - [DISCLOSURE.md](DISCLOSURE.md): Third-party dependency licenses and original work statement.
  - [CONTRIBUTING.md](CONTRIBUTING.md): Engineering quality standards, code review checklist, and conventional commits.
