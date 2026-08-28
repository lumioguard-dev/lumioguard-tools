import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_FLOOR_PAGES,
  ReadingConfidence,
  confidenceFor,
  confidenceNote,
} from '../evidence.js';

describe('reading confidence', () => {
  it('calls a crawl below the floor provisional', () => {
    for (let pages = 0; pages < EVIDENCE_FLOOR_PAGES; pages += 1) {
      expect(confidenceFor(pages)).toBe(ReadingConfidence.Provisional);
    }
  });

  it('calls the floor itself measured', () => {
    expect(confidenceFor(EVIDENCE_FLOOR_PAGES)).toBe(ReadingConfidence.Measured);
  });

  it('stays measured for a full crawl', () => {
    expect(confidenceFor(15)).toBe(ReadingConfidence.Measured);
  });

  /**
   * The defect this exists for: both single-page readings on 2026-08-27 landed
   * in the top band, above sites whose fifteen-page crawls earned their credits.
   */
  it('flags the single-page reading that scored top tier', () => {
    expect(confidenceFor(1)).toBe(ReadingConfidence.Provisional);
    expect(confidenceNote(confidenceFor(1), 1)).toContain('one page');
  });

  it('says nothing when the reading is measured', () => {
    expect(confidenceNote(confidenceFor(EVIDENCE_FLOOR_PAGES), EVIDENCE_FLOOR_PAGES)).toBeNull();
    expect(confidenceNote(confidenceFor(15), 15)).toBeNull();
  });

  it('counts pages in words the reader recognises', () => {
    expect(confidenceNote(confidenceFor(2), 2)).toContain('2 pages');
    expect(confidenceNote(confidenceFor(2), 2)).not.toContain('one page');
  });
});
