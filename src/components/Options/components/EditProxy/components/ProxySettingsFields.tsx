import React, {useCallback} from 'react';

import {Box, Grid, MenuItem, Typography} from '@mui/material';
import {Field, useForm} from 'react-final-form';

import {DirectProxyType, GenericProxyType} from '../../../../../tools/index';
import {MyInput, MySelect} from '../../../../index';
import {authProxyTypes, noProxyTypes} from '../constants';
import {parseProxyAddress} from '../proxyForm';
import type {ProxyFormValues} from '../types';

interface ProxySettingsFieldsProps {
  type: string;
}

const ProxySettingsFields: React.FC<ProxySettingsFieldsProps> = ({type}) => {
  const form = useForm<ProxyFormValues>();
  const applyAddress = useCallback(
    (value: string) => {
      const parsed = parseProxyAddress(value);
      if (!parsed) return false;

      const targetType = parsed.type || type;
      form.batch(() => {
        form.change('host', parsed.host);
        if (parsed.type) form.change('type', parsed.type);
        if (parsed.port) form.change('port', parsed.port);
        if (authProxyTypes.includes(targetType as GenericProxyType)) {
          if (parsed.username !== undefined) form.change('username', parsed.username);
          if (parsed.password !== undefined) form.change('password', parsed.password);
        }
      });
      return true;
    },
    [form, type],
  );

  return (
    <Box component="section" aria-labelledby="connection-heading">
      <Typography id="connection-heading" component="h2" variant="h6" sx={{mb: 0.5}}>
        Connection
      </Typography>
      <Grid container columnSpacing={1.5}>
        <Grid size={{xs: 12, sm: 4}}>
          <Field<string, HTMLElement, ProxyFormValues> name="type">
            {({input}) => (
              <MySelect label="Type" {...input}>
                <MenuItem value="http">HTTP</MenuItem>
                <MenuItem value="https">HTTPS</MenuItem>
                <MenuItem value="socks4">SOCKS4</MenuItem>
                <MenuItem value="socks5">SOCKS5</MenuItem>
                <MenuItem value="quic">QUIC</MenuItem>
                <MenuItem value="direct">Direct (no proxy)</MenuItem>
              </MySelect>
            )}
          </Field>
        </Grid>
        {!noProxyTypes.includes(type as DirectProxyType) && (
          <>
            <Grid size={{xs: 12, sm: 6}}>
              <Field<string, HTMLInputElement, ProxyFormValues> name="host">
                {({input, meta}) => (
                  <MyInput
                    label="Address"
                    placeholder="http://proxy.example.com:3128"
                    helperText="Accepts host:port or a full proxy URL"
                    isError={Boolean(meta.error && (meta.touched || meta.submitFailed))}
                    errorMessage={meta.error}
                    name={input.name}
                    value={input.value}
                    onBlur={() => {
                      applyAddress(input.value);
                      input.onBlur();
                    }}
                    onFocus={() => input.onFocus()}
                    onChange={(event) => input.onChange(event.target.value)}
                    onPaste={(event) => {
                      const pastedValue = event.clipboardData.getData('text');
                      if (applyAddress(pastedValue)) event.preventDefault();
                    }}
                  />
                )}
              </Field>
            </Grid>
            <Grid size={{xs: 12, sm: 2}}>
              <Field<string, HTMLInputElement, ProxyFormValues> name="port">
                {({input, meta}) => (
                  <MyInput
                    label="Port"
                    placeholder="3128"
                    isError={Boolean(meta.error && (meta.touched || meta.submitFailed))}
                    errorMessage={meta.error}
                    type="number"
                    name={input.name}
                    value={input.value}
                    onBlur={() => input.onBlur()}
                    onFocus={() => input.onFocus()}
                    onChange={(event) => input.onChange(event.target.value)}
                  />
                )}
              </Field>
            </Grid>
          </>
        )}
      </Grid>
      {!noProxyTypes.includes(type as DirectProxyType) &&
        authProxyTypes.includes(type as GenericProxyType) && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{mt: 1, mb: 0.25}}>
              Authentication (optional)
            </Typography>
            <Grid container columnSpacing={1.5}>
              <Grid size={{xs: 12, sm: 6}}>
                <Field<string, HTMLInputElement, ProxyFormValues> name="username">
                  {({input}) => (
                    <MyInput
                      label="Username"
                      name={input.name}
                      value={input.value}
                      onBlur={() => input.onBlur()}
                      onFocus={() => input.onFocus()}
                      onChange={(event) => input.onChange(event.target.value)}
                    />
                  )}
                </Field>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Field<string, HTMLInputElement, ProxyFormValues> name="password">
                  {({input}) => (
                    <MyInput
                      label="Password"
                      type="password"
                      name={input.name}
                      value={input.value}
                      onBlur={() => input.onBlur()}
                      onFocus={() => input.onFocus()}
                      onChange={(event) => input.onChange(event.target.value)}
                    />
                  )}
                </Field>
              </Grid>
            </Grid>
          </>
        )}
    </Box>
  );
};

export default ProxySettingsFields;
