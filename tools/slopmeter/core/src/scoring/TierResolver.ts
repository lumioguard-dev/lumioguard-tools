import { TIER_BANDS, Tier, type TierBand } from '@lumioguard/shared';

export class TierResolver {
  private readonly bands: readonly TierBand[];

  public constructor(bands: readonly TierBand[] = TIER_BANDS) {
    this.bands = bands;
  }

  public resolve(score: number): Tier {
    for (const band of this.bands) {
      if (score <= band.to) return band.tier;
    }
    return Tier.Slop;
  }

  public describe(score: number): string {
    const tier = this.resolve(score);
    return this.bands.find((band) => band.tier === tier)?.description ?? '';
  }
}
