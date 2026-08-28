import {
  allowedByRateLimit,
  corsFor,
  endpoint,
  jsonBody,
  standardHeaders,
} from '@lumioguard/api-core';
import { NOT_FOUND, toHttpFailure } from '@lumioguard/api-core';
import {
  type AnalyzeRequest,
  type CrawlRequest,
  type ScanRequest,
  analyzeRequestSchema,
  crawlRequestSchema,
  hostOf,
  scanRequestSchema,
} from '@lumioguard/shared';
import { type Context, Hono } from 'hono';
import { getContainer } from './container.js';
import type { Bindings } from './http/env.js';
import { readingFrom } from './mappers/ReadingMapper.js';
import { recorderConfigFrom } from './services/ReadingRecorder.js';

export type { Env } from './http/env.js';

const app = new Hono<Bindings>();

app.use('*', async (context, next) => corsFor(context.env.ALLOWED_ORIGINS)(context, next));

app.use('*', standardHeaders());

/**
 * Paths that must not spend the SCAN budget. The AI slop page asks for two boards
 * on load, so metering them would leave a visitor who opened it twice unable to
 * scan. A board's own limit belongs upstream, with the data.
 */
const UNMETERED = new Set(['/api/health', '/api/leaderboard']);

app.use('/api/*', async (context, next) => {
  if (
    !UNMETERED.has(context.req.path) &&
    !(await allowedByRateLimit(context.env.SCAN_RATE_LIMITER, context.req.raw))
  ) {
    return context.json(
      { error: { code: 'rate_limited', message: 'Too many scans. Try again shortly.' } },
      429,
    );
  }
  await next();
});

const scanPage = (input: ScanRequest): Promise<unknown> =>
  getContainer().scanService.scanUrl(input.url);

const crawlSite = async (
  { url, ...options }: CrawlRequest,
  context: Context<Bindings>,
): Promise<unknown> => {
  const container = getContainer();
  const report = await container.crawlService.crawlSite(url, options);

  const config = recorderConfigFrom(context.env);
  const host = hostOf(report.entry);
  const siteKey =
    config === null
      ? null
      : await container.recorder.record(readingFrom(report, host), config, host);

  return { ...report, siteKey };
};

/** No I/O, so no target validation. */
const analyze = (input: AnalyzeRequest): unknown =>
  getContainer().scanService.analyzeContent(input);

app.get('/api/health', (context) => context.json({ status: 'ok' }));

/**
 * The public board. FAILS CLOSED: with no LumioGuard address configured there
 * is no board, never a fork reading somebody else's.
 */
app.get('/api/leaderboard', async (context) => {
  const base = context.env.LUMIOGUARD_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return context.json({ error: 'No leaderboard here' }, 404);

  const side = context.req.query('side') === 'worst' ? 'worst' : 'best';
  const asked = Number(context.req.query('page') ?? '1');
  const page = Number.isFinite(asked) ? Math.max(1, Math.floor(asked)) : 1;

  const board = await getContainer().leaderboard.read(base, side, page);
  // Generic: the upstream's reasons are not this Worker's to relay.
  if (board === null) return context.json({ error: 'Leaderboard unavailable' }, 502);
  return context.json(board);
});

app.post('/api/scan', endpoint(scanRequestSchema, jsonBody, scanPage));

app.post('/api/crawl', endpoint(crawlRequestSchema, jsonBody, crawlSite));

app.post('/api/analyze', endpoint(analyzeRequestSchema, jsonBody, analyze));

app.onError((error, context) => {
  const { status, body } = toHttpFailure(error);
  return context.json(body, status);
});

app.notFound((context) => context.json(NOT_FOUND.body, NOT_FOUND.status));

export default app;
