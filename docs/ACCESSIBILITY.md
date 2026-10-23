# Accessibility Conformance & Design Report: Drishti AI

---

## 1. Core Philosophy & Problem Definition
Drishti AI is built around a single foundational premise: **an accessibility application for blind individuals must be 100% usable without looking at the screen.** Visual aesthetics in Drishti are engineered to support low-vision users and caregivers, while the primary interaction paradigm relies on synthetic speech, haptic vibration, and large, tactile hit targets.

---

## 2. Key Accessibility Design Decisions

### 2.1 Dominant Touch Targets & Viewport Toggles
- **Full Viewport Hit Target:** During active vision sessions, the entire viewport functions as a giant touch target (>64px minimum, covering 100dvh). Tapping anywhere instantly toggles scanning between active and paused states.
- **Strict 48px+ Hit Targets:** All secondary interactive pills (Back, Light, Repeat) have minimum dimensions of 48px × 48px with high-contrast outlines and visible active rings (`focus:ring-2 focus:ring-white`).

### 2.2 21:1 Contrast Ratio (WCAG AAA)
- UI palette uses pure OLED black (`#000000`) for backgrounds and pure white (`#FFFFFF`) for text and primary controls, delivering the maximum theoretical contrast ratio of 21:1 (far exceeding the WCAG AAA 7:1 standard).
- Secondary information utilizes zinc-300 (`#D4D4D8`) and zinc-400 (`#A1A1AA`), maintaining at least 7.5:1 contrast against pure black.

### 2.3 Screen Reader Architecture & Semantics
- **ARIA Live Regions:**
  - Status updates and descriptions use `aria-live="polite"` and `aria-atomic="true"` to prevent interrupting critical screen reader announcements.
  - Urgent safety hazards trigger assertive alerts.
- **Natural Focus Tree:** Standard semantic elements (`<header>`, `<main>`, `<section>`, `<footer>`, `<button>`) with clear `aria-label` tags describing function rather than appearance (e.g., `aria-label="Return to home screen"`).

### 2.4 Multimodal Audio & Haptic Synchronization
- Audio is the primary information channel.
- Haptics enhance spatial comprehension via distinctive vibration patterns:
  - Success/Confirmation: Single crisp tick (`30ms`).
  - Warning/Hazard: Triple rapid pulse (`120ms` pulse, `60ms` gap).
  - Approach/Loom: High-urgency haptic burst.
- **iOS Safari Graceful Degradation:** Because Apple iOS Safari does not implement the Web Vibration API (`navigator.vibrate`), Drishti feature-detects vibration support and ensures all state changes remain fully audible through speech.

### 2.5 Motion Sensitivity & Cognitive Load
- Respects `@media (prefers-reduced-motion: reduce)` by disabling all animations, pulse effects, and transitions.
- Concise descriptions: Output is capped at under 25 words with hazards prioritized first, minimizing cognitive fatigue.

---

## 3. Real Testing Performed

### 3.1 Assistive Tech Validations (Conducted in Repo)
- **TalkBack (Android 14 / Chrome):** Tested landing screen discovery, one-tap shutter activation, live region announcements, and full-screen tap-to-pause with closed eyes.
- **VoiceOver (iOS 18 / Safari):** Tested element swipe order, double-tap activation, and silent fallback when `navigator.vibrate` is absent.
- **Keyboard Navigation:** Verified full tab navigation order and prominent visible focus indicators on all interactive pills.

### 3.2 Automated Conformance
- WCAG 2.2 Level AA / AAA color contrast mathematically verified across all text elements.
- Semantic HTML validation verified with zero `<div>`-only clickable elements.

---

## 4. Known Limitations & Edge Cases

1. **iOS Background Audio:** Safari restricts background Web Speech synthesis if the tab is backgrounded. Drishti intentionally halts camera tracks and releases the wake lock upon backgrounding to respect user privacy and battery.
2. **Browser Gesture Lock:** Web Speech synthesis requires an initial user interaction. Drishti routes the first speech call through the "Open Camera" shutter tap to unlock speech capability cleanly.
3. **Ambient Noise Environments:** In extremely loud traffic or subway environments, phone speakers may be difficult to hear. External Bluetooth headphones or bone-conduction headsets are recommended.

---

## 5. Ongoing User Testing Plan
Our testing roadmap includes structured testing sessions with visually impaired participants:
1. **Mobility Obstacle Course:** Indoor navigation through hallways with controlled obstacles (boxes, chairs, wet floor cones).
2. **Reading Accuracy Trial:** Package and medicine bottle reading to verify prompt safety boundaries under diverse lighting conditions.
3. **Feedback Protocol:** Recording user reaction time to looming warnings vs. white cane contact distance.
