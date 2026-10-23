import { describe, it, expect } from "vitest";
import { sanitizeSpokenText } from "@/lib/sanitize";

describe("sanitizeSpokenText", () => {
  it("removes http and https URLs", () => {
    const input = "Visit https://malicious-site.example/phish or http://tracker.com for details.";
    const result = sanitizeSpokenText(input);
    expect(result).not.toContain("https://");
    expect(result).not.toContain("http://");
    expect(result).toBe("Visit or for details.");
  });

  it("removes www-prefixed web links", () => {
    const input = "Check out www.example.com immediately.";
    const result = sanitizeSpokenText(input);
    expect(result).not.toContain("www.example.com");
    expect(result).toBe("Check out immediately.");
  });

  it("strips HTML markup and script tags", () => {
    const input = "Warning: <script>alert('pwned')</script><b>Stairs</b> ahead <img src=x onerror=alert(1)>!";
    const result = sanitizeSpokenText(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("<b>");
    expect(result).not.toContain("<img");
    expect(result).toBe("Warning: Stairs ahead !");
  });

  it("removes ASCII and Unicode control characters", () => {
    const input = "Hello\u0000world\u0007with\u001Fcontrol\u007Fcharacters.";
    const result = sanitizeSpokenText(input);
    expect(result).toBe("Helloworldwithcontrolcharacters.");
  });

  it("caps maximum spoken text length", () => {
    const longString = "A".repeat(500);
    const result = sanitizeSpokenText(longString, 50);
    expect(result.length).toBe(50);
  });

  it("normalizes multiple whitespace and trims edges", () => {
    const input = "   Multiple    spaces   between    words.   ";
    const result = sanitizeSpokenText(input);
    expect(result).toBe("Multiple spaces between words.");
  });

  it("handles empty or non-string input safely", () => {
    // @ts-expect-error testing invalid type safety at boundary
    expect(sanitizeSpokenText(null)).toBe("");
    // @ts-expect-error testing invalid type safety at boundary
    expect(sanitizeSpokenText(undefined)).toBe("");
    expect(sanitizeSpokenText("")).toBe("");
  });
});
