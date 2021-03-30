import wildcardToRegexpStr from "../wildcardToRegexpStr";

describe('wildcardToRegexpStr', () => {
  test('a', () => {
    const result = wildcardToRegexpStr('*.test.com');

    console.log(result);

    expect(result).toMatchSnapshot();
  });

  test('b', () => {
    const result = wildcardToRegexpStr('*://*.test.com');

    console.log(result);

    expect(result).toMatchSnapshot();
  });

  test('c', () => {
    const result = wildcardToRegexpStr('*://*test.com');

    console.log(result);

    expect(result).toMatchSnapshot();
  });

  test('d', () => {
    const result = wildcardToRegexpStr('*test.com');

    console.log(result);

    expect(result).toMatchSnapshot();
  });
});
