export { type ExposureFinding, orderFindings } from './domain/ExposureFinding.js';

export { detectStack, type Fingerprint } from './passive/fingerprint.js';
export { checkSecurityHeaders } from './passive/headers.js';
export { checkPrivacy } from './passive/privacy.js';
export { jwtRole, maskSecret, scanForSecrets } from './passive/secrets.js';
export { sourceMapFinding, sourceMapPointer } from './passive/sourceMaps.js';
export { discoverSupabase, type SupabaseTarget } from './passive/supabaseDiscovery.js';

export {
  COMMON_TABLES,
  PROBE_ROW_LIMIT,
  interpretTableRead,
  supabaseProbeHeaders,
  supabaseRestUrl,
} from './probes/supabase.js';

export {
  EXPOSED_FILE_CHECKS,
  type ExposedFileCheck,
  interpretExposedFile,
} from './probes/exposedFiles.js';

export { headlineFor } from './scoring/headline.js';
export { scoreExposure, type ScoredExposure } from './scoring/ExposureScore.js';

export {
  analyzePassive,
  type FetchedScript,
  type PassiveInput,
  type PassiveResult,
} from './ExposureAnalyzer.js';

export {
  EXPOSURE_BANDS,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  ExposureTier,
  exposureBandFor,
  type ExposureBand,
} from '@lumioguard/shared';
