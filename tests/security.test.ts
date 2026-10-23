import { describe, it, expect } from "vitest";
import { validateImageBytes, checkRateLimit, verifyOrigin } from "@/lib/security";

describe("validateImageBytes", () => {
  it("accepts a valid JPEG image with correct magic bytes (FF D8 FF)", () => {
    // 0xFF, 0xD8, 0xFF followed by dummy JPEG bytes to exceed 12 bytes
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
    const base64 = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
    const result = validateImageBytes(base64);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("image/jpeg");
    expect(result?.buffer.length).toBe(13);
  });

  it("accepts a valid WebP image with RIFF and WEBP magic bytes", () => {
    // RIFF (4 bytes) + 4 size bytes + WEBP (4 bytes) + extra data
    const webpBuffer = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x20, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
      Buffer.from("VP8 000000"),
    ]);
    const base64 = webpBuffer.toString("base64");
    const result = validateImageBytes(base64);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("image/webp");
  });

  it("rejects image with spoofed/invalid magic bytes (e.g. plain text or PNG disguised as JPEG)", () => {
    const fakeBuffer = Buffer.from("data:image/jpeg;base64,VGhpcyBpcyBub3QgYSBqcGVnIGltYWdlIQ==");
    const result = validateImageBytes(fakeBuffer.toString("base64"));
    expect(result).toBeNull();
  });

  it("rejects truncated buffer under 12 bytes", () => {
    const tinyBuffer = Buffer.from([0xff, 0xd8, 0xff]);
    const result = validateImageBytes(tinyBuffer.toString("base64"));
    expect(result).toBeNull();
  });

  it("rejects oversized base64 payload (> 1.4 MB)", () => {
    // 1.5MB base64 string
    const largeBase64 = "A".repeat(1.5 * 1024 * 1024);
    const result = validateImageBytes(largeBase64);
    expect(result).toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("allows initial requests and tracks remaining capacity", () => {
    const ip = "192.168.1.100";
    const firstCheck = checkRateLimit(ip);
    expect(firstCheck.allowed).toBe(true);
    expect(firstCheck.remaining).toBeLessThan(30);
  });

  it("blocks requests once limit of 30 requests per minute is exceeded", () => {
    const testIp = "10.0.0.99";
    for (let i = 0; i < 30; i++) {
      checkRateLimit(testIp);
    }
    const blockedCheck = checkRateLimit(testIp);
    expect(blockedCheck.allowed).toBe(false);
    expect(blockedCheck.remaining).toBe(0);
  });

  it("isolates rate limits between distinct IP addresses", () => {
    const ipA = "172.16.0.1";
    const ipB = "172.16.0.2";

    for (let i = 0; i < 30; i++) {
      checkRateLimit(ipA);
    }

    expect(checkRateLimit(ipA).allowed).toBe(false);
    expect(checkRateLimit(ipB).allowed).toBe(true);
  });
});

describe("verifyOrigin", () => {
  it("accepts request where Origin host matches Host header", () => {
    const req = new Request("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    expect(verifyOrigin(req)).toBe(true);
  });

  it("rejects cross-site request where Origin does not match Host", () => {
    const req = new Request("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://malicious-attacker.com",
      },
    });
    expect(verifyOrigin(req)).toBe(false);
  });

  it("accepts matching referer when origin header is omitted", () => {
    const req = new Request("http://drishti.example.com/api/describe", {
      method: "POST",
      headers: {
        host: "drishti.example.com",
        referer: "http://drishti.example.com/app",
      },
    });
    expect(verifyOrigin(req)).toBe(true);
  });
});
