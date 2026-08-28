import { RuleRegistry } from '../RuleRegistry.js';
import { compositionRules } from './compositionRules.js';
import { documentRules } from './documentRules.js';
import { finishRules } from './finishRules.js';
import { handworkRules } from './handworkRules.js';
import { impeccableRules } from './impeccableRules.js';
import { makerRules } from './makerRules.js';
import { platformRules } from './platformRules.js';
import { qualityRules } from './qualityRules.js';
import { stockRules } from './stockRules.js';
import { unfinishedRules } from './unfinishedRules.js';
import { voiceRules } from './voiceRules.js';

export function createDefaultRegistry(): RuleRegistry {
  return new RuleRegistry().register(
    ...makerRules,
    ...unfinishedRules,
    ...stockRules,
    ...voiceRules,
    ...compositionRules,
    ...platformRules,
    ...qualityRules,
    ...finishRules,
    ...documentRules,
    ...impeccableRules,
    ...handworkRules,
  );
}
