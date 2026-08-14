import {DirectProxyType} from '../../tools/ConfigStruct';
import splitMultiPattern from '../../tools/splitMultiPattern';
import wildcardToRegexpStr from '../../tools/wildcardToRegexpStr';

import {PacScript, PacScriptPattern} from './pacTypes';

type RuntimeRule = {
  whiteRe: RegExp | null;
  blackRe: RegExp | null;
  type: string;
  address?: string;
};

function compilePatterns(patterns: PacScriptPattern[]): RegExp | null {
  const regexpPatterns: string[] = [];

  patterns.forEach(({pattern, type}) => {
    const singlePatterns = splitMultiPattern(pattern);
    if (type === 'wildcard') {
      singlePatterns.forEach((singlePattern) => {
        regexpPatterns.push(...wildcardToRegexpStr(singlePattern));
      });
    } else if (type === 'regexp') {
      regexpPatterns.push(...singlePatterns);
    }
  });

  if (!regexpPatterns.length) return null;
  return new RegExp(regexpPatterns.map((value) => `(?:${value})`).join('|'));
}

export function createFindProxyForURL(config: PacScript): (url: string) => string {
  const rules = config.rules.reduce<RuntimeRule[]>((runtimeRules, rule) => {
    try {
      let address;
      if (rule.type !== DirectProxyType.Direct) {
        address = [rule.host, rule.port].join(':');
      }

      let type = rule.type.toUpperCase();
      if (type === 'HTTP') {
        type = 'PROXY';
      }

      runtimeRules.push({
        whiteRe: compilePatterns(rule.whitePatterns),
        blackRe: compilePatterns(rule.blackPatterns),
        type,
        address,
      });
    } catch (_err) {
      // Ignore an invalid rule so a malformed regexp cannot break the mandatory PAC script.
    }

    return runtimeRules;
  }, []);

  const originRe = /^([^:]+:\/\/[^/]+)/;

  return function (url: string) {
    const match = originRe.exec(url);
    if (match) {
      const origin = match[1];
      const currentRule = rules.find((rule) => {
        const inWhitePattern = rule.whiteRe && rule.whiteRe.test(origin);
        const inBlackPattern = rule.blackRe && rule.blackRe.test(origin);
        return !inBlackPattern && inWhitePattern;
      });

      if (currentRule) {
        if (currentRule.type === 'DIRECT') {
          return currentRule.type;
        }
        return `${currentRule.type} ${currentRule.address}`;
      }
    }
    return 'DIRECT';
  };
}
