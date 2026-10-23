import "server-only";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required in .env.local"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
});

function getValidatedConfig() {
  const result = envSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });

  if (!result.success) {
    const errorDetails = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Server Configuration Error: ${errorDetails}`);
  }

  return result.data;
}

export const serverConfig = getValidatedConfig;
