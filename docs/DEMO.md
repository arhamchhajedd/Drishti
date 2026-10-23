# Drishti AI: 3-Minute Demo Script & Pitch Summary

---

## Part 1: One-Page Pitch Summary

### The Problem

Blind and visually impaired individuals navigate a world designed almost entirely for visual cues. While traditional mobility aids like white canes detect ground-level physical obstacles, they cannot read signs, identify approaching objects from a distance, or describe room layouts. Existing AI tools often require complex multi-tap menus, capture single still photos manually, or send continuous uncompressed video streams that quickly drain mobile batteries and create unacceptable latency.

### The Solution: Drishti AI

Drishti ( दृष्टि, meaning _Vision_ ) is a mobile-first accessibility Progressive Web Application (PWA). It transforms any smartphone into a hands-free, autonomous assistive vision companion:

1. **Immediate Autonomy:** Exactly one tap on "Open Camera" begins hands-free, continuous operation. No further touch or command is needed. A tap anywhere on the screen pauses or resumes.
2. **Two-Layer Perception:** A sub-second (<150ms) on-device canvas diffing layer warns of sudden looming hazards via directional vibration, while Google Gemini 3.5 Flash Lite provides rich, contextual scene description and natural text reading.
3. **Hardened Security & Zero Data Retention:** No images are ever saved to disk, databases, or logs. All input is validated with strict schemas and magic byte checks, and prompt-injection attacks hidden within real-world imagery are systematically neutralized.

---

## Part 2: 3-Minute Live Demo Script

| Timestamp       | Screen / Action                               | Spoken Script & Presenter Action                                                                                                                                                                                                                                                                             | Expected Drishti Response                                                                                                                                        |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0:00 - 0:30** | **Landing Page**<br>`http://localhost:3000`   | _"Judges, this is Drishti AI. It is built to be used with eyes completely closed. Notice the 21:1 pure black Apple monochrome aesthetic, fully accessible touch targets, and clear screen reader announcements."_<br>Presenter closes eyes or looks away from screen. Double-taps the center shutter button. | Button pulses. Phone haptics fire with success confirmation. Screen switches seamlessly to Camera View.                                                          |
| **0:30 - 1:15** | **Hands-Free Scanning & Speech**              | Presenter lifts phone and points it forward towards a chair, laptop, or hallway.<br>_"Without touching the screen again, Drishti has acquired vision. Notice how it speaks immediately—hazards first, then objects, with zero annoying filler words."_                                                       | Drishti immediately announces: _"Camera ready."_<br>Within ~2s, speaks: _"Chair ahead on your left. Laptop on the desk."_ Card displays text with 21:1 contrast. |
| **1:15 - 1:45** | **On-Device Loom Alert**                      | Presenter rapidly moves an obstacle (or hand) directly toward the camera lens.<br>_"Watch what happens if an obstacle approaches rapidly. The on-device layer detects the loom in under 150 milliseconds without waiting for cloud round-trips."_                                                            | Phone vibrates with 3 rapid hazard pulses (`[120, 60, 120, 60, 120]`) and announces: _"Caution. Approaching obstacle ahead."_                                    |
| **1:45 - 2:20** | **Demonstrating Graceful Failure & Recovery** | Presenter covers the camera lens completely with their palm (simulating total darkness or heavy blur).<br>_"Assistive AI must admit uncertainty rather than hallucinate navigation. Here is our low-confidence failure test."_<br>Presenter removes hand.                                                    | Drishti admits: _"I'm not sure. Please slowly re-aim the camera."_<br>As soon as light returns, Drishti instantly recovers and resumes accurate descriptions.    |
| **2:20 - 2:45** | **Offline Interruption Test**                 | Presenter toggles Airplane mode or disconnects network briefly.<br>_"What happens if network is lost mid-walk?"_                                                                                                                                                                                             | Drishti announces: _"You are offline."_ No app crash, no frozen UI. Exponential backoff engages until network reconnects.                                        |
| **2:45 - 3:00** | **Full-Screen Tap-to-Pause**                  | Presenter taps anywhere on the screen with their thumb.<br>_"To pause, the user doesn't need to hunt for a tiny button. A tap anywhere freezes the camera and releases the wake lock."_                                                                                                                      | Haptic tick. Footer displays _"Paused · Tap to Resume"_. Voice confirms: _"Scanning paused."_                                                                    |

---

## Part 3: Setup Instructions for Demo Presenters

1. **Hardware:** Any modern Android or iOS phone with Chrome or Safari.
2. **Audio:** Set media volume to 80%+.
3. **Network:** Ensure Wi-Fi or cellular connectivity with valid `GEMINI_API_KEY` configured in `.env.local`.
4. **Dev Server:**
   ```bash
   npm run dev
   ```
   Open on phone via HTTPS tunnel (e.g. `ngrok http 3000` or Cloud Run deployment).
