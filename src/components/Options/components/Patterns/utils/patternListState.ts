import {ProxyPattern, getId} from '../../../../../tools/index';

export function initializePatterns(
  patterns: ProxyPattern[],
  createId: () => string = getId,
): ProxyPattern[] {
  return patterns.map((pattern) => ({
    ...pattern,
    id: pattern.id || createId(),
  }));
}

export function clonePattern(pattern: ProxyPattern, createId: () => string = getId): ProxyPattern {
  return {
    ...pattern,
    id: createId(),
  };
}
