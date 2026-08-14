import {ProxyPattern, ProxyPatternType, getId} from '../../../../../tools/index';

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

export function addPattern(
  patterns: ProxyPattern[],
  {
    name = '',
    pattern = '',
    type = ProxyPatternType.Wildcard,
  }: Partial<Pick<ProxyPattern, 'name' | 'pattern' | 'type'>> = {},
  createId: () => string = getId,
): ProxyPattern[] {
  return [
    ...patterns,
    {
      id: createId(),
      enabled: true,
      name,
      pattern,
      type,
    },
  ];
}

export function updatePattern(
  patterns: ProxyPattern[],
  patternId: string | undefined,
  changes: Partial<Omit<ProxyPattern, 'id'>>,
): ProxyPattern[] {
  return patterns.map((pattern) => (pattern.id === patternId ? {...pattern, ...changes} : pattern));
}

export function removePattern(
  patterns: ProxyPattern[],
  patternId: string | undefined,
): ProxyPattern[] {
  return patterns.filter((pattern) => pattern.id !== patternId);
}

export function copyPattern(
  patterns: ProxyPattern[],
  patternId: string | undefined,
  createId: () => string = getId,
): ProxyPattern[] {
  const index = patterns.findIndex((pattern) => pattern.id === patternId);
  if (index === -1) return patterns;

  const result = patterns.slice();
  result.splice(index + 1, 0, clonePattern(patterns[index], createId));
  return result;
}

export function placePattern(
  patterns: ProxyPattern[],
  patternId: string | undefined,
  targetPatternId: string | undefined,
  position: 'before' | 'after',
): ProxyPattern[] {
  const sourceIndex = patterns.findIndex((pattern) => pattern.id === patternId);
  const targetIndex = patterns.findIndex((pattern) => pattern.id === targetPatternId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return patterns;

  const result = patterns.slice();
  const [pattern] = result.splice(sourceIndex, 1);
  const adjustedTargetIndex = targetIndex - (sourceIndex < targetIndex ? 1 : 0);
  const insertionIndex = adjustedTargetIndex + (position === 'after' ? 1 : 0);
  result.splice(insertionIndex, 0, pattern);
  return result;
}
