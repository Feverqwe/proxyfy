const ip6addr = require('ip6addr');

const isIp6 = ip => {
  try {
    const addr = ip6addr.parse(ip);
    return addr.kind() === 'ipv6';
  } catch (err) {
    return false;
  }
};

export default isIp6;