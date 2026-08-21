import {
  NOT_FOUND,
  endpoint,
  jsonBody,
  queryParams,
  standardHeaders,
  toHttpFailure,
} from '@lumioguard/api-core';
import {
  type CitationRequest,
  type CrawlRequest,
  citationRequestSchema,
  crawlRequestSchema,
} from '@lumioguard/shared';
import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { getContainer } from './container.js';
import type { Bindings } from './http/env.js';
import { readingFrom, readingFromCrawl, recorderConfigFrom } from './services/ReadingRecorder.js';

export type { Env } from './http/env.js';

const app = new Hono<Bindings>();

app.use('*', async (context, next) => {
  const configured = context.env.ALLOWED_ORIGINS ?? '*';
  const origin = configured === '*' ? '*' : configured.split(',').map((value) => value.trim());
  return cors({ origin, allowMethods: ['GET', 'POST', 'OPTIONS'] })(context, next);
});

app.use('*', standardHeaders());

/**
 * Read a page, then record it so the report can hand the reading on. AWAITED
 * because LumioGuard mints the key and the response has to carry it. A failed
 * recording costs only the hand-off: `siteKey` stays null and the report renders.
 */
const scan = async (input: CitationRequest, context: Context<Bindings>): Promise<unknown> => {
  const container = getContainer();
  const report = await container.scanService.scan(input.url);

  const config = recorderConfigFrom(context.env);
  const siteKey =
    config === null
      ? null
      : await container.recorder.record(readingFrom(report), config, report.host);

  return { ...report, siteKey };
};

/** Breadth across a level, depth through levels. */
const crawl = async (
  { url, ...options }: CrawlRequest,
  context: Context<Bindings>,
): Promise<unknown> => {
  const container = getContainer();
  const report = await container.crawlService.crawlSite(url, options);

  const config = recorderConfigFrom(context.env);
  const siteKey =
    config === null
      ? null
      : await container.recorder.record(readingFromCrawl(report), config, report.host);

  return { ...report, siteKey };
};

app.get('/api/health', (context) => context.json({ status: 'ok' }));

app.get('/api/scan', endpoint(citationRequestSchema, queryParams('url'), scan));
app.post('/api/scan', endpoint(citationRequestSchema, jsonBody, scan));

app.get('/api/crawl', endpoint(crawlRequestSchema, queryParams('url', 'depth', 'maxPages'), crawl));
app.post('/api/crawl', endpoint(crawlRequestSchema, jsonBody, crawl));

app.onError((error, context) => {
  const { status, body } = toHttpFailure(error);
  return context.json(body, status);
});

app.notFound((context) => context.json(NOT_FOUND.body, NOT_FOUND.status));

export default app;
