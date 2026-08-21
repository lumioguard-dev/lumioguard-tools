import { endpoint, jsonBody, queryParams, standardHeaders } from '@lumioguard/api-core';
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
import { cors } from 'hono/cors';
import { getContainer } from './container.js';
import type { Bindings } from './http/env.js';
import { readingFrom } from './mappers/ReadingMapper.js';
import { recorderConfigFrom } from './services/ReadingRecorder.js';

export type { Env } from './http/env.js';

const app = new Hono<Bindings>();

app.use('*', async (context, next) => {
  const configured = context.env.ALLOWED_ORIGINS ?? '*';
  const origin = configured === '*' ? '*' : configured.split(',').map((value) => value.trim());
  return cors({ origin, allowMethods: ['GET', 'POST', 'OPTIONS'] })(context, next);
});

app.use('*', standardHeaders());

const scanPage = (input: ScanRequest): Promise<unknown> =>
  getContainer().scanService.scanUrl(input.url);

/** Breadth across a level, depth through levels. */
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

/** Liveness only. */
app.get('/api/health', (context) => context.json({ status: 'ok' }));

app.get('/api/scan', endpoint(scanRequestSchema, queryParams('url'), scanPage));
app.post('/api/scan', endpoint(scanRequestSchema, jsonBody, scanPage));

app.get(
  '/api/crawl',
  endpoint(crawlRequestSchema, queryParams('url', 'depth', 'maxPages'), crawlSite),
);
app.post('/api/crawl', endpoint(crawlRequestSchema, jsonBody, crawlSite));

app.post('/api/analyze', endpoint(analyzeRequestSchema, jsonBody, analyze));

app.onError((error, context) => {
  const { status, body } = toHttpFailure(error);
  return context.json(body, status);
});

app.notFound((context) => context.json(NOT_FOUND.body, NOT_FOUND.status));

export default app;
