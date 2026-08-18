import { z } from 'zod';
import { TIER_NAMES } from '../domain/tier.js';
import { enumOf } from './zod.js';

export const tierSchema = enumOf(TIER_NAMES);

/**
 * What a visitor is told about one observation.
 *
 * Deliberately NOT on the wire: the rule's id, its category, and its position
 * in the catalogue. Those describe the detector rather than the page, and the
 * rule pack is the product — publishing it hands anyone the means to clone the
 * instrument or to tune a page against it rule by rule. `id` is opaque and
 * valid only within the response that produced it; it exists so a list can be
 * keyed, and carries no meaning beyond that.
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
