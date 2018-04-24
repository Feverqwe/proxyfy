const ip6addr = require('ip6addr');

const getIpAddrFromHostname = ip => {
  const m = /^\[(.+)\]$|^([\d.]+)$/.exec(ip);
  if (m) {
    ip = m[1] || m[2];
    try {
      return ip6addr.parse(ip);
    } catch (err) {
      return null;
    }
  }
};

export default getIpAddrFromHostname;