import escapeStringRegexp from "escape-string-regexp";

function wildcardToRegexpStr(pattern: string) {
  let patterns = [];
  const m = /^(.+\/)?([^\/]+)$/.exec(pattern);
  if (m) {
    const scheme = m[1] || '';
    const hostname = m[2];

    patterns.push(scheme + hostname);
    if (/^\*\./.test(hostname)) {
      patterns.push(scheme + hostname.substr(2));
    }
  } else {
    patterns.push(pattern);
  }

  return patterns.map((pattern) => {
    const re = escapeStringRegexp(pattern).replace(/\\([*?])/g, '.$1');
    return `^${re}$`;
  });
}

export default wildcardToRegexpStr;
