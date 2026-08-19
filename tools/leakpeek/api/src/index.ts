import { endpoint, jsonBody, queryParams } from '@lumioguard/api-core';
import { NOT_FOUND, toHttpFailure } from '@lumioguard/api-core';
import { type ExposureRequest, exposureRequestSchema } from '@lumioguard/shared';
import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { getContainer } from './container.js';
import type { Bindings } from './http/env.js';
import { readingFrom, recorderConfigFrom } from './services/ReadingRecorder.js';

export type { Env } from './http/env.js';

const app = new Hono<Bindings>();

app.use('*', async (context, next) => {
  const configured = context.env.ALLOWED_ORIGINS ?? '*';
  const origin = configured === '*' ? '*' : configured.split(',').map((value) => value.trim());
  return cors({ origin, allowMethods: ['GET', 'POST', 'OPTIONS'] })(context, next);
});

app.use('*', async (context, next) => {
  await next();
  context.header('x-content-type-options', 'nosniff');
  context.header('referrer-policy', 'no-referrer');
});

/**
 * Read a site, then record it so the report can hand the reading on. AWAITED
 * because LumioGuard mints the key and the response has to carry it. A failed
 * recording costs only the hand-off: `siteKey` stays null and the report renders.
 */
const scan = async (input: ExposureRequest, context: Context<Bindings>): Promise<unknown> => {
  const container = getContainer();
  const report = await container.scanService.scan(input.url);

  const config = recorderConfigFrom(context.env);
  const siteKey =
    config === null
      ? null
      : await container.recorder.record(readingFrom(report), config, report.host);

  return { ...report, siteKey };
};

app.get('/api/health', (context) => context.json({ status: 'ok' }));

app.get('/api/scan', endpoint(exposureRequestSchema, queryParams('url'), scan));
app.post('/api/scan', endpoint(exposureRequestSchema, jsonBody, scan));

app.onError((error, context) => {
  const { status, body } = toHttpFailure(error);
  return context.json(body, status);
});

app.notFound((context) => context.json(NOT_FOUND.body, NOT_FOUND.status));

export default app;
