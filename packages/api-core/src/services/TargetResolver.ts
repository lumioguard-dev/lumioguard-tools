const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'instance-data.ec2.internal',
]);

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
    if (url.username !== '' || url.password !== '') {
      throw new InvalidTargetError('URLs containing credentials cannot be scanned');
    }

    const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
    if (BLOCKED_HOSTNAMES.has(hostname) || isNonPublicIp(hostname)) {
      throw new InvalidTargetError('That host is not reachable from the scanner');
    }
    if (!hostname.includes('.')) {
      throw new InvalidTargetError('That does not look like a public hostname');
    }

    return url;
  }
}

function isNonPublicIp(hostname: string): boolean {
  const bare =
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  const ipv4 = parseIpv4(bare);
  if (ipv4 !== null) return isNonPublicIpv4(ipv4);
  if (!bare.includes(':')) return false;
  const ipv6 = expandIpv6(bare);
  if (ipv6 === null) return true;
  const first = ipv6[0] ?? 0;
  if (ipv6.every((part) => part === 0)) return true;
  if (ipv6.slice(0, 7).every((part) => part === 0) && ipv6[7] === 1) return true;
  if ((first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00)
    return true;
  if (first === 0x2001 && [0x0db8, 0x0002, 0x0010].includes(ipv6[1] ?? -1)) return true;
  if (first === 0x0100 && ipv6.slice(1, 4).every((part) => part === 0)) return true;
  const mapped = ipv6.slice(0, 5).every((part) => part === 0) && ipv6[5] === 0xffff;
  const sixth = ipv6[6] ?? 0;
  const seventh = ipv6[7] ?? 0;
  return mapped ? isNonPublicIpv4([sixth >> 8, sixth & 0xff, seventh >> 8, seventh & 0xff]) : false;
}

type Ipv4 = readonly [number, number, number, number];

function parseIpv4(value: string): Ipv4 | null {
  const parts = value.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const octets = parts.map(Number);
  if (!octets.every((part) => part >= 0 && part <= 255)) return null;
  return [octets[0] ?? 0, octets[1] ?? 0, octets[2] ?? 0, octets[3] ?? 0];
}

function isNonPublicIpv4([a, b, c]: Ipv4): boolean {
  return (
    a === 0 ||
    a === 10 ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function expandIpv6(value: string): number[] | null {
  const halves = value.split('::');
  if (halves.length > 2) return null;
  const left = parseIpv6Parts(halves[0] ?? '');
  const right = parseIpv6Parts(halves[1] ?? '');
  if (left === null || right === null) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function parseIpv6Parts(value: string): number[] | null {
  if (value === '') return [];
  const result: number[] = [];
  for (const part of value.split(':')) {
    const ipv4 = parseIpv4(part);
    if (ipv4 !== null) {
      const [a, b, c, d] = ipv4;
      result.push((a << 8) | b, (c << 8) | d);
    } else if (/^[\da-f]{1,4}$/i.test(part)) result.push(Number.parseInt(part, 16));
    else return null;
  }
  return result;
}
