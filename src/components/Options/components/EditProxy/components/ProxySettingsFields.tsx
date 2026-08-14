import React from 'react';

import {MenuItem} from '@mui/material';
import {Field} from 'react-final-form';

import {DirectProxyType, GenericProxyType} from '../../../../../tools/index';
import {MyInput, MySelect} from '../../../../index';
import {authProxyTypes, noProxyTypes} from '../constants';
import type {ProxyFormValues} from '../types';

interface ProxySettingsFieldsProps {
  type: string;
}

const ProxySettingsFields: React.FC<ProxySettingsFieldsProps> = ({type}) => {
  return (
    <>
      <Field<string, HTMLElement, ProxyFormValues> name="type">
        {({input}) => (
          <MySelect label="Proxy type" {...input}>
            <MenuItem value="http">HTTP</MenuItem>
            <MenuItem value="https">HTTPS</MenuItem>
            <MenuItem value="socks4">SOCKS4</MenuItem>
            <MenuItem value="socks5">SOCKS5</MenuItem>
            <MenuItem value="quic">QUIC</MenuItem>
            <MenuItem value="direct">Direct (no proxy)</MenuItem>
          </MySelect>
        )}
      </Field>
      {!noProxyTypes.includes(type as DirectProxyType) && (
        <>
          <Field<string, HTMLInputElement, ProxyFormValues> name="host">
            {({input, meta}) => (
              <MyInput
                label="Proxy IP address or DNS name"
                placeholder="111.111.111.111, www.example.com"
                isError={Boolean(meta.error && (meta.touched || meta.submitFailed))}
                name={input.name}
                value={input.value}
                onBlur={() => input.onBlur()}
                onFocus={() => input.onFocus()}
                onChange={(event) => input.onChange(event.target.value)}
              />
            )}
          </Field>
          <Field<string, HTMLInputElement, ProxyFormValues> name="port">
            {({input, meta}) => (
              <MyInput
                label="Port"
                placeholder="3128"
                isError={Boolean(meta.error && (meta.touched || meta.submitFailed))}
                type="number"
                name={input.name}
                value={input.value}
                onBlur={() => input.onBlur()}
                onFocus={() => input.onFocus()}
                onChange={(event) => input.onChange(event.target.value)}
              />
            )}
          </Field>
          {authProxyTypes.includes(type as GenericProxyType) && (
            <>
              <Field<string, HTMLInputElement, ProxyFormValues> name="username">
                {({input}) => (
                  <MyInput
                    label="Username (optional)"
                    placeholder="username"
                    name={input.name}
                    value={input.value}
                    onBlur={() => input.onBlur()}
                    onFocus={() => input.onFocus()}
                    onChange={(event) => input.onChange(event.target.value)}
                  />
                )}
              </Field>
              <Field<string, HTMLInputElement, ProxyFormValues> name="password">
                {({input}) => (
                  <MyInput
                    label="Password (optional)"
                    placeholder="*****"
                    type="password"
                    name={input.name}
                    value={input.value}
                    onBlur={() => input.onBlur()}
                    onFocus={() => input.onFocus()}
                    onChange={(event) => input.onChange(event.target.value)}
                  />
                )}
              </Field>
            </>
          )}
        </>
      )}
    </>
  );
};

export default ProxySettingsFields;
