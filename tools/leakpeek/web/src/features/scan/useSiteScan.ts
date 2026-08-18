import type { ExposureResponse } from '@lumioguard/shared';
import { type SiteScanState, useSiteScan as useScan } from '@lumioguard/web-core';
import { ScanClient } from '../../api/ScanClient.js';

const client = new ScanClient();

export function useSiteScan(address: string): SiteScanState<ExposureResponse> {
  return useScan(address, (url, signal) => client.scan(url, signal));
}
