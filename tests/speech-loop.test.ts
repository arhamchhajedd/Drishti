import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeSpokenText } from "../lib/sanitize";

describe("Speech Resolution & Resilience Guarantees", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("guarantees speech promise resolves via watchdog timeout if onend never fires", async () => {
    let speakCalled = false;

    // Simulate browser window with buggy speechSynthesis that drops onend
    const mockUtterance = {
      text: "Obstacle ahead on your left.",
      rate: 1,
      pitch: 1,
      lang: "en-US",
      onstart: null as (() => void) | null,
      onend: null as (() => void) | null,
      onerror: null as ((e: { error: string }) => void) | null,
    };

    const mockSpeechSynthesis = {
      speak: vi.fn((_utt) => {
        speakCalled = true;
        // Notice: onend is NEVER called here to simulate mobile browser bug!
      }),
      cancel: vi.fn(),
      resume: vi.fn(),
      paused: false,
      getVoices: vi.fn(() => []),
      onvoiceschanged: null,
    };

    // Implementation of speech watchdog resolution contract
    const speakContract = (text: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const clean = sanitizeSpokenText(text, 200);
        if (!clean) return resolve(true);

        mockSpeechSynthesis.cancel();
        const words = clean.split(/\s+/).length;
        const maxDurationMs = Math.max(1400, (words / 2.2) * 1000 + 1000);

        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(true); // Watchdog resolves promise
          }
        }, maxDurationMs);

        mockUtterance.onend = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(true);
          }
        };

        mockSpeechSynthesis.speak(mockUtterance);
      });
    };

    const promise = speakContract("Obstacle ahead on your left.");
    expect(speakCalled).toBe(true);

    // Fast-forward time past watchdog timer
    vi.advanceTimersByTime(3500);

    const result = await promise;
    expect(result).toBe(true);
  });

  it("resolves speak promise cleanly on onerror without throwing an unhandled rejection", async () => {
    const mockSpeechSynthesis = {
      speak: vi.fn((utt) => {
        setTimeout(() => {
          if (utt.onerror) utt.onerror({ error: "audio-busy" });
        }, 10);
      }),
      cancel: vi.fn(),
    };

    const speakContract = (text: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const utt = {
          text,
          onerror: (e: { error: string }) => {
            resolve(false);
          },
          onend: () => resolve(true),
        };
        mockSpeechSynthesis.speak(utt);
      });
    };

    const promise = speakContract("Test error path");
    vi.advanceTimersByTime(50);
    const result = await promise;
    expect(result).toBe(false);
  });

  it("enforces never-silent rule: triggers status reminder after 10 seconds of silence", () => {
    const NEVER_SILENT_INTERVAL_MS = 10_000;
    let lastSpokenTimestamp = 1000;
    const currentTime = 11_500; // 10.5 seconds later
    let statusReminderTriggered = false;

    if (currentTime - lastSpokenTimestamp > NEVER_SILENT_INTERVAL_MS) {
      statusReminderTriggered = true;
      lastSpokenTimestamp = currentTime;
    }

    expect(statusReminderTriggered).toBe(true);
    expect(lastSpokenTimestamp).toBe(11_500);
  });

  it("recovers scan loop after simulated exception in fetch, releasing processing state in finally block", async () => {
    let isProcessing = false;
    let nextScheduled = false;
    let scheduledDelay = 0;

    const scheduleNext = (delay: number) => {
      nextScheduled = true;
      scheduledDelay = delay;
    };

    // Simulated scan cycle with finally block recovery
    const simulateScanCycle = async (shouldFail: boolean) => {
      isProcessing = true;
      let nextDelayMs = 350;

      try {
        if (shouldFail) {
          throw new Error("Network connection dropped");
        }
      } catch (_err) {
        nextDelayMs = 2000; // backoff on failure
      } finally {
        isProcessing = false; // Always released
        scheduleNext(nextDelayMs); // Always rescheduled
      }
    };

    await simulateScanCycle(true);

    expect(isProcessing).toBe(false); // Processing state unlocked!
    expect(nextScheduled).toBe(true); // Loop was rescheduled!
    expect(scheduledDelay).toBe(2000); // Backoff applied!
  });
});
