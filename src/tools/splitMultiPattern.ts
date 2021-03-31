function splitMultiPattern(pattern: string) {
  return pattern.split(/[,\n]/).map(v => v.trim()).filter(v => !/^#/.test(v) && v.length);
}

export default splitMultiPattern;
