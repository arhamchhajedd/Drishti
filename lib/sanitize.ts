/**
 * Sanitizes text before speech synthesis and display.
 * Strips URLs, script/style blocks, HTML markup, control characters, and truncates long strings.
 */
export function sanitizeSpokenText(text: string, maxLength: number = 300): string {
  if (typeof text !== "string") return "";

  return text
    .replace(/https?:\/\/\S+/gi, "") // Remove http/https URLs
    .replace(/www\.\S+/gi, "") // Remove www URLs
    .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove script tags and contents
    .replace(/<style[\s\S]*?<\/style>/gi, "") // Remove style tags and contents
    .replace(/<[^>]*>/g, "") // Remove remaining HTML markup
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove ASCII & unicode control chars
    .replace(/\s+/g, " ") // Normalize excessive whitespace
    .trim()
    .slice(0, maxLength); // Cap spoken length
}
