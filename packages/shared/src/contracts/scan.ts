import { z } from 'zod';
import { findingSchema, scoreBreakdownSchema, tierSchema } from './finding.js';

export const scanResponseSchema = z.object({
  url: z.string().nullable(),
  host: z.string().nullable(),
  title: z.string().nullable(),
  score: z.number(),
  tier: tierSchema,
  tierDescription: z.string(),
  /**
   * The heaviest tell, in words. Copy belonging to the rule that fired, so it
   * can never describe something that was not found. Null when the worst tell
   * has nothing to say, and the surface falls back to what the tier means.
   */
  headline: z.string().nullable(),
  breakdown: scoreBreakdownSchema,
  findings: z.array(findingSchema),
  /** Real defects, reported and never scored. */
  quality: z.array(findingSchema),
  /** What built the page. Reported, never scored. */
  provenance: z.array(findingSchema),
  /**
   * Retired from the surface, kept on the wire. See slopmeter's README: the engine
   * still classifies onto this axis and existing callers still read it.
   */
  unassessable: z.array(findingSchema),
  caveats: z.object({
    isClientRendered: z.boolean(),
    wasTruncated: z.boolean(),
  }),
  /** Third-party thumbnail of the page that was read; null when unavailable. */
  screenshotUrl: z.string().nullable(),
  fetchedAt: z.string(),
});

export const scanRequestSchema = z.object({
  url: z.string({ required_error: 'A URL is required' }).min(1, 'A URL is required'),
});

/** Score content the caller already has. */
export const analyzeRequestSchema = z.object({
  url: z.string().optional(),
  html: z.string().min(1, 'html is required'),
  css: z.array(z.string()).optional(),
  headers: z.record(z.string()).optional(),
});

export type ScanResponse = z.infer<typeof scanResponseSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
