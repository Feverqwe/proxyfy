import wildcardToRegexpStr from '../wildcardToRegexpStr';

describe('wildcardToRegexpStr', () => {
  test('all', () => {
    const results = wildcardToRegexpStr('*');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  test('subdomain and domain', () => {
    const results = wildcardToRegexpStr('*.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  test('domain only', () => {
    const results = wildcardToRegexpStr('test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(false);
  });

  test('subdomain only', () => {
    const results = wildcardToRegexpStr('**.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(false);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  test('protocol subdomain and domain', () => {
    const results = wildcardToRegexpStr('*://*.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  test('protocol domain only', () => {
    const results = wildcardToRegexpStr('*://test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(false);
  });

  test('protocol subdomain only', () => {
    const results = wildcardToRegexpStr('*://**.test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(false);
    expect(new RegExp(results.join('|')).test('http://a.test.com')).toBe(true);
  });

  test('http protocol only', () => {
    const results = wildcardToRegexpStr('http://test.com');

    console.log(results);

    expect(results).toMatchSnapshot();
    expect(new RegExp(results.join('|')).test('http://test.com')).toBe(true);
    expect(new RegExp(results.join('|')).test('ws://test.com')).toBe(false);
  });
});
