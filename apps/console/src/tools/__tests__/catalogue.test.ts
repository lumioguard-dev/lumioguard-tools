import { describe, expect, it } from 'vitest';
import { CATALOGUE, toolCopy } from '../catalogue.js';
import { TOOLS } from '../index.js';

/**
 * The descriptors spread their entry from the catalogue, so a label or a
 * summary cannot differ. ORDER is the one thing that still could: the registry
 * decides what a visitor sees first, the catalogue what a crawler reads first.
 */

describe('CATALOGUE', () => {
  it('holds every tool the registry offers, in the order it offers them', () => {
    expect(CATALOGUE.map((tool) => tool.id)).toEqual(TOOLS.map((tool) => tool.id));
  });

  it('is the source of what each tool is called', () => {
    for (const tool of TOOLS) {
      const copy = toolCopy(tool.id);
      expect(tool.label).toBe(copy.label);
      expect(tool.summary).toBe(copy.summary);
    }
  });

  it('gives every tool a summary that is one sentence, because it is a tooltip', () => {
    for (const tool of CATALOGUE) {
      expect(tool.summary.trim().endsWith('.'), `${tool.id} is not a sentence`).toBe(true);
      expect(tool.summary.split('. ').length, `${tool.id} runs to more than one`).toBe(1);
    }
  });

  it('refuses to answer for a tool it does not have', () => {
    // A descriptor naming nothing would otherwise ship with an undefined label.
    expect(() => toolCopy('nothing')).toThrow(/nothing/);
  });
});
