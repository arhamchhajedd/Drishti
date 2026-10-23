# API Reference: Drishti Vision Service

---

## Overview

The Drishti Vision Service provides a hardened, server-side multimodal perception endpoint at `/api/describe`. It accepts client-compressed camera frames, verifies their binary authenticity, evaluates them through Google Gemini 3.5 Flash Lite with structured JSON schemas, and returns safety-prioritized scene and text orientation data.

---

## Endpoint: `POST /api/describe`

### 1. HTTP Headers

| Header | Requirement | Description |
|---|---|---|
| `Content-Type` | **Required** | Must be `application/json` (requests without this return `415`). |
| `Content-Length` | **Enforced** | Must be $\le 1.5\text{ MB}$ (requests exceeding this return `413`). |
| `Origin` / `Referer` | **Required** | Must match the `Host` header to block cross-site abuse (`403` if mismatched). |

---

## 2. Request Body Schema

The request payload is validated against a strict Zod schema. Extra fields are rejected to prevent payload injection attacks.

```typescript
{
  "image": string,           // Required. Base64 data URI of a valid JPEG or WebP image (min 10 chars, max 1.4 MB base64).
  "mode": "scene" | "text",  // Optional. Defaults to "scene".
  "lang": "en" | "hi" | "mr" // Optional. Defaults to "en". Supported: English, Hindi, Marathi.
}
```

### Example Request
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
  "mode": "scene",
  "lang": "en"
}
```

---

## 3. Response Schema

Responses adhere strictly to the following JSON structure:

```typescript
{
  "hazards": string[],                           // List of immediate physical hazards (stairs, obstacles, vehicles, wet floors). Max 10 items.
  "objects": string[],                           // List of key orientation objects in view. Max 20 items.
  "text": string | null,                         // Transcribed legible text from signs, labels, or documents (null if none). Max 2000 chars.
  "confidence": "high" | "medium" | "low",       // Model confidence score. Low confidence triggers safe admission of uncertainty.
  "spoken_summary": string                       // Concise, natural spoken sentence (max 25 words, no URLs, no markdown) read aloud immediately.
}
```

### Example Response (Success: 200 OK)
```json
{
  "hazards": ["Low-hanging tree branch on your right"],
  "objects": ["Concrete walkway", "Bench ahead"],
  "text": "PARK ENTRANCE",
  "confidence": "high",
  "spoken_summary": "Low-hanging tree branch on your right. Concrete walkway ahead."
}
```

---

## 4. HTTP Status Codes & Error Contracts

Errors return generic, safe codes to clients to prevent leaking server details, keys, or internal stack traces.

| Status Code | Error Code | Description | Client Action |
|---|---|---|---|
| **`200 OK`** | *(None)* | Vision analysis succeeded. | Spoken summary read aloud; UI updated. |
| **`400 Bad Request`** | `invalid_payload` / `invalid_json` | Request failed Zod schema or malformed JSON. | Verify JSON payload formatting. |
| **`403 Forbidden`** | `request_forbidden` | Origin/Host header mismatch. | Disallowed cross-site request. |
| **`405 Method Not Allowed`** | *(Generic)* | Method was GET, PUT, DELETE, etc. | Use POST only. |
| **`413 Payload Too Large`** | `payload_too_large` | Body size exceeded 1.5 MB. | Compress frame on client (~640px JPEG). |
| **`415 Unsupported Media Type`** | `invalid_content_type` | Content-Type header missing `application/json`. | Set header to `application/json`. |
| **`422 Unprocessable Entity`** | `unsupported_image_format` | Binary magic bytes check failed (not JPEG or WebP). | Ensure frame contains valid `FF D8 FF` or `RIFF...WEBP`. |
| **`429 Too Many Requests`** | `rate_limit_exceeded` / `busy` | Exceeded 30 requests per minute per IP. | Back off exponentially (3–6 seconds). |
| **`502 Bad Gateway`** | `request_failed` | Upstream Gemini inference failure. | Retry with backoff. |
| **`504 Gateway Timeout`** | `timeout` | Upstream request exceeded 10-second timeout. | Retry with next frame. |

---

## 5. Rate Limiting Mechanics

- **Algorithm:** In-memory sliding window rate limiter.
- **Window:** 60,000 ms (1 minute).
- **Limit:** 30 requests per window per hashed IP.
- **IP Protection:** Client IP is salted with `RATE_LIMIT_SALT` and hashed using SHA-256 in memory. No plain-text IPs are stored.
- **Header:** Response includes `X-RateLimit-Remaining` showing remaining requests in current window.
