import type { TargetResolver } from '@lumioguard/api-core';
import type { ScanResponse } from '@lumioguard/shared';
import { PageSnapshot, type SlopAnalyzer } from '@lumioguard/slopmeter-core';
import type { ScanResultMapper } from '../mappers/ScanResultMapper.js';
import type { PageFetcher } from './PageFetcher.js';

/** Deliberately no crawl: one request here means one page. */
export class ScanService {
  private readonly resolver: TargetResolver;
  private readonly fetcher: PageFetcher;
  private readonly analyzer: SlopAnalyzer;
  private readonly mapper: ScanResultMapper;
  private readonly clock: () => Date;

  public constructor(dependencies: {
    resolver: TargetResolver;
    fetcher: PageFetcher;
    analyzer: SlopAnalyzer;
    mapper: ScanResultMapper;
    clock?: () => Date;
  }) {
    this.resolver = dependencies.resolver;
    this.fetcher = dependencies.fetcher;
    this.analyzer = dependencies.analyzer;
    this.mapper = dependencies.mapper;
    this.clock = dependencies.clock ?? ((): Date => new Date());
  }

  public async scanUrl(rawUrl: string): Promise<ScanResponse> {
    const target = this.resolver.resolve(rawUrl);
    const snapshot = await this.fetcher.fetchSnapshot(target);
    return this.mapper.toResponse(this.analyzer.analyze(snapshot), this.clock());
  }

  public analyzeContent(input: {
    url?: string;
    html: string;
    css?: readonly string[];
    headers?: Record<string, string>;
  }): ScanResponse {
    const snapshot = PageSnapshot.create({
      url: input.url ?? null,
      html: input.html,
      stylesheets: input.css ?? [],
      headers: input.headers ?? {},
    });
    return this.mapper.toResponse(this.analyzer.analyze(snapshot), this.clock());
  }
}
