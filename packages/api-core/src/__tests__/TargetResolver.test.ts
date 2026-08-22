import { describe, expect, it } from 'vitest';
import { InvalidTargetError, TargetResolver } from '../services/TargetResolver.js';

/**
 * The server-side request boundary.
 *
 * Both Workers fetch whatever this returns, so every case below is a request
 * the scanner must refuse to make on a stranger's behalf. A regression here
 * does not break a scan: it turns a public scanner into a probe for whatever
 * sits next to it on the network, and nothing on screen looks wrong.
 */

const resolver = new TargetResolver();

describe('TargetResolver: what it refuses', () => {
  // Cloud metadata is the classic SSRF prize: on several providers it answers
  // an unauthenticated GET with credentials.
  it.each([
    ['metadata.google.internal', 'GCP metadata'],
    ['localhost', 'the scanner itself'],
    ['127.0.0.1', 'loopback'],
    ['0.0.0.0', 'all interfaces'],
    ['[::1]', 'IPv6 loopback'],
  ])('refuses %s (%s)', (host) => {
    expect(() => resolver.resolve(`https://${host}/`)).toThrow(InvalidTargetError);
  });

  it.each([
    ['10.0.0.1', 'RFC1918 /8'],
    ['192.168.1.1', 'RFC1918 /16'],
    ['172.16.0.1', 'RFC1918 /12 lower bound'],
    ['172.31.255.254', 'RFC1918 /12 upper bound'],
    ['169.254.169.254', 'link-local, the AWS metadata address'],
    ['127.1.2.3', 'the rest of loopback, not just 127.0.0.1'],
    ['100.64.0.1', 'carrier-grade NAT'],
    ['192.0.2.1', 'documentation range'],
    ['198.51.100.1', 'documentation range'],
    ['203.0.113.1', 'documentation range'],
    ['224.0.0.1', 'multicast'],
  ])('refuses the private address %s (%s)', (host) => {
    expect(() => resolver.resolve(`https://${host}/`)).toThrow(InvalidTargetError);
  });

  it.each(['[fc00::1]', '[fe80::1]', '[ff02::1]', '[::ffff:127.0.0.1]', '[2001:db8::1]'])(
    'refuses the non-public IPv6 address %s',
    (host) => expect(() => resolver.resolve(`https://${host}/`)).toThrow(InvalidTargetError),
  );

  it('refuses a blocked hostname with a trailing root dot', () => {
    expect(() => resolver.resolve('https://localhost./')).toThrow(InvalidTargetError);
  });

  // 172.15 and 172.32 sit OUTSIDE the private /12; refusing them would be a
  // bug in the other direction, and the range regex is easy to get wrong.
  it.each(['172.15.0.1', '172.32.0.1'])(
    'still allows %s, which is outside the private /12',
    (host) => {
      expect(() => resolver.resolve(`https://${host}/`)).not.toThrow();
    },
  );

  // file: reads the Worker's own filesystem; gopher: and friends are the
  // classic protocol-smuggling vectors.
  it.each([
    'file:///etc/passwd',
    'ftp://example.com/',
    'gopher://example.com/',
    'data:text/html,hi',
  ])('refuses the scheme in %s', (raw) => {
    expect(() => resolver.resolve(raw)).toThrow(InvalidTargetError);
  });

  it('refuses a bare hostname with no dot, which cannot be public', () => {
    expect(() => resolver.resolve('intranet')).toThrow(InvalidTargetError);
  });

  it.each(['', '   ', '\t\n'])('refuses empty input (%j)', (raw) => {
    expect(() => resolver.resolve(raw)).toThrow(InvalidTargetError);
  });

  it('refuses something that is not a URL at all', () => {
    expect(() => resolver.resolve('http://')).toThrow(InvalidTargetError);
  });

  it('refuses credentials embedded in a URL', () => {
    expect(() => resolver.resolve('https://user:secret@example.com')).toThrow(InvalidTargetError);
  });

  // Case is not a way past the list.
  it.each(['LOCALHOST', 'LocalHost', 'METADATA.GOOGLE.INTERNAL'])(
    'refuses %s regardless of case',
    (host) => {
      expect(() => resolver.resolve(`https://${host}/`)).toThrow(InvalidTargetError);
    },
  );
});

describe('TargetResolver: what it accepts', () => {
  it('adds https to a bare host, because that is what people paste', () => {
    expect(resolver.resolve('example.com').toString()).toBe('https://example.com/');
  });

  it('keeps an explicit scheme rather than rewriting it', () => {
    expect(resolver.resolve('http://example.com/').protocol).toBe('http:');
  });

  it('keeps the path, query and port it was given', () => {
    const url = resolver.resolve('https://example.com:8443/a/b?c=d');
    expect(url.pathname).toBe('/a/b');
    expect(url.search).toBe('?c=d');
    expect(url.port).toBe('8443');
  });

  it('trims whitespace a paste picked up', () => {
    expect(resolver.resolve('  example.com  ').hostname).toBe('example.com');
  });

  it('accepts a subdomain and a long TLD', () => {
    expect(resolver.resolve('app.example.co.uk').hostname).toBe('app.example.co.uk');
  });

  it('throws InvalidTargetError specifically, which the API maps to a 400', () => {
    expect(() => resolver.resolve('localhost')).toThrow(InvalidTargetError);
    try {
      resolver.resolve('localhost');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTargetError);
      expect((error as InvalidTargetError).name).toBe('InvalidTargetError');
    }
  });
});
