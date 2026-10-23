import "server-only";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required in .env.local"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
  // Not every model accepts every level (e.g. 3.8-flash rejects MINIMAL), so keep it configurable.
  GEMINI_THINKING_LEVEL: z.enum(["MINIMAL", "LOW", "MEDIUM", "HIGH"]).default("MINIMAL"),
});

export type ServerConfig = z.infer<typeof envSchema>;

let cached: ServerConfig | null = null;

export function serverConfig(): ServerConfig {
  if (cached) return cached;

  const result = envSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || undefined,
    GEMINI_THINKING_LEVEL: process.env.GEMINI_THINKING_LEVEL || undefined,
  });

  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Server configuration invalid: ${fields}`);
  }

  cached = result.data;
  return cached;
}
