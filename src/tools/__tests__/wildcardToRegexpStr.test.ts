import {describe, it, expect} from 'vitest';
import wildcardToRegexpStr from '../wildcardToRegexpStr';

describe('wildcardToRegexpStr', () => {
  it('all', () => {
    const results = wildcardToRegexpStr('*');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  it('subdomain and domain', () => {
    const results = wildcardToRegexpStr('*.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  it('domain only', () => {
    const results = wildcardToRegexpStr('test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(false);
  });

  it('subdomain only', () => {
    const results = wildcardToRegexpStr('**.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(false);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  it('protocol subdomain and domain', () => {
    const results = wildcardToRegexpStr('*://*.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  it('protocol domain only', () => {
    const results = wildcardToRegexpStr('*://test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(false);
  });

  it('protocol subdomain only', () => {
    const results = wildcardToRegexpStr('*://**.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(false);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  it('http protocol only', () => {
    const results = wildcardToRegexpStr('http://test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('ws://test.com')).toBe(false);
  });
});
