import { describe, expect, it } from 'vitest';
import { hostOf, parseAddress } from '../address.js';

function ok(input: string): { address: string; url: string } {
  const result = parseAddress(input);
  if (!result.ok) throw new Error(`expected ${input} to parse, got: ${result.problem}`);
  return { ...result.value };
}

function problem(input: string): string {
  const result = parseAddress(input);
  if (result.ok) throw new Error(`expected ${input} to be rejected, got: ${result.value.address}`);
  return result.problem;
}

describe('reading what was typed', () => {
  it('strips the scheme from what is shown and keeps it for what is fetched', () => {
    expect(ok('https://example.com/')).toEqual({
      address: 'example.com',
      url: 'https://example.com/',
    });
    expect(ok('http://example.com/pricing').address).toBe('example.com/pricing');
    expect(ok('HTTPS://Example.COM').address).toBe('example.com');
  });

  it('accepts a bare host, with or without padding', () => {
    expect(ok('  example.com  ').address).toBe('example.com');
    expect(ok('www.example.com').address).toBe('www.example.com');
    expect(ok('ui.shadcn.com/docs').address).toBe('ui.shadcn.com/docs');
  });

  it('keeps a port and a query, because both change what is served', () => {
    expect(ok('example.com:8080/x').address).toBe('example.com:8080/x');
    expect(ok('example.com/search?q=1').address).toBe('example.com/search?q=1');
  });

  it('refuses a sentence rather than fetching it', () => {
    expect(problem('Pages read')).toBe('A web address cannot contain spaces.');
    expect(problem('how much is this')).toBe('A web address cannot contain spaces.');
  });

  it('refuses a bare word with no domain', () => {
    expect(problem('example')).toBe('That address is missing a domain, like .com.');
  });

  it('refuses schemes that are not the web', () => {
    expect(problem('javascript:alert(1)')).toBe('Only http and https addresses can be read.');
    expect(problem('data:text/html,x')).toBe('Only http and https addresses can be read.');
    expect(problem('ftp://example.com')).toBe('Only http and https addresses can be read.');
    expect(problem('file:///etc/passwd')).toBe('Only http and https addresses can be read.');
  });

  it('refuses nothing at all', () => {
    expect(problem('')).toBe('Enter an address to read.');
    expect(problem('   ')).toBe('Enter an address to read.');
  });

  it('refuses malformed hosts', () => {
    expect(problem('.com')).toBe('That does not look like a web address.');
    expect(problem('example..com')).toBe('That does not look like a web address.');
    expect(problem('exa_mple.com')).toBe('That does not look like a web address.');
  });

  it('allows localhost, which is dotless on purpose', () => {
    expect(ok('localhost:5174').address).toBe('localhost:5174');
  });
});

describe('hostOf', () => {
  it('reads scheme, case, www and path as the same host', () => {
    const forms = [
      'example.com',
      'https://example.com/',
      'https://www.example.com/pricing?ref=x',
      'http://EXAMPLE.com',
    ];
    expect(new Set(forms.map(hostOf)).size).toBe(1);
    expect(hostOf('https://www.example.com/pricing')).toBe('example.com');
  });

  it('still answers for something that is not a URL at all', () => {
    expect(hostOf('not a url')).toBe('not a url');
    expect(hostOf('')).toBe('');
  });
});
