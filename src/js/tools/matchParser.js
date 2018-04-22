import _escapeRegExp from "lodash.escaperegexp";

const debug = require('debug')('matchParser');
const ip6addr = require('ip6addr');

const getScheme = scheme => {
  if (!scheme) {
    return '[^:]+:\/\/';
  }
  return _escapeRegExp(scheme) + ':\/\/';
};

const getPort = port => {
  return port ? ':' + _escapeRegExp(port) : '';
};

const ipToRePatten = (scheme, hostname, port) => {
  return '^' + getScheme(scheme) + _escapeRegExp(hostname) + getPort(port) + '$';
};

const hostnameToRePatten = (scheme, hostname, port) => {
  return '^' + getScheme(scheme) + _escapeRegExp(hostname).replace(/\\\*/g, '.*') + getPort(port) + '$';
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
    patterns.push('::1');
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
      const m = /^(?:([^:]+):\/\/)?(.+)(?::([0-9]+))?$/.exec(pattern);
      if (m) {
        m.shift();
        const [scheme, hostnameOrIpLiteral, port] = m;
        const ipAddr = getIpAddr(hostnameOrIpLiteral);
        if (ipAddr) {
          if (ipAddr.kind() === 'ipv4') {
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, ipAddr.toString({format: 'v4'}), port)
            });
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({format: 'v4-mapped'}) + ']', port)
            });
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({zeroElide: false, format: 'v4-mapped'}) + ']', port)
            });
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({
                zeroElide: false,
                zeroPad: true,
                format: 'v4-mapped'
              }) + ']', port)
            });
          } else {
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({format: 'v6'}) + ']', port)
            });
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({zeroElide: false}) + ']', port)
            });
            result.push({
              type: 'regexp',
              pattern: ipToRePatten(scheme, '[' + ipAddr.toString({zeroElide: false, zeroPad: true}) + ']', port)
            });
          }
        } else {
          const hostname = hostnameOrIpLiteral;
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