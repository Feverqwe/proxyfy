import {ProxyPattern, splitMultiPattern} from '../../../../../tools/index';

export function isValidPattern(value: string, type: string) {
  if (type === 'wildcard') return true;
  let result = true;
  try {
    splitMultiPattern(value).forEach((v: string) => new RegExp(`(?:${v})`));
  } catch {
    result = false;
  }
  return result;
}

export function arePatternsValid(patterns: ProxyPattern[]): boolean {
  return patterns.every(({enabled, pattern, type}) => !enabled || isValidPattern(pattern, type));
}
