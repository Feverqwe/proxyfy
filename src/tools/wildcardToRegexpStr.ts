import escapeStringRegexp from 'escape-string-regexp';

function wildcardToRegexpStr(pattern: string) {
  const patterns = [];
  const m = /^(.+\/)?([^/]+)$/.exec(pattern);
  if (m) {
    const scheme = m[1] || '*://';
    const hostname = m[2];

    if (/^\*\*\./.test(hostname)) {
      patterns.push(scheme + hostname.slice(1));
    } else if (/^\*\./.test(hostname)) {
      patterns.push(scheme + hostname);
      patterns.push(scheme + hostname.slice(2));
    } else {
      patterns.push(scheme + hostname);
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
