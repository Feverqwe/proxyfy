import {PacScript} from './background';
import wildcardToRegexpStr from './tools/wildcardToRegexpStr';
import splitMultiPattern from './tools/splitMultiPattern';
import {DirectProxyType} from './tools/ConfigStruct';

/* eslint-disable prefer-const */
declare let FindProxyForURL: (url: string) => string;
declare let Config: PacScript | null;
// eslint-disable-next-line func-names
FindProxyForURL = (function () {
  const config = Config!;
  Config = null;

  const rules = config.rules.map((rule) => {
    const {type} = rule;
    let address;
    const {whitePatterns} = rule;
    const {blackPatterns} = rule;
    if (rule.type !== DirectProxyType.Direct) {
      address = [rule.host, rule.port].join(':');
    }
    const [whiteRe, blackRe] = [whitePatterns, blackPatterns].map((patterns) => {
      const wildcardPatterns: string[] = [];
      const regexpPatterns: string[] = [];
      patterns.forEach(({pattern, type}) => {
        const singlePatterns = splitMultiPattern(pattern);
        if (type === 'wildcard') {
          wildcardPatterns.push(...singlePatterns);
        } else if (type === 'regexp') {
          regexpPatterns.push(...singlePatterns);
        }
      });

      wildcardPatterns.forEach((pattern) => {
        wildcardToRegexpStr(pattern).forEach((reStr) => {
          regexpPatterns.push(reStr);
        });
      });

      let re = null;
      if (regexpPatterns.length) {
        re = new RegExp(regexpPatterns.map((v) => `(?:${v})`).join('|'));
      }
      return re;
    });

    let chType = type.toUpperCase();
    if (chType === 'HTTP') {
      chType = 'PROXY';
    }

    return {
      whiteRe,
      blackRe,
      type: chType,
      address,
    };
  });

  const originRe = /^([^:]+:\/\/[^/]+)/;
  // eslint-disable-next-line func-names
  return function (url: string) {
    const m = originRe.exec(url);
    if (m) {
      const origin = m[1];

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
})();
