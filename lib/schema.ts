import { z } from "zod";

export const DescribeRequestSchema = z
  .object({
    image: z.string().min(10, "Image data is required"),
    mode: z.enum(["scene", "text"]).default("scene"),
    lang: z.enum(["en", "hi", "mr"]).default("en"),
  })
  .strict();

export type DescribeRequest = z.infer<typeof DescribeRequestSchema>;

export const DescribeResponseSchema = z
  .object({
    hazards: z.array(z.string()).default([]),
    objects: z.array(z.string()).default([]),
    text: z.string().nullable().default(null),
    confidence: z.enum(["high", "medium", "low"]).default("medium"),
    spoken_summary: z.string(),
  })
  .strict();

export type DescribeResponse = z.infer<typeof DescribeResponseSchema>;
