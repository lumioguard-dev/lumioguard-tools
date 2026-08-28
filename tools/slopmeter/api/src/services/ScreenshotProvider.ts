import { SCREENSHOT_WIDTH, mshotsUrl } from '@lumioguard/shared';

export interface ScreenshotProvider {
  urlFor(pageUrl: string): string | null;
}

/** WordPress mShots: keyless and free, which is why it is the default. */
export class MShotsScreenshotProvider implements ScreenshotProvider {
  private readonly width: number;

  public constructor(width: number = SCREENSHOT_WIDTH) {
    this.width = width;
  }

  public urlFor(pageUrl: string): string | null {
    return mshotsUrl(pageUrl, this.width);
  }
}

/** Opt out entirely: no thumbnail, no third party. */
export class NoScreenshotProvider implements ScreenshotProvider {
  public urlFor(): string | null {
    return null;
  }
}
