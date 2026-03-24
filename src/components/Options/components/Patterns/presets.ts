import {ProxyPattern, ProxyPatternType} from '../../../../tools/index';

export const matchAllPresets: ProxyPattern[] = [
  {
    name: 'all URLs',
    pattern: '*',
    type: 'wildcard' as ProxyPatternType,
    enabled: true,
  },
];

export const localhostPresets: ProxyPattern[] = [
  {
    name: 'local hostnames (usually no dots in the name).',
    pattern: '^[^:]+:\/\/(?:localhost|127\.\d+\.\d+\.\d+)(?::\d+)?$',
    type: 'regexp' as ProxyPatternType,
    enabled: true,
  },
  {
    name: 'local subnets (IANA reserved address space).',
    pattern:
      '^[^:]+:\/\/(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2[0-9]|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(?::\d+)?$',
    type: 'regexp' as ProxyPatternType,
    enabled: true,
  },
  {
    name: 'localhost - matches the local host optionally suffixed by a port number. The entire local subnet (127.0.0.0/8) matches.',
    pattern: '^[^:]+:\/\/[\w-]+(?::\d+)?$',
    type: 'regexp' as ProxyPatternType,
    enabled: true,
  },
];
