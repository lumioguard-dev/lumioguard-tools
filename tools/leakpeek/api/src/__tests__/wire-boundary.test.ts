import type { ExposureFinding } from '@lumioguard/leakpeek-core';
import { exposureResponseSchema } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { toExposureResponse } from '../mappers/ExposureMapper.js';

/**
 * The boundary this guards is INVISIBLE: nothing breaks and no screen looks
 * wrong when a mapper spreads the domain object onto the response. Two things
 * must never cross: the `code`, and the `fix` the hand-off exists to sell.
 */
const FINDING: ExposureFinding = {
  code: 'supabase.rls-open',
  severity: 'critical',
  category: 'missing-rls',
  title: 'A table answers an anonymous read',
  detail: 'detail',
  evidence: '12 rows, columns: id, email',
  fix: 'Turn on row-level security for that table.',
};

function keysDeep(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) keysDeep(item, into);
    return into;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      into.add(key);
      keysDeep(nested, into);
    }
  }
  return into;
}

describe('the scan response', () => {
  const response = toExposureResponse({
    url: 'https://example.test/',
    host: 'example.test',
    title: 'Example',
    stack: { builder: null, hosting: null, backend: null },
    findings: [FINDING],
    backendProbed: true,
    siteKey: null,
    scannedAt: '2026-08-19T00:00:00.000Z',
  });

  it('carries neither the probe that fired nor the fix for it', () => {
    const keys = keysDeep(response);
    expect(keys.has('code')).toBe(false);
    expect(keys.has('fix')).toBe(false);
    expect(JSON.stringify(response)).not.toContain('supabase.rls-open');
    expect(JSON.stringify(response)).not.toContain('row-level security');
  });

  it('matches the schema the client validates against', () => {
    expect(exposureResponseSchema.safeParse(response).success).toBe(true);
  });

  /** The id exists so a list can be keyed, and must carry nothing else. */
  it('gives each finding an opaque, position-based id', () => {
    expect(response.findings.map((item) => item.id)).toEqual(['f0']);
  });

  it('derives the headline from the finding it reported', () => {
    expect(response.headline).toBe(FINDING.title);
  });
});
