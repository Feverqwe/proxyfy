import {describe, expect, it, vi} from 'vitest';

import {ConfigProxy, DirectProxyType, GenericProxyType} from '../../../../../tools/index';
import {
  createProxyFormValues,
  createProxyFromForm,
  parseProxyAddress,
  validateProxyForm,
} from '../proxyForm';

const proxy: ConfigProxy = {
  id: 'office',
  enabled: true,
  title: 'Office',
  color: '#123456',
  badgeText: 'O',
  badgeColor: 'rgba(1,2,3,1)',
  type: GenericProxyType.Http,
  host: 'proxy.example.com',
  port: 8080,
  username: 'alice',
  password: 'secret',
  whitePatterns: [],
  blackPatterns: [],
};

describe('proxy form', () => {
  it('creates editable string values from a proxy', () => {
    expect(createProxyFormValues(proxy)).toMatchObject({
      type: GenericProxyType.Http,
      host: 'proxy.example.com',
      port: '8080',
      username: 'alice',
      enabled: true,
    });
  });

  it('validates server fields only for server proxy types', () => {
    const values = {...createProxyFormValues(proxy), host: '', port: ''};

    expect(validateProxyForm(values)).toEqual({
      host: 'Host is required',
      port: 'Port is required',
    });
    expect(validateProxyForm({...values, type: DirectProxyType.Direct})).toEqual({});
  });

  it('validates the complete port value and range', () => {
    const values = createProxyFormValues(proxy);

    expect(validateProxyForm({...values, port: '70000'})).toEqual({
      port: 'Enter a port from 1 to 65535',
    });
    expect(validateProxyForm({...values, port: '8080abc'})).toEqual({
      port: 'Enter a port from 1 to 65535',
    });
  });

  it('rejects an address that could not be normalized', () => {
    const values = createProxyFormValues(proxy);

    expect(validateProxyForm({...values, host: 'ftp://proxy.example.com:21'})).toEqual({
      host: 'Enter a valid proxy address',
    });
    expect(validateProxyForm({...values, host: 'proxy.example.com:abc'})).toEqual({
      host: 'Enter a valid proxy address',
    });
    expect(validateProxyForm({...values, host: '[2001:db8::1]'})).toEqual({});
  });

  it.each([
    ['proxy.example.com', {host: 'proxy.example.com'}],
    ['proxy.example.com:8080', {host: 'proxy.example.com', port: '8080'}],
    [
      'https://alice:my%20password@proxy.example.com',
      {
        type: GenericProxyType.Https,
        host: 'proxy.example.com',
        port: '443',
        username: 'alice',
        password: 'my password',
      },
    ],
    ['socks5://127.0.0.1:1081', {type: GenericProxyType.Socks5, host: '127.0.0.1', port: '1081'}],
    [
      'socks://proxy.example.com',
      {type: GenericProxyType.Socks5, host: 'proxy.example.com', port: '1080'},
    ],
    ['[2001:db8::1]:8080', {host: '2001:db8::1', port: '8080'}],
    ['2001:db8::1', {host: '2001:db8::1'}],
  ])('parses a proxy address from %s', (value, expected) => {
    expect(parseProxyAddress(value)).toEqual(expected);
  });

  it('leaves unsupported and malformed proxy URLs untouched', () => {
    expect(parseProxyAddress('ftp://proxy.example.com:21')).toBeNull();
    expect(parseProxyAddress('http://')).toBeNull();
  });

  it('creates a new proxy with selected presets and credentials', () => {
    const createId = vi
      .fn<() => string>()
      .mockReturnValueOnce('match-all')
      .mockReturnValueOnce('localhost-1')
      .mockReturnValueOnce('localhost-2')
      .mockReturnValueOnce('localhost-3')
      .mockReturnValueOnce('new-proxy');
    const values = {
      ...createProxyFormValues(proxy),
      title: '',
      useLocalhostPreset: true,
    };

    const result = createProxyFromForm(proxy, values, true, createId);

    expect(result).toMatchObject({
      id: 'new-proxy',
      title: 'proxy.example.com:8080',
      username: 'alice',
      password: 'secret',
    });
    expect(result.whitePatterns).toHaveLength(1);
    expect(result.blackPatterns).toHaveLength(3);
  });

  it('creates a direct proxy without server-only fields', () => {
    const result = createProxyFromForm(
      proxy,
      {...createProxyFormValues(proxy), type: DirectProxyType.Direct, title: ''},
      false,
    );

    expect(result).toMatchObject({id: 'office', type: DirectProxyType.Direct, title: 'Direct'});
    expect(result).not.toHaveProperty('host');
    expect(result).not.toHaveProperty('port');
    expect(result).not.toHaveProperty('username');
  });
});
