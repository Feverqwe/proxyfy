import {PacScript} from "./background";

declare let FindProxyForURL: (url: string) => string;
declare let Config: PacScript | null;
FindProxyForURL = (function () {
  const config = Config!;
  Config = null;

  const rules = config.rules.map((rule) => {
    const type = rule.type;
    let host;
    let whitePatterns= rule.whitePatterns;
    let blackPatterns= rule.blackPatterns;
    if (rule.type !== 'direct') {
      host = rule.host;
    }
    const [whiteRe, blackRe] = [whitePatterns, blackPatterns].map((patterns) => {
      const wildcardPatterns: string[] = [];
      const regexpPatterns: string[] = [];
      patterns.forEach(({pattern, type}) => {
        if (type === 'wildcard') {
          wildcardPatterns.push(pattern);
        } else
        if (type === 'regexp') {
          regexpPatterns.push(pattern);
        }
      });

      wildcardPatterns.forEach((pattern) => {
        const re = pattern.replace(/([*?])/g, '.$1');
        regexpPatterns.push(re);
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
      host,
    };
  });

  const originRe = /^([^:]+:\/\/[^\/]+)/;
  return function (url: string) {
    const m = originRe.exec(url);
    if (m) {
      const origin = m[1];

      const currentRule = rules.find((rule) => {
        const inWhitePattern = !rule.whiteRe || rule.whiteRe.test(origin);
        const inBlackPattern = rule.blackRe && rule.blackRe.test(origin);
        return !inBlackPattern && inWhitePattern;
      });

      if (currentRule) {
        if (currentRule.type === 'DIRECT') {
          return currentRule.type;
        } else {
          return `${currentRule.type} ${currentRule.host!}`;
        }
      }
    }
    return 'DIRECT';
  };
})();
