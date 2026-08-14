import React from 'react';

import {MenuItem} from '@mui/material';

import {DirectProxyType, GenericProxyType} from '../../../../../tools/index';
import {MyInput, MySelect} from '../../../../index';
import {authProxyTypes, noProxyTypes} from '../constants';
import {FieldType} from '../types';

interface ProxySettingsFieldsProps {
  type: string;
  isValidHost: boolean;
  isValidPort: boolean;
  addField: (name: string, options?: {type?: FieldType}) => {name: string; defaultValue?: string};
  handleChangeType: (value: string) => void;
}

const ProxySettingsFields: React.FC<ProxySettingsFieldsProps> = ({
  type,
  isValidHost,
  isValidPort,
  addField,
  handleChangeType,
}) => {
  return (
    <>
      <MySelect
        onChange={(e) => handleChangeType(e.target.value as string)}
        label="Proxy type"
        {...addField('type')}
      >
        <MenuItem value="http">HTTP</MenuItem>
        <MenuItem value="https">HTTPS</MenuItem>
        <MenuItem value="socks4">SOCKS4</MenuItem>
        <MenuItem value="socks5">SOCKS5</MenuItem>
        <MenuItem value="quic">QUIC</MenuItem>
        <MenuItem value="direct">Direct (no proxy)</MenuItem>
      </MySelect>
      {!noProxyTypes.includes(type as DirectProxyType) && (
        <>
          <MyInput
            label="Proxy IP address or DNS name"
            placeholder="111.111.111.111, www.example.com"
            isError={!isValidHost}
            {...addField('host')}
          />
          <MyInput
            label="Port"
            placeholder="3128"
            isError={!isValidPort}
            type="number"
            {...addField('port', {type: FieldType.Number})}
          />
          {authProxyTypes.includes(type as GenericProxyType) && (
            <>
              <MyInput
                label="Username (optional)"
                placeholder="username"
                {...addField('username', {type: FieldType.String})}
              />
              <MyInput
                label="Password (optional)"
                placeholder="*****"
                type="password"
                {...addField('password', {type: FieldType.String})}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default ProxySettingsFields;
