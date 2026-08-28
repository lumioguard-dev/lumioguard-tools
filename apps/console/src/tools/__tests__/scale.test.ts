import { CITATION_BANDS, EXPOSURE_BANDS, TIER_BANDS } from '@lumioguard/shared';
import { describe, expect, it } from 'vitest';
import { VERDICT_SCALE as CONSOLIDATED } from '../../theme/reading.js';
import { TOOLS } from '../index.js';

const bandNames = (scale: { bands: readonly { tier: string }[] }): string[] =>
  scale.bands.map((band) => band.tier);

describe('the ladder a reading is stamped with', () => {
  // The words each tool's README documents, and nowhere else.
  it('carries the bands each engine publishes', () => {
    const documented: Record<string, readonly { tier: string }[]> = {
      slopmeter: TIER_BANDS,
      leakpeek: EXPOSURE_BANDS,
      citecheck: CITATION_BANDS,
    };
    for (const tool of TOOLS) {
      const bands = documented[tool.id];
      expect(bands, tool.id).toBeDefined();
      expect(bandNames(tool.scale), tool.id).toEqual((bands ?? []).map((band) => band.tier));
    }
  });

  it('keeps the consolidated words for the combined reading', () => {
    expect(bandNames(CONSOLIDATED)).toEqual(['Critical', 'Serious', 'Marked', 'Clean']);
  });

  // `ConsoleReport` stamps the last band while a read runs, so an empty ladder
  // would paint the seal with no colour.
  it('inks every band it declares, including the one drawn while waiting', () => {
    for (const scale of [...TOOLS.map((tool) => tool.scale), CONSOLIDATED]) {
      expect(scale.bands.length).toBeGreaterThan(0);
      for (const band of scale.bands) expect(scale.inkFor(band.tier)).toBe(band.ink);
    }
  });
});
