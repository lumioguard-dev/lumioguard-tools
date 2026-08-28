import { z } from 'zod';
import { EXPOSURE_TIER_NAMES } from '../domain/exposureTier.js';
import { enumOf } from './zod.js';

export const exposureTierSchema = enumOf(EXPOSURE_TIER_NAMES);

/** Ordered worst-first, which is also the order a report lists findings in. */
export const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export const severitySchema = enumOf(SEVERITIES);
export type Severity = (typeof SEVERITIES)[number];

/**
 * The kinds of exposure Leakpeek reports. A category chooses the copy and the
 * icon; it never carries the detector's internal rule id (see finding.ts for
 * why the rule pack does not cross the wire).
 */
export const CATEGORIES = [
  'exposed-secret',
  'missing-rls',
  'open-storage',
  'auth-bypass',
  'source-map',
  'security-header',
  'exposed-file',
  'privacy',
] as const;
export const categorySchema = enumOf(CATEGORIES);
export type ExposureCategory = (typeof CATEGORIES)[number];

/**
 * No `fix` on the wire, deliberately: the remediation is the reason to continue
 * into LumioGuard. `evidence` is STRUCTURAL and redacted by construction, shapes
 * and counts and never values, so a report cannot become the leak it describes.
 */
export const exposureFindingSchema = z.object({
  /** Opaque and valid only within this response; exists so a list can be keyed. */
  id: z.string(),
  severity: severitySchema,
  /** What this finding cost the score. Lets a multi-tool surface rank across tools. */
  weight: z.number(),
  category: categorySchema,
  title: z.string(),
  detail: z.string(),
  evidence: z.string().nullable(),
});

/**
 * Reported, never scored. Each field is a DISTINCT claim: `builder` made it,
 * `backend` holds its data, `hosting` serves it; collapsing them had the tool
 * claim a site was built with Cloudflare. Weak tells are dropped, not hedged.
 */
export const detectedStackSchema = z.object({
  builder: z.string().nullable(),
  hosting: z.string().nullable(),
  backend: z.string().nullable(),
});

export const exposureResponseSchema = z.object({
  url: z.string(),
  host: z.string(),
  title: z.string().nullable(),
  /** 0–100, HIGHER IS BETTER. 100 is a site leaking nothing. See exposureTier.ts. */
  score: z.number(),
  tier: exposureTierSchema,
  tierDescription: z.string(),
  /** The single worst finding in words, or null when nothing was found. */
  headline: z.string().nullable(),
  stack: detectedStackSchema,
  findings: z.array(exposureFindingSchema),
  counts: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  /** False means "not looked for", not "looked and clean". */
  backendProbed: z.boolean(),
  /** The handle this reading was recorded under, for carrying into LumioGuard. */
  siteKey: z.string().nullable(),
  scannedAt: z.string(),
});

export const exposureRequestSchema = z.object({
  url: z.string({ required_error: 'A URL is required' }).min(1, 'A URL is required'),
});

export type ExposureFindingDto = z.infer<typeof exposureFindingSchema>;
export type DetectedStackDto = z.infer<typeof detectedStackSchema>;
export type ExposureResponse = z.infer<typeof exposureResponseSchema>;
export type ExposureRequest = z.infer<typeof exposureRequestSchema>;
