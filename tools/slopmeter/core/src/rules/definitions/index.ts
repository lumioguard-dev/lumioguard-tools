import { RuleRegistry } from '../RuleRegistry.js';
import { copyRules } from './copyRules.js';
import { craftRules } from './craftRules.js';
import { defaultStackRules } from './defaultRules.js';
import { fingerprintRules } from './fingerprintRules.js';
import { humanRules } from './humanRules.js';
import { impeccableRules } from './impeccableRules.js';
import { layoutRules } from './layoutRules.js';
import { leftoverRules } from './leftoverRules.js';
import { qualityRules } from './qualityRules.js';
import { stackRules } from './stackRules.js';
import { structureRules } from './structureRules.js';

export function createDefaultRegistry(): RuleRegistry {
  return new RuleRegistry().register(
    ...fingerprintRules,
    ...leftoverRules,
    ...defaultStackRules,
    ...copyRules,
    ...layoutRules,
    ...stackRules,
    ...qualityRules,
    ...craftRules,
    ...structureRules,
    ...impeccableRules,
    ...humanRules,
  );
}

export {
  copyRules,
  craftRules,
  defaultStackRules,
  fingerprintRules,
  humanRules,
  impeccableRules,
  layoutRules,
  leftoverRules,
  qualityRules,
  stackRules,
  structureRules,
};
