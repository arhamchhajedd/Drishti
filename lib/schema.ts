import { z } from "zod";

export const DescribeRequestSchema = z
  .object({
    image: z.string().min(10, "Image data is required"),
    mode: z.enum(["scene", "text"]).default("scene"),
    lang: z.enum(["en", "hi", "mr"]).default("en"),
  })
  .strict();

export type DescribeRequest = z.infer<typeof DescribeRequestSchema>;
export type Mode = "scene" | "text";

export const DescribeResponseSchema = z
  .object({
    hazards: z.array(z.string().max(120)).max(10).default([]),
    objects: z.array(z.string().max(120)).max(20).default([]),
    text: z.string().max(2000).nullable().default(null),
    confidence: z.enum(["high", "medium", "low"]).default("medium"),
    spoken_summary: z.string().min(1).max(600),
  })
  .strict();

export type DescribeResponse = z.infer<typeof DescribeResponseSchema>;
