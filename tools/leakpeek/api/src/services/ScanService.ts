import { TargetResolver } from '@lumioguard/api-core';
import { type ExposureFinding, analyzePassive } from '@lumioguard/leakpeek-core';
import type { ExposureResponse } from '@lumioguard/shared';
import { type ScanInputs, toExposureResponse } from '../mappers/ExposureMapper.js';
import { PageFetcher } from './PageFetcher.js';
import { ProbeRunner } from './ProbeRunner.js';

export interface ScanServiceDeps {
  readonly resolver?: TargetResolver;
  readonly fetcher?: PageFetcher;
  readonly prober?: ProbeRunner;
  /** Injected so a test can pin the timestamp; defaults to now. */
  readonly clock?: () => Date;
}

/**
 * One scan, end to end: resolve the target, read the served page, run the
 * passive checks, then — only if the page pointed at a backend or shipped a
 * source map — run the read-only active probes and fold their findings in.
 *
 * `backendProbed` reports whether a backend was actually read, so the surface can
 * say "no backend found to probe" rather than implying a database was checked
 * and came back clean.
 */
export class ScanService {
  private readonly resolver: TargetResolver;
  private readonly fetcher: PageFetcher;
  private readonly prober: ProbeRunner;
  private readonly clock: () => Date;

  public constructor(deps: ScanServiceDeps = {}) {
    this.resolver = deps.resolver ?? new TargetResolver();
    this.fetcher = deps.fetcher ?? new PageFetcher();
    this.prober = deps.prober ?? new ProbeRunner();
    this.clock = deps.clock ?? (() => new Date());
  }

  public async scan(rawUrl: string): Promise<ExposureResponse> {
    const target = this.resolver.resolve(rawUrl);
    const page = await this.fetcher.fetchPage(target);

    const passive = analyzePassive({
      url: page.url,
      host: page.host,
      html: page.html,
      headers: page.headers,
      scripts: page.scripts,
    });

    const active: ExposureFinding[] = [];

    // Runs on every scan: every site has a root, so there is always a dotfile
    // path worth asking for.
    active.push(...(await this.prober.checkExposedFiles(new URL(page.url).origin)));

    // Only true when a backend was actually found and read. It was once pinned
    // to `true` because the exposed-file check always runs, which made the clean
    // report say it had read "the page, its scripts and its backend" on sites
    // that expose no backend at all — the report claiming a check it never made.
    const backendProbed = passive.supabase !== null;
    if (passive.supabase !== null) {
      active.push(...(await this.prober.probeSupabase(passive.supabase)));
    }
    if (passive.sourceMapCandidates.length > 0) {
      active.push(...(await this.prober.checkSourceMaps(passive.sourceMapCandidates)));
    }

    const inputs: ScanInputs = {
      url: page.url,
      host: page.host,
      title: page.title,
      stack: passive.stack,
      findings: [...passive.findings, ...active],
      backendProbed,
      // Filled in by the route, which owns the network call: a scan stays
      // testable without a transport, and a failed hand-off cannot fail it.
      siteKey: null,
      scannedAt: this.clock().toISOString(),
    };

    return toExposureResponse(inputs);
  }
}
