import { z } from 'zod';
import { TIER_NAMES } from '../domain/tier.js';
import { enumOf } from './zod.js';

export const tierSchema = enumOf(TIER_NAMES);

/**
 * What a visitor is told about one observation. The rule's id, category and
 * catalogue position are deliberately NOT on the wire: publishing the rule pack
 * hands anyone the means to tune a page against it. `id` here is opaque.
 */
export const findingSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number(),
  evidence: z.string().nullable(),
});

export const scoreBreakdownSchema = z.object({
  value: z.number(),
  penalties: z.number(),
  credits: z.number(),
  creditCap: z.number(),
  creditApplied: z.number(),
});

export type FindingDto = z.infer<typeof findingSchema>;
export type ScoreBreakdownDto = z.infer<typeof scoreBreakdownSchema>;
