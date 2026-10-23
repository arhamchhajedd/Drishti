# Drishti AI: Manual Phone Testing Checklist

This checklist is designed for end-to-end verification of Drishti on real mobile devices (iOS Safari and Android Chrome) with screen readers enabled (TalkBack / VoiceOver) and eyes closed.

---

## Pre-Requisites

1. **HTTPS Connection:** The camera and vibration APIs require a secure context (`https://` or `localhost`).
2. **Screen Reader:**
   - **Android:** Settings -> Accessibility -> TalkBack (Turn ON).
   - **iOS:** Settings -> Accessibility -> VoiceOver (Turn ON).
3. **Volume:** Turn media and accessibility speech volumes to 80%+.

---

## 1. Eyes-Closed First Launch & Permissions

- [ ] **Step 1.1:** Navigate to the Drishti URL.
- [ ] **Step 1.2:** Verify that TalkBack/VoiceOver immediately announces the heading: *"Drishti AI. Assistive vision. Not a replacement for a cane or guide dog."*
- [ ] **Step 1.3:** Swipe or double-tap to hear the spoken disclaimer on the landing screen (privacy assurance that no images are stored).
- [ ] **Step 1.4:** Double-tap the giant **"START VISION"** button (at least 64px, dominant touch target).
- [ ] **Test Case - Permission Denied:**
  - Deny the camera permission prompt.
  - **Expected:** Spoken audio announcement: *"Camera permission denied. Please allow camera access in browser settings to use Drishti."* and an `aria-live="polite"` error card with retry button.
- [ ] **Test Case - Permission Granted:**
  - Grant camera access.
  - **Expected:** Video stream starts immediately. Speech announces: *"Vision active. Tap anywhere to pause."*

---

## 2. Hands-Free Scanning & Speech Experience

- [ ] **Step 2.1 - Immediate Scanning:**
  - Without any further touch or interaction, the phone must begin scanning within 1 second.
  - **Expected:** NO annoying filler phrases like *"Analyzing image..."* or *"Scanning..."*.
  - When a scene is identified, speech announces hazards first (e.g., *"Step down ahead on your left"*), then key objects.
- [ ] **Step 2.2 - Scene-Change Gating:**
  - Hold the phone steady pointing at a stationary wall or table.
  - **Expected:** Gemini API is not spammed. Drishti re-scans only when motion/scene changes or after 5 seconds of safety keep-alive.
- [ ] **Step 2.3 - Hazard Priority Interrupt:**
  - While the assistant is speaking a longer sentence, quickly bring an obstacle close or point toward stairs.
  - **Expected:** The hazard warning immediately interrupts and cuts off the ongoing speech.

---

## 3. On-Device Motion & Directional Vibration

- [ ] **Step 3.1 - Left Obstacle Approach:**
  - Move an obstacle rapidly into the left field of view.
  - **Expected:** Quick double-pulse vibration on supported Android devices (pattern `[60, 40, 60]`).
- [ ] **Step 3.2 - Approaching Obstacle Ahead (Looming):**
  - Walk toward an obstacle rapidly.
  - **Expected:** 3 urgent haptic pulses (`[120, 60, 120, 60, 120]`).
- [ ] **Step 3.3 - iOS Fallback:**
  - On iOS Safari (where `navigator.vibrate` is unsupported), verify audio feedback continues smoothly without uncaught JavaScript exceptions.

---

## 4. Full-Screen Tap-to-Pause / Resume

- [ ] **Step 4.1 - Tap Anywhere to Pause:**
  - Tap anywhere on the screen (the entire viewport acts as the primary toggle).
  - **Expected:** Single haptic tick, video freezes/dimmed with pause overlay, speech announces: *"Vision paused. Tap to resume."*
- [ ] **Step 4.2 - Tap Anywhere to Resume:**
  - Tap anywhere again.
  - **Expected:** Scanning resumes instantly, speech announces: *"Vision resumed."*

---

## 5. Network & Environmental Edge Cases

- [ ] **Step 5.1 - Offline / Airplane Mode:**
  - Switch phone to Airplane mode while scanning.
  - **Expected:** App does not crash. Speech announces: *"Network offline. Retrying..."*
  - Re-enable Wi-Fi/cellular. Scanning recovers automatically.
- [ ] **Step 5.2 - Low Light / Blurry Scene:**
  - Cover the camera lens with a finger or enter pitch darkness.
  - **Expected:** Low confidence handled gracefully: *"I'm not sure. Please slowly re-aim the camera."* Never hallucinates non-existent objects.
- [ ] **Step 5.3 - Background & Return:**
  - Switch to another app or press the phone's lock/power button.
  - **Expected:** Rear camera hardware indicator turns off (camera stream tracks stopped). Wake lock releases.
  - Reopen browser: camera restarts cleanly.

---

## 6. Voice & Repeat Controls

- [ ] **Step 6.1 - Unified Text & Scene Orientation:**
  - Point phone at packaging, signs, or text in the room.
  - **Expected:** Without needing to toggle any mode buttons, Drishti naturally incorporates readable text and hazard orientation in speech.
- [ ] **Step 6.2 - Repeat Last:**
  - Tap the "Repeat" button.
  - **Expected:** Repeats the last spoken description verbatim.
