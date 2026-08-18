const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
]);
const PRIVATE_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^127\./,
];

export class InvalidTargetError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidTargetError';
  }
}

/**
 * Turns user input into a URL that is safe to fetch server-side.
 *
 * The Worker fetches whatever it is handed, so the private-range and scheme
 * checks are the boundary that stops it being used to probe internal hosts.
 */
export class TargetResolver {
  public resolve(raw: string): URL {
    const trimmed = raw.trim();
    if (trimmed === '') throw new InvalidTargetError('A URL is required');

    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      throw new InvalidTargetError(`Could not parse "${raw}" as a URL`);
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new InvalidTargetError('Only http and https URLs can be scanned');
    }

    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname) || PRIVATE_RANGES.some((range) => range.test(hostname))) {
      throw new InvalidTargetError('That host is not reachable from the scanner');
    }
    if (!hostname.includes('.')) {
      throw new InvalidTargetError('That does not look like a public hostname');
    }

    return url;
  }
}
