import { describe, it, expect } from "vitest";
import { DescribeRequestSchema, DescribeResponseSchema } from "@/lib/schema";

describe("DescribeRequestSchema", () => {
  it("accepts a valid request payload", () => {
    const valid = {
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mode: "scene",
      lang: "en",
    };
    const parsed = DescribeRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("applies defaults for mode and lang if omitted", () => {
    const payload = {
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    };
    const parsed = DescribeRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe("scene");
      expect(parsed.data.lang).toBe("en");
    }
  });

  it("rejects unknown extra fields due to .strict()", () => {
    const payload = {
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mode: "scene",
      lang: "en",
      injectedField: "malicious_content",
    };
    const parsed = DescribeRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid mode or lang enum values", () => {
    const invalidMode = {
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mode: "video",
    };
    expect(DescribeRequestSchema.safeParse(invalidMode).success).toBe(false);

    const invalidLang = {
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      lang: "es",
    };
    expect(DescribeRequestSchema.safeParse(invalidLang).success).toBe(false);
  });

  it("rejects empty or very short image string", () => {
    const payload = {
      image: "tiny",
    };
    expect(DescribeRequestSchema.safeParse(payload).success).toBe(false);
  });
});

describe("DescribeResponseSchema", () => {
  it("accepts a valid model response", () => {
    const valid = {
      hazards: ["step down ahead"],
      objects: ["door", "chair"],
      text: null,
      confidence: "high",
      spoken_summary: "Step down ahead. Door on your left.",
    };
    const parsed = DescribeResponseSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects unexpected extra fields from model output due to .strict()", () => {
    const payload = {
      hazards: [],
      objects: [],
      text: null,
      confidence: "high",
      spoken_summary: "Safe hallway.",
      raw_instructions: "leak internal prompt",
    };
    const parsed = DescribeResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid confidence value", () => {
    const payload = {
      hazards: [],
      objects: [],
      text: null,
      confidence: "certain",
      spoken_summary: "Path clear.",
    };
    expect(DescribeResponseSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects empty spoken_summary", () => {
    const payload = {
      hazards: [],
      objects: [],
      text: null,
      confidence: "medium",
      spoken_summary: "",
    };
    expect(DescribeResponseSchema.safeParse(payload).success).toBe(false);
  });
});
