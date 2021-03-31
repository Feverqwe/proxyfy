import {PacScript} from "./background";
import wildcardToRegexpStr from "./tools/wildcardToRegexpStr";
import splitMultiPattern from "./tools/splitMultiPattern";

declare let FindProxyForURL: (url: string) => string;
declare let Config: PacScript | null;
FindProxyForURL = (function () {
  const config = Config!;
  Config = null;

  const rules = config.rules.map((rule) => {
    const type = rule.type;
    let address;
    const whitePatterns = rule.whitePatterns;
    const blackPatterns = rule.blackPatterns;
    if (rule.type !== 'direct') {
      address = [rule.host, rule.port].join(':');
    }
    const [whiteRe, blackRe] = [whitePatterns, blackPatterns].map((patterns) => {
      const wildcardPatterns: string[] = [];
      const regexpPatterns: string[] = [];
      patterns.forEach(({pattern, type}) => {
        const singlePatterns = splitMultiPattern(pattern);
        if (type === 'wildcard') {
          wildcardPatterns.push(...singlePatterns);
        } else
        if (type === 'regexp') {
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
        re = new RegExp(regexpPatterns.map(v => `(?:${v})`).join('|'));
      }
      return re;
    });

    return {
      whiteRe,
      blackRe,
      type: type.toUpperCase(),
      address,
    };
  });

  const originRe = /^([^:]+:\/\/[^\/]+)/;
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
        } else {
          return `${currentRule.type} ${currentRule.address}`;
        }
      }
    }
    return 'DIRECT';
  };
})();
