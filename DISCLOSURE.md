# DISCLOSURE.md: Drishti AI

Disclosure of all third-party libraries, models, and APIs used in Drishti AI per hackathon requirements.

## Frameworks & Core Libraries
- **Next.js (v16)**: Web framework for App Router, server-side API routes, and React 19 rendering.
- **React (v19)**: Client-side UI rendering and state management.
- **Tailwind CSS (v4)**: Minimalist styling, high-contrast monochrome design tokens.
- **TypeScript (v5)**: Static typing with strict mode and zero `any` tolerance.
- **@google/genai**: Official Google Gen AI SDK for server-side Gemini 2.5 Flash multimodal vision calls.
- **zod**: Type-safe schema validation for API request bodies and Gemini structured JSON outputs.

## APIs & Browser Capabilities
- **Web MediaDevices API (`getUserMedia`)**: Accesses the device's rear environment camera.
- **HTML5 Canvas API**: Compresses and resizes video frames on-device (~640px JPEG 0.7) before transmission.
- **Web Speech API (`SpeechSynthesis`)**: Provides voice feedback and descriptions.
- **Web Audio API (`AudioContext`)**: Generates synthetic tactile earcons and chimes.
- **Vibration API (`navigator.vibrate`)**: Provides haptic confirmation and obstacle alerts.

## AI Models
- **Google Gemini 3.5 Flash Lite**: Server-side vision processing for low-latency scene description and text reading.

## Audit & Security Notes
- `npm audit` reports a high severity advisory for `braces` within `eslint-config-next` (dev-only linting dependency). This does not affect client or production runtime security.
