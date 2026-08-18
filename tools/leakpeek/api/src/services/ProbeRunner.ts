import {
  COMMON_TABLES,
  EXPOSED_FILE_CHECKS,
  type ExposureFinding,
  type SupabaseTarget,
  interpretExposedFile,
  interpretTableRead,
  sourceMapFinding,
  supabaseProbeHeaders,
  supabaseRestUrl,
} from '@lumioguard/leakpeek-core';

/**
 * The active tier: the only place that touches a target's backend. Every request
 * here is a READ — method GET, no body — and there is no code path that issues
 * anything else. That is the whole read-only guarantee (see the README), and
 * keeping the network in one small class is what makes it checkable at a glance.
 *
 * The engine decides what a response MEANS; this class only performs the read and
 * hands the status and parsed body back to it.
 */

/** Stop after this many readable tables: enough to prove the hole, not sweep it. */
const MAX_RLS_FINDINGS = 5;
const PROBE_TIMEOUT_MS = 6_000;
const MAX_SOURCE_MAP_CHECKS = 4;

export class ProbeRunner {
  public async probeSupabase(target: SupabaseTarget): Promise<ExposureFinding[]> {
    const headers = supabaseProbeHeaders(target);
    const findings: ExposureFinding[] = [];

    for (const table of COMMON_TABLES) {
      if (findings.length >= MAX_RLS_FINDINGS) break;
      const outcome = await this.readTable(supabaseRestUrl(target, table), headers);
      if (outcome === null) continue;
      const finding = interpretTableRead(table, outcome.status, outcome.rows);
      if (finding !== null) findings.push(finding);
    }

    return findings;
  }

  public async checkSourceMaps(candidates: readonly string[]): Promise<ExposureFinding[]> {
    for (const candidate of candidates.slice(0, MAX_SOURCE_MAP_CHECKS)) {
      if (await this.isReachableSourceMap(candidate)) return [sourceMapFinding(candidate)];
    }
    return [];
  }

  /** Sensitive files served from the site root — `.env`, `.git`. Reads only. */
  public async checkExposedFiles(origin: string): Promise<ExposureFinding[]> {
    const findings: ExposureFinding[] = [];
    for (const check of EXPOSED_FILE_CHECKS) {
      try {
        const response = await this.get(new URL(check.path, origin).toString(), {});
        const body = response.status === 200 ? (await response.text()).slice(0, 4000) : '';
        const finding = interpretExposedFile(check, response.status, body);
        if (finding !== null) findings.push(finding);
      } catch {
        // A path that will not load is not a finding.
      }
    }
    return findings;
  }

  /** A single read. GET only. Returns the status and the body when it is a JSON array. */
  private async readTable(
    url: string,
    headers: Record<string, string>,
  ): Promise<{ status: number; rows: unknown[] | null } | null> {
    try {
      const response = await this.get(url, headers);
      if (response.status !== 200) return { status: response.status, rows: null };
      const body: unknown = await response.json().catch(() => null);
      return { status: 200, rows: Array.isArray(body) ? body : null };
    } catch {
      return null;
    }
  }

  private async isReachableSourceMap(url: string): Promise<boolean> {
    try {
      const response = await this.get(url, {});
      if (response.status !== 200) return false;
      // Confirm it is actually a map, not an SPA's HTML 200 for an unknown path.
      const head = (await response.text()).slice(0, 200);
      return head.includes('"version"') && head.includes('"sources"');
    } catch {
      return false;
    }
  }

  /** The one request primitive. GET, timed out, and never anything but GET. */
  private async get(url: string, headers: Record<string, string>): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
