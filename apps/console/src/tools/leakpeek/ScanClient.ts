import { type ExposureResponse, exposureResponseSchema } from '@lumioguard/shared';
import { ApiClient } from '@lumioguard/web-core';

export class ScanClient extends ApiClient {
  public scan(url: string, signal?: AbortSignal): Promise<ExposureResponse> {
    return this.post('/api/scan', { url }, exposureResponseSchema, signal);
  }
}
