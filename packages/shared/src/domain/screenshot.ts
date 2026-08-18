export const SCREENSHOT_WIDTH = 1200;

/** WordPress mShots: keyless and free, which is why it is the default. */
export function mshotsUrl(pageUrl: string, width: number = SCREENSHOT_WIDTH): string | null {
  try {
    const target = new URL(pageUrl.includes('://') ? pageUrl : `https://${pageUrl}`);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return null;
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(target.toString())}?w=${width}`;
  } catch {
    return null;
  }
}
