import "server-only";
import { createHash } from "crypto";

// In-memory sliding window rate limiter
// NOTE: Single-instance memory only. In multi-instance production, use Upstash Redis or Cloud Armor.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const requestRecords = new Map<string, number[]>();
const IP_SALT = process.env.RATE_LIMIT_SALT || "drishti-secure-salt-2026";

export function checkRateLimit(rawIp: string): { allowed: boolean; remaining: number } {
  const hashedIp = createHash("sha256").update(`${rawIp}:${IP_SALT}`).digest("hex");
  const now = Date.now();
  const timestamps = requestRecords.get(hashedIp) || [];

  // Filter out timestamps outside current window
  const activeTimestamps = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  activeTimestamps.push(now);
  requestRecords.set(hashedIp, activeTimestamps);

  // Evict stale records periodically
  if (requestRecords.size > 2000) {
    for (const [key, times] of requestRecords.entries()) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        requestRecords.delete(key);
      }
    }
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - activeTimestamps.length };
}

// Origin Verification to prevent cross-site abuse
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!host) return false;

  const source = origin || request.headers.get("referer");
  if (!source) {
    // In production, browser fetch(POST) always includes Origin or Referer
    return process.env.NODE_ENV !== "production";
  }

  try {
    const sourceHost = new URL(source).host;
    if (sourceHost === host) return true;
    // Allow matching hostname even if internal port was stripped by reverse proxy
    return sourceHost.split(":")[0] === host.split(":")[0];
  } catch {
    return false;
  }
}

export interface ValidatedImage {
  mimeType: "image/jpeg" | "image/webp";
  buffer: Buffer;
}

// Verify magic bytes: JPEG (FF D8 FF) and WEBP (RIFF....WEBP)
export function validateImageBytes(base64Payload: string): ValidatedImage | null {
  const rawBase64 = base64Payload.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

  // Body size enforcement: Reject images larger than 1MB
  if (rawBase64.length > 1.4 * 1024 * 1024) {
    return null;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    return null;
  }

  if (buffer.length < 12 || buffer.length > 1024 * 1024) {
    return null; // Enforce hard 1MB limit on decoded binary
  }

  // Check JPEG magic bytes: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", buffer };
  }

  // Check WebP magic bytes: 'RIFF' at 0..3 and 'WEBP' at 8..11
  const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
  const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
  if (isRiff && isWebp) {
    return { mimeType: "image/webp", buffer };
  }

  return null;
}
