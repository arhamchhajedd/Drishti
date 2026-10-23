import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET, PUT, DELETE } from "@/app/api/describe/route";
import { NextRequest } from "next/server";

// Valid base64 JPEG header
const VALID_JPEG_B64 =
  "data:image/jpeg;base64," +
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]).toString("base64");

describe("API Route Integration: /api/describe", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 405 Method Not Allowed for GET, PUT, and DELETE", async () => {
    const getRes = await GET();
    expect(getRes.status).toBe(405);

    const putRes = await PUT();
    expect(putRes.status).toBe(405);

    const deleteRes = await DELETE();
    expect(deleteRes.status).toBe(405);
  });

  it("returns 403 when Origin header does not match Host", async () => {
    const req = new NextRequest("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "host": "localhost:3000",
        "origin": "https://malicious-site.example.com",
      },
      body: JSON.stringify({ image: VALID_JPEG_B64 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("request_forbidden");
  });

  it("returns 415 Unsupported Media Type for non-JSON content-type", async () => {
    const req = new NextRequest("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "host": "localhost:3000",
        "origin": "http://localhost:3000",
      },
      body: "plain text body",
    });

    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("returns 413 Payload Too Large when Content-Length exceeds 1.5MB", async () => {
    const req = new NextRequest("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "host": "localhost:3000",
        "origin": "http://localhost:3000",
        "content-length": "2000000",
      },
      body: JSON.stringify({ image: VALID_JPEG_B64 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toBe("payload_too_large");
  });

  it("returns 400 Bad Request on invalid JSON payload structure", async () => {
    const req = new NextRequest("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "host": "localhost:3000",
        "origin": "http://localhost:3000",
      },
      body: JSON.stringify({ unknownField: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_payload");
  });

  it("returns 422 Unprocessable Entity for invalid or spoofed image bytes", async () => {
    const req = new NextRequest("http://localhost:3000/api/describe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "host": "localhost:3000",
        "origin": "http://localhost:3000",
      },
      body: JSON.stringify({ image: "data:image/jpeg;base64,bm90IGFuIGltYWdlIGF0IGFsbCE=" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("unsupported_image_format");
  });
});
