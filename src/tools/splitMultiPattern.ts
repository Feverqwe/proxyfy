function splitMultiPattern(pattern: string) {
  return pattern
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => !/^#/.test(s))
    .reduce<string[]>((acc, line) => {
      acc.push(
        ...line
          .split(/,/)
          .map((s) => s.trim())
          .filter((s) => s.length),
      );
      return acc;
    }, []);
}

export default splitMultiPattern;
