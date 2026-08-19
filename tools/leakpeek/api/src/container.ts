import { ReadingRecorder } from '@lumioguard/api-core';
import { ScanService } from './services/ScanService.js';

export interface Container {
  readonly scanService: ScanService;
  readonly recorder: ReadingRecorder;
}

/** Composition root. Built once per isolate; the services are stateless. */
let cached: Container | null = null;

export function getContainer(): Container {
  if (cached !== null) return cached;
  cached = { scanService: new ScanService(), recorder: new ReadingRecorder() };
  return cached;
}
