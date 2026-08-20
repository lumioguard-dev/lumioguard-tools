import type { ExposureFinding } from '../domain/ExposureFinding.js';
import type { SupabaseTarget } from '../passive/supabaseDiscovery.js';

/**
 * The Supabase RLS probe, as pure pieces: the api runs the reads, this module
 * decides what a response MEANS. Keeping interpretation here keeps the
 * dangerous half, the actual network read, in one place in the api, and keeps
 * the judgement testable without a network.
 *
 * The probe is the CVE-2025-48757 test, done exactly as the app's own client
 * would: read a table as the anonymous user with the anon key from the bundle.
 * Rows back unauthenticated means Row Level Security is missing. It is a READ;
 * the engine never writes (the read-only guarantee).
 */

/**
 * Tables an AI builder tends to create by name. Not exhaustive and not a
 * dictionary attack: a short, common set so the probe stays a handful of reads,
 * not a sweep. The engine reports what it can confirm and never implies the
 * absence of a finding means the whole database is safe.
 */
export const COMMON_TABLES: readonly string[] = Object.freeze([
  'users',
  'profiles',
  'customers',
  'accounts',
  'orders',
  'payments',
  'subscriptions',
  'messages',
  'chats',
  'posts',
  'todos',
  'documents',
  'api_keys',
  'waitlist',
  'contacts',
  'leads',
]);

/** How many rows to ask for: enough to prove readability, not to copy the table. */
export const PROBE_ROW_LIMIT = 3;

/** The read URL for one table, anon-authenticated exactly as the app's client. */
export function supabaseRestUrl(target: SupabaseTarget, table: string): string {
  return `${target.url}/rest/v1/${encodeURIComponent(table)}?select=*&limit=${PROBE_ROW_LIMIT}`;
}

/** The headers the app's own client sends: its public key, nothing more. */
export function supabaseProbeHeaders(target: SupabaseTarget): Record<string, string> {
  return { apikey: target.apiKey, authorization: `Bearer ${target.apiKey}` };
}

/** Column names from a returned row, so evidence names the shape not the values. */
function columnsOf(rows: readonly unknown[]): string[] {
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return [];
  return Object.keys(first);
}

/** Fields whose mere presence raises the stakes: a readable table of these is worse. */
const SENSITIVE_WORDS: readonly string[] = [
  'email',
  'phone',
  'password',
  'token',
  'secret',
  'stripe',
  'card',
  'ssn',
  'dob',
  'address',
];

/** The same, where the tell is two or more adjacent segments rather than one. */
const SENSITIVE_PHRASES: readonly string[] = ['api_key', 'date_of_birth'];

/**
 * Matched per NAME SEGMENT, never as a bare substring.
 *
 * As one alternation over the whole column name it called `discard_count`,
 * `wildcard_rules`, `cardinality`, `scorecard_id` and `adobe_id` personal:
 * `card` and `dob` sit inside all of them. The finding fires either way, since
 * rows came back to an anonymous request, but the sentence claimed the table
 * holds personal data when it holds a counter.
 *
 * Phrases are matched against the normalised name because `api_key` and
 * `apiKey` are two segments, and a per-segment test alone would miss both.
 */
function looksSensitive(column: string): boolean {
  const segments = column
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part !== '');
  if (segments.some((segment) => SENSITIVE_WORDS.includes(segment))) return true;
  const normalised = `_${segments.join('_')}_`;
  return SENSITIVE_PHRASES.some((phrase) => normalised.includes(`_${phrase}_`));
}

/**
 * What one table read means. `status` is the HTTP status; `rows` is the parsed
 * body when it was a JSON array, else null.
 *
 * Only a 200 that returns rows is reported: that is unambiguous: RLS is off and
 * data came out. A 200 with an empty array is ambiguous (empty table, or a
 * policy that correctly returns nothing to anon) and is deliberately NOT
 * reported, so the tool never cries wolf. 401/403/404 mean protected or absent.
 */
export function interpretTableRead(
  table: string,
  status: number,
  rows: readonly unknown[] | null,
): ExposureFinding | null {
  if (status !== 200 || rows === null || rows.length === 0) return null;

  const columns = columnsOf(rows);
  const hasSensitive = columns.some(looksSensitive);
  const columnList = columns.length > 0 ? `; columns: ${columns.slice(0, 12).join(', ')}` : '';

  return {
    code: `supabase-rls:${table}`,
    severity: 'critical',
    category: 'missing-rls',
    title: `Table \`${table}\` is readable without signing in`,
    detail: hasSensitive
      ? `Row Level Security is off on \`${table}\`, and it holds fields that look personal. Anyone with the site's public key can read every row.`
      : `Row Level Security is off on \`${table}\`. Anyone with the site's public key can read every row.`,
    // Structural only: that data returned, how much, and its shape. Never values.
    evidence: `Read ${rows.length}+ row(s) unauthenticated${columnList}`,
    fix: `Enable RLS and add a policy: alter table ${table} enable row level security; then a policy scoping rows to auth.uid().`,
  };
}
