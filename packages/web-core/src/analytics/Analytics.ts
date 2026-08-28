import type { AnalyticsEvent, EventProperties } from './events.js';

/** The part of a loaded PostHog this console uses, and all a test needs to fake. */
export interface CaptureSink {
  capture(event: string, properties: EventProperties): void;
}

/**
 * Where an event goes, which may be nowhere. The sink arrives as a PROMISE
 * because loading PostHog is a round trip a click can beat: resolving through it
 * keeps capture order and makes "analytics is off" a null, not a second path.
 */
export class Analytics {
  constructor(private readonly sink: Promise<CaptureSink | null>) {}

  /** Off: nothing loads and every capture is dropped. */
  static off(): Analytics {
    return new Analytics(Promise.resolve(null));
  }

  capture(event: AnalyticsEvent, properties: EventProperties = {}): void {
    void this.sink.then((sink) => sink?.capture(event, properties));
  }
}
