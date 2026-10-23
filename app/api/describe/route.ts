import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { DescribeRequestSchema } from "@/lib/schema";
import { checkRateLimit, verifyOrigin, validateImageBytes } from "@/lib/security";
import { analyzeImageWithGemini } from "@/lib/gemini";
import { logError } from "@/lib/logger";

// Return 405 for non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  // 1. Origin check to prevent cross-site abuse
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "request_forbidden" }, { status: 403 });
  }

  // 2. IP Rate Limiting
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(rawIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limit_exceeded", message: "Too many requests. Please wait." },
      { status: 429 }
    );
  }

  // 3. Content-Type Check
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415 });
  }

  // 4. Enforce size limit BEFORE full parsing
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 1.5 * 1024 * 1024) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // 5. Validate whole request with Zod (.strict())
  const parseResult = DescribeRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { image: rawBase64, mode } = parseResult.data;

  // 6. Validate magic bytes and binary size
  const validatedImage = validateImageBytes(rawBase64);
  if (!validatedImage) {
    return NextResponse.json({ error: "unsupported_image_format" }, { status: 422 });
  }

  // 7. Call Gemini with timeout and error masking
  try {
    const result = await analyzeImageWithGemini(validatedImage, mode);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : undefined;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    logError("describe.failed", {
      kind: err instanceof Error ? err.name : "unknown",
      upstreamStatus: status,
    });

    if (status === 429) {
      return NextResponse.json({ error: "busy" }, { status: 429 });
    }
    if (isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 });
    }
    // Generic error only; never leak upstream messages or keys to the client
    return NextResponse.json({ error: "request_failed" }, { status: 502 });
  }
}
