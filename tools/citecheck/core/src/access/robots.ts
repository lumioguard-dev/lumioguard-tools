import type { AgentAccess, AgentPostureDto } from '@lumioguard/shared';
import { KNOWN_AGENTS } from './agents.js';

interface RobotsRule {
  readonly allow: boolean;
  readonly path: string;
}

interface RobotsGroup {
  /** Lower-cased tokens; one group can name several agents. */
  readonly agents: readonly string[];
  readonly rules: readonly RobotsRule[];
}

export interface RobotsTxt {
  readonly groups: readonly RobotsGroup[];
  readonly sitemaps: readonly string[];
  /** False when the file was absent or unreadable, which is not the same as empty. */
  readonly present: boolean;
  /**
   * Lines that are neither blank, a comment, nor a recognised directive.
   *
   * Kept because a robots.txt is parsed by a machine that does not report back:
   * a mistyped field is skipped in silence, and the rule its author meant to
   * write was never in force. This is what Lighthouse's `robots-txt` audit
   * checks, as distinct from whether the file exists at all.
   */
  readonly invalidLines: readonly string[];
}

export const NO_ROBOTS: RobotsTxt = Object.freeze({
  groups: [],
  sitemaps: [],
  present: false,
  invalidLines: [],
});

/** Every field a robots.txt may carry, as the major crawlers document them. */
const KNOWN_FIELDS = new Set([
  'user-agent',
  'disallow',
  'allow',
  'sitemap',
  'crawl-delay',
  'host',
  'noindex',
  'clean-param',
  'request-rate',
  'visit-time',
]);

/**
 * robots.txt, per RFC 9309.
 *
 * Consecutive `User-agent` lines share the group that follows them, which is
 * the part hand-rolled parsers get wrong: treating each `User-agent` as its own
 * group silently drops the rules for every agent but the last one named.
 */
export function parseRobots(text: string): RobotsTxt {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const invalidLines: string[] = [];

  let agents: string[] = [];
  let rules: RobotsRule[] = [];
  let namingAgents = false;

  const close = (): void => {
    if (agents.length > 0) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (line === '') continue;

    const at = line.indexOf(':');
    if (at === -1) {
      invalidLines.push(line);
      continue;
    }
    const field = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    if (!KNOWN_FIELDS.has(field)) invalidLines.push(line);

    if (field === 'user-agent') {
      // A `User-agent` after a rule starts a new group; one directly after
      // another joins the same group.
      if (!namingAgents) close();
      namingAgents = true;
      if (value !== '') agents.push(value.toLowerCase());
      continue;
    }

    namingAgents = false;
    if (field === 'sitemap') {
      if (value !== '') sitemaps.push(value);
      continue;
    }
    // An empty `Disallow` is the explicit "everything is allowed" and carries
    // no path, so it is dropped rather than recorded as a rule matching "".
    if ((field === 'allow' || field === 'disallow') && value !== '') {
      rules.push({ allow: field === 'allow', path: value });
    }
  }
  close();

  return { groups, sitemaps, present: true, invalidLines };
}

/**
 * RFC 9309 path matching: `*` spans any run, `$` anchors the end, everything
 * else is a literal prefix.
 */
function pathMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .split('*')
    .join('.*');
  try {
    return new RegExp(`^${source}${anchored ? '$' : ''}`).test(path);
  } catch {
    return false;
  }
}

/** The group that governs an agent: its own if it has one, else the wildcard. */
function groupFor(robots: RobotsTxt, token: string): RobotsGroup | null {
  const lower = token.toLowerCase();
  const named = robots.groups.find((group) => group.agents.includes(lower));
  if (named !== undefined) return named;
  return robots.groups.find((group) => group.agents.includes('*')) ?? null;
}

/**
 * Whether a group lets a path through.
 *
 * Longest match wins and a tie goes to `Allow`, which is the rule that makes
 * `Disallow: /` plus `Allow: /blog/` mean what its author intended. Comparing
 * in file order instead would block the blog.
 */
function allowsPath(group: RobotsGroup, path: string): boolean {
  let decision = true;
  let bestLength = -1;
  for (const rule of group.rules) {
    if (!pathMatches(rule.path, path)) continue;
    const length = rule.path.replace(/\$$/, '').length;
    if (length > bestLength || (length === bestLength && rule.allow)) {
      bestLength = length;
      decision = rule.allow;
    }
  }
  return decision;
}

/** How the group that decided is named back to the reader. */
function ruleLabel(robots: RobotsTxt, token: string): string | null {
  const lower = token.toLowerCase();
  if (robots.groups.some((group) => group.agents.includes(lower))) {
    return `User-agent: ${token}`;
  }
  return robots.groups.some((group) => group.agents.includes('*')) ? 'User-agent: *' : null;
}

/**
 * Whether a crawler with no group of its own may fetch a path.
 *
 * This is what a general search crawler gets, and it is the one posture worth
 * scoring against, because a page disallowed here is one the site has asked
 * nobody at all to read.
 */
export function allowedForAnyone(robots: RobotsTxt, path: string): boolean {
  const wildcard = robots.groups.find((group) => group.agents.includes('*'));
  return wildcard === undefined ? true : allowsPath(wildcard, path);
}

/**
 * What robots.txt says to each known agent about one path.
 *
 * `unmentioned` is reported when nothing applies at all, which is a different
 * answer from `allowed`: the agent is free to read, but the site never said so
 * and the next edit to robots.txt could change that without anyone noticing.
 */
export function agentPostures(robots: RobotsTxt, path: string): AgentPostureDto[] {
  return KNOWN_AGENTS.map((agent) => {
    const group = groupFor(robots, agent.token);
    const access: AgentAccess =
      group === null ? 'unmentioned' : allowsPath(group, path) ? 'allowed' : 'blocked';
    return {
      agent: agent.token,
      operator: agent.operator,
      access,
      rule: group === null ? null : ruleLabel(robots, agent.token),
    };
  });
}
