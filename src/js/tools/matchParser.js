import _escapeRegExp from "lodash.escaperegexp";

const debug = require('debug')('matchParser');
const ip6addr = require('ip6addr');
const required = require('requires-port');

const getScheme = scheme => {
  if (!scheme || scheme === '*:') {
    return '[^:]+:\/\/';
  }
  return _escapeRegExp(scheme.toLowerCase()) + '\/\/';
};

const getPort = (port, scheme) => {
  if (!port) {
    return '(?::\\\d+)?';
  }
  if (scheme && !required(port, scheme)) {
    return '';
  }
  return _escapeRegExp(':' + port);
};

const ipToRePatten = (scheme, ip, port, isIpv6) => {
  if (isIpv6) {
    ip = `[${ip}]`;
  }
  return '^' + getScheme(scheme) + _escapeRegExp(ip) + getPort(port, scheme) + '$';
};

const hostnameToRePatten = (scheme, hostname, port) => {
  return '^' + getScheme(scheme) + _escapeRegExp(hostname.toLowerCase()).replace(/\\\*/g, '.+') + getPort(port, scheme) + '$';
};

const getIpAddr = ipLiteral => {
  const m = /^\[(.+)\]$/.exec(ipLiteral);
  if (m) {
    ipLiteral = m[1];
  }
  try {
    return ip6addr.parse(ipLiteral);
  } catch (err) {
    return null;
  }
};

const getCIDR = cidr => {
  try {
    return ip6addr.createCIDR(cidr);
  } catch (err) {
    return null;
  }
};

const matchParser = pattern => {
  const result = [];
  const patterns = [];

  if (pattern === '<local>') {
    patterns.push('127.0.0.1');
    patterns.push('[::1]');
    patterns.push('localhost');
  } else {
    patterns.push(pattern);
  }

  patterns.forEach(pattern => {
    const cidr = getCIDR(pattern);
    if (cidr) {
      result.push({
        type: 'CIDR',
        pattern: pattern
      });
    } else {
      const m = /^(?:([^:]+:)\/\/)?(?:(.+):([0-9]+)|(.+))$/.exec(pattern);
      if (m) {
        const scheme = m[1];
        const hostnameOrIpLiteral = m[2] || m[4];
        const port = m[3];
        const ipAddr = getIpAddr(hostnameOrIpLiteral);
        if (ipAddr) {
          if (ipAddr.kind() === 'ipv4') {
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, ipAddr.toString({format: 'v4'}), port, false)
            });
            [true, false].forEach(zeroElide => {
              [true, false].forEach(zeroPad => {
                result.push({
                  type: 'regexp',
                  pattern: ipToRePatten(scheme, ipAddr.toString({format: 'v4-mapped', zeroElide, zeroPad}), port, true)
                });
              });
            });
          } else {
            [true, false].forEach(zeroElide => {
              [true, false].forEach(zeroPad => {
                result.push({
                  type: 'regexp',
                  pattern: ipToRePatten(scheme, ipAddr.toString({format: 'v6', zeroElide, zeroPad}), port, true)
                });
              });
            });
          }
        } else {
          let hostname = hostnameOrIpLiteral;
          if (/^\./.test(hostname)) {
            hostname = '*' + hostnameOrIpLiteral;
          }
          const hostnameList = [hostname];
          if (/^\*\./.test(hostname)) {
            hostnameList.push(hostname.substr(2));
          }
          hostnameList.forEach(hostname => {
            result.push({
              type: 'regexp',
              pattern: hostnameToRePatten(scheme, hostname, port)
            });
          });
        }
      } else {
        debug('Can\'t parse pattern', pattern);
      }
    }
  });
  return result;
};

export default matchParser;