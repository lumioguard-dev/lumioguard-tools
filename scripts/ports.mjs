// The dev port allocations, validated on read.
//
// `ports.json` is the source of truth: a tool's web port, its Worker port and
// the proxy target that joins them all come from one row, so the two numbers
// cannot drift apart. They were separate literals in `vite.config.ts` and
// `api/package.json` — a pair that has to agree and cannot fail together, which
// is the shape of a bug that has not happened yet.
//
// Validation runs on every read rather than in a separate lint step, so a
// collision is caught by the thing that would have suffered from it: starting a
// server. Silence here means the table is sound.

import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../ports.json', import.meta.url), 'utf8'));

/** Loopback address every service binds. `localhost` may resolve to ::1 first. */
export const HOST = config.host;

/**
 * Every allocation as `{ label, port }`, reserved rows included.
 *
 * The reserved rows are the point: the other repo's app is not visible from
 * here, so nothing would otherwise stop a tool from taking 5173 and leaving a
 * developer with two servers fighting over one port and no clue why.
 */
function allocations() {
  const rows = [];
  for (const [label, port] of Object.entries(config.reserved)) {
    if (typeof port === 'number') rows.push({ label, port });
  }
  for (const [tool, slots] of Object.entries(config.tools)) {
    rows.push({ label: `${tool}:web`, port: slots.web });
    rows.push({ label: `${tool}:api`, port: slots.api });
  }
  return rows;
}

/** Throw on any port claimed twice. Returns the rows so callers can report them. */
export function assertNoCollisions() {
  const seen = new Map();
  for (const { label, port } of allocations()) {
    const owner = seen.get(port);
    if (owner !== undefined) {
      throw new Error(
        `Port ${port} is allocated twice: "${owner}" and "${label}". Give one of them a free slot in ports.json.`,
      );
    }
    seen.set(port, label);
  }
  return allocations();
}

/** A tool's `{ web, api }` ports, or a listing of what does exist. */
export function portsFor(tool) {
  assertNoCollisions();
  const slots = config.tools[tool];
  if (!slots) {
    const known = Object.keys(config.tools).join(', ') || '(none)';
    throw new Error(`No port slot for "${tool}" in ports.json. Allocated tools: ${known}.`);
  }
  return slots;
}
