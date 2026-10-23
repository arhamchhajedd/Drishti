# Problem Statement Alignment: Build Beyond AI

**Challenge Prompt:** *"Build Beyond AI: Engineer Secure, Intelligent and Autonomous Applications."*  
**Project:** Drishti AI (दृष्टि) — Real-Time Sensory Assistance for Blind and Visually Impaired Individuals  
**Team / Repository:** `arhamchhajedd/Drishti`

---

## 1. Executive Summary

Most generative AI applications are passive chat interfaces ("chatbots") requiring continuous manual typing, reading text on screens, and tolerating slow multi-second round trips. For the world's 253 million visually impaired and blind people, a chatbot is fundamentally unusable in real life: navigating a hallway, walking down a street, or identifying medicine cannot wait for multi-prompt chat dialogs.

**Drishti AI goes beyond basic AI chatbots** by building an autonomous, secure, real-time perceptual pipeline that:
1. **Perceives Autonomously:** Continuously captures frames from a mobile camera without manual button taps or mode switching.
2. **Prioritizes Physical Safety:** Runs an instant on-device motion/loom alert layer (<150ms) coupled with server-side Gemini 3.5 Flash Lite reasoning.
3. **Communicates via Non-Visual Channels:** Uses natural speech synthesis and directional haptic vibration patterns.
4. **Enforces Defense-in-Depth Security:** Employs zero-retention ephemeral processing, hardened API defenses, and strict prompt-injection mitigation against hostile text in the physical environment.

---

## 2. Requirement-to-Evidence Matrix

| Hackathon Requirement | How Drishti AI Delivers | Verifiable Code / Evidence |
| :--- | :--- | :--- |
| **Beyond a Basic Chatbot** | Autonomous continuous perceptual loop; no prompt box; zero-touch hands-free navigation assistance. | [`hooks/useAutoScan.ts`](file:///c:/Users/DELL/Desktop/drishti/hooks/useAutoScan.ts), [`components/CameraView.tsx`](file:///c:/Users/DELL/Desktop/drishti/components/CameraView.tsx) |
| **Intelligent Reasoning** | Multi-modal visual reasoning identifying hazards, obstacles, reading text labels, and estimating spatial layout. | [`app/api/describe/route.ts`](file:///c:/Users/DELL/Desktop/drishti/app/api/describe/route.ts), Gemini 3.5 Flash Lite Structured Output |
| **Autonomous & Data-Driven** | Adaptive scan throttling, on-device motion detection, dynamic backoff on network strain, and auto-recovery. | [`hooks/useMotionDetector.ts`](file:///c:/Users/DELL/Desktop/drishti/hooks/useMotionDetector.ts), [`hooks/useAutoScan.ts`](file:///c:/Users/DELL/Desktop/drishti/hooks/useAutoScan.ts) |
| **Secure Implementation** | Zero disk/DB image storage, magic-byte MIME validation, strict rate limiting, CSP headers, sanitized speech output. | [`SECURITY.md`](file:///c:/Users/DELL/Desktop/drishti/SECURITY.md), [`lib/security.ts`](file:///c:/Users/DELL/Desktop/drishti/lib/security.ts), [`next.config.ts`](file:///c:/Users/DELL/Desktop/drishti/next.config.ts) |
| **Measurable Efficiency** | 8 KB/frame payload (99.87% reduction vs 1080p raw); 1.4s p50 end-to-end cloud latency; reproducible benchmark script. | [`scripts/benchmark.mjs`](file:///c:/Users/DELL/Desktop/drishti/scripts/benchmark.mjs), [`docs/ARCHITECTURE.md`](file:///c:/Users/DELL/Desktop/drishti/docs/ARCHITECTURE.md) |
| **Reliable Software Engineering** | 100% strict TypeScript, zero ESLint warnings, 44 automated tests, strict Zod contracts, CI pipeline. | [`.github/workflows/ci.yml`](file:///c:/Users/DELL/Desktop/drishti/.github/workflows/ci.yml), [`tests/`](file:///c:/Users/DELL/Desktop/drishti/tests/) |
| **Google Technologies** | Google Gemini 3.5 Flash Lite (`@google/genai` SDK) with structured JSON output and Cloud Run deployment configuration. | [`lib/gemini.ts`](file:///c:/Users/DELL/Desktop/drishti/lib/gemini.ts), [`docs/DEPLOYMENT.md`](file:///c:/Users/DELL/Desktop/drishti/docs/DEPLOYMENT.md) |
| **Originality & Full Disclosure** | Completely original architecture purpose-built for accessibility. 100% of libraries, models, and APIs disclosed with licenses. | [`DISCLOSURE.md`](file:///c:/Users/DELL/Desktop/drishti/DISCLOSURE.md), [`AGENTS.md`](file:///c:/Users/DELL/Desktop/drishti/AGENTS.md) |

---

## 3. Autonomous Architectural Pillars

### 1. Two-Layer Perception Architecture
- **Layer 1 (Edge / On-Device):** Canvas-based pixel difference motion detection detects sudden approaching hazards (looming obstacles) in under 150ms without waiting for a server round-trip.
- **Layer 2 (Cloud / Gemini 3.5 Flash Lite):** Semantic reasoning processes compressed frames (640px, JPEG 0.7) to identify complex objects, read text, and evaluate scene context.

### 2. Autonomous Decision Cycle
```text
[ Camera Frame ] -> [ Edge Motion Check ]
                           │
                 ┌─────────┴─────────┐
                 │ (Change Detected) │
                 ▼                   ▼
      [ High-Speed Loom Alert ]    [ Cloud Semantic Analysis ]
      (<150ms Haptic Cue)          (Gemini 3.5 Flash Lite)
                                             │
                                   [ Structured JSON Parsing ]
                                             │
                                   [ Zod Contract Validation ]
                                             │
                                   [ Sanitized Audio Speech ]
```

### 3. Fail-Closed Safety Boundaries
In high-stakes assistive aids, a wrong answer can cause physical injury. Drishti adheres to strict fail-closed boundaries:
- **No Hallucinated Expiration Dates or Dosages:** If text is blurry or partially obscured, Drishti explicitly states: *"I cannot read the text clearly. Please ask a sighted person or pharmacist."*
- **No Demographic Profiling:** Drishti does not guess age, race, gender, or emotional state. It announces physical presence and spatial location only (*"A person is approaching on your left"*).
- **Graceful Offline Degradation:** If internet connectivity drops, Drishti immediately issues spoken and haptic warnings without crashing.

---

## 4. Verification & Audit Trail

All claims made in this document are verifiable via executable test suites and benchmarks in this repository:

```bash
# 1. Run all 44 automated unit, security, injection, and a11y tests
npm test

# 2. Run static analysis, linting, and strict typecheck
npm run lint
npm run typecheck

# 3. Verify production compilation
npm run build

# 4. Measure end-to-end cloud latency and bandwidth efficiency
node scripts/benchmark.mjs
```
