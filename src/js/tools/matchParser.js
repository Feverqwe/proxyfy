import _escapeRegExp from "lodash.escaperegexp";

const debug = require('debug')('matchParser');
const ip6addr = require('ip6addr');

const any = {};

const getScheme = scheme => {
  if (!scheme) {
    return '[^:]+:\/\/';
  }
  return _escapeRegExp(scheme.toLowerCase()) + ':\/\/';
};

const getPort = port => {
  if (!port) {
    return '';
  }
  if (port === any) {
    return '(?::\\\d+)?';
  }
  return _escapeRegExp(':' + port);
};

const ipToRePatten = (scheme, ip, port, isIpv6) => {
  if (isIpv6) {
    ip = `[${ip}]`;
  }
  return '^' + getScheme(scheme) + _escapeRegExp(ip) + getPort(port) + '$';
};

const hostnameToRePatten = (scheme, hostname, port) => {
  return '^' + getScheme(scheme) + _escapeRegExp(hostname.toLowerCase()).replace(/\\\*/g, '.+') + getPort(port) + '$';
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
  let forceAnyPort = false;

  if (pattern === '<local>') {
    patterns.push('127.0.0.1');
    patterns.push('[::1]');
    patterns.push('localhost');
    forceAnyPort = true;
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
      const m = /^(?:([^:]+):\/\/)?(?:(.+):([0-9]+)|(.+))$/.exec(pattern);
      if (m) {
        const scheme = m[1];
        const hostnameOrIpLiteral = m[2] || m[4];
        const port = forceAnyPort ? any : m[3];
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
          const hostnameList = [hostnameOrIpLiteral];
          if (/^\*\./.test(hostnameOrIpLiteral)) {
            hostnameList.push(hostnameOrIpLiteral.substr(2));
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