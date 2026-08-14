import {describe, expect, it, vi} from 'vitest';

import {ConfigProxy, DirectProxyType, GenericProxyType} from '../../../../../tools/index';
import {createProxyFormValues, createProxyFromForm, validateProxyForm} from '../proxyForm';

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
