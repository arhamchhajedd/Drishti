# Drishti AI (दृष्टि)

> **SAFETY DISCLAIMER**: Drishti is an experimental assistive aid for blind and visually impaired individuals. It is **NOT** a replacement for a white cane, guide dog, mobility training, or human assistance. Never rely on Drishti for navigation in hazardous, vehicular, or life-critical environments. Drishti's AI models can make errors, hallucinate, or misjudge distances.

Drishti AI is a mobile-first accessibility Progressive Web Application (PWA). It provides hands-free real-time environmental awareness through live speech synthesis and directional haptic alerts, powered by a two-layer vision architecture.

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
│ • 150ms Loop Interval        │        │ • Scene-change gating        │
│ • Detects: Left / Ahead /    │        │ • Server-side API route      │
│   Right looming obstacles    │        │ • Gemini 3.5 Flash Lite      │
│ • Directional Vibration      │        │ • Strict Zod Schema JSON     │
│ • Zero Network Overhead      │        │ • Priority Spoken Feedback   │
└──────────────────────────────┘        └──────────────────────────────┘
```

1. **Layer 1: On-Device Obstacle & Motion Detection (<150ms)**
   - Computes grayscale luminance differential across a low-resolution 48x36 grid.
   - Identifies sudden looming hazards and directional movement (Left, Center, Right).
   - Triggers directional vibration patterns instantly without network latency.

2. **Layer 2: Cloud Multimodal Analysis (Gemini 3.5 Flash Lite ~2.1s)**
   - Gated by scene-change detection (avoids redundant cloud calls when the camera is stationary).
   - Delivers structured orientation: hazards first (stairs, obstacles, wet floor), key objects, and natural text reading.
   - Text sanitizer cleanses output of URLs, markup, and control codes before speech synthesis.

---

## Threat Model & Security Posture

| Threat | Mitigation | Implementation |
|---|---|---|
| **Prompt Injection via Images** | Text on signs/packaging treated as untrusted data, never instructions. | Strict system prompt instruction + Zod `.strict()` schema enforcement + `SAFE_FALLBACK`. |
| **User Privacy & Data Leakage** | Zero persistence. Images processed strictly in-memory and discarded. | No disk/DB/cache storage. `server-only` secrets boundary. |
| **API Denial-of-Service / Abuse** | Rate limiting per hashed IP + Origin header enforcement. | Sliding window (30 req/min) in `lib/security.ts`. |
| **Payload Spoofing / Malicious Uploads** | Verify true binary magic bytes (`FF D8 FF` JPEG, `RIFF...WEBP`). | Hard 1MB payload ceiling, reject spoofed MIME types. |
| **Cross-Site Scripting (XSS) / Clickjacking** | Strict Content Security Policy + Frame denial. | Nonced script execution, `frame-ancestors 'none'`, `X-Frame-Options: DENY`. |

---

## Real-World Benchmarks

Measured on mobile LTE/5G with `gemini-3.5-flash-lite`:

| Mode | Media Resolution | Thinking Level | Avg Latency | Prompt Tokens | Output Tokens |
|---|---|---|---|---|---|
| **Scene Orientation** | `LOW` | `MINIMAL` | ~2.1 s | ~120 tokens | ~35 tokens |
| **Text Reading (OCR)** | `MEDIUM` | `MINIMAL` | ~2.8 s | ~280 tokens | ~85 tokens |
| **On-Device Loom Alert** | Local 48x36 | None (Local CPU) | **< 150 ms** | 0 | 0 |

---

## Setup & Local Development

### Prerequisites
- Node.js 20+ or 22+
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Installation
```bash
git clone https://github.com/arhamchhajedd/Drishti.git
cd drishti
npm install
```

### 2. Environment Configuration
Create a `.env.local` file (git-ignored):
```env
GEMINI_API_KEY="your-google-ai-studio-api-key"
GEMINI_MODEL="gemini-3.5-flash-lite"
GEMINI_THINKING_LEVEL="MINIMAL"
RATE_LIMIT_SALT="your-random-production-salt"
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` or open over your local network HTTPS tunnel.

### 4. Verification & Testing
```bash
# Run unit tests (Zod schemas, security magic bytes, rate limiter, injection defense)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint

# Create production build
npm run build
```

---

## Accessibility Compliance
- **Contrast Ratio:** 21:1 Apple monochrome dark mode (pure `#000000` background, pure `#FFFFFF` typography).
- **Target Sizes:** Dominant full-screen pause/resume touch area (>64px), minimum 48px on all control pills.
- **Screen Reader Support:** Full TalkBack (Android) and VoiceOver (iOS) hierarchy with live regions (`aria-live="polite"` for scene status, `aria-live="assertive"` for hazards).
- **Reduced Motion:** Fully complies with `@media (prefers-reduced-motion: reduce)`.
- **Manual Testing:** See [docs/TESTING.md](docs/TESTING.md) for full eyes-closed testing script.
