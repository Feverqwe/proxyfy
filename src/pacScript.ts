import {PacScript} from "./bg";

declare let FindProxyForURL: (url: string) => string;
declare const pacScript: PacScript;
FindProxyForURL = (function () {
  const URL = require('url-parse');
  const escapeStringRegexp = require('escape-string-regexp');

  const config = pacScript;

  const rules = config.rules.map(({scheme, protocol, host, patterns}) => {
    const wildcardPatterns: string[] = [];
    const regexpPatterns: string[] = [];
    patterns.forEach((pattern) => {
      if (pattern.type === 'wildcard') {
        wildcardPatterns.push(pattern.pattern);
      } else
      if (pattern.type === 'regexp') {
        regexpPatterns.push(pattern.pattern);
      }
    });

    wildcardPatterns.forEach((pattern) => {
      const re = escapeStringRegexp(pattern).replace(/\\([*?])/g, '$1');
      regexpPatterns.push(re);
    });

    let re = null;
    if (regexpPatterns.length) {
      re = new RegExp(regexpPatterns.map(v => `(?:${v})`).join('|'));
    }
    return {
      protocol,
      re,
      scheme: scheme.toUpperCase(),
      host,
    };
  });

  return function (url: string) {
    const {protocol, hostname} = new URL(url);

    const currentRule = rules.find((rule) => {
      if (!rule.protocol || rule.protocol === protocol) {
        if (!rule.re || rule.re.test(hostname)) {
          return rule;
        }
      }
    });

    if (currentRule) {
      return `${currentRule.scheme} ${currentRule.host}`;
    } else {
      return 'DIRECT';
    }
  };
})();
