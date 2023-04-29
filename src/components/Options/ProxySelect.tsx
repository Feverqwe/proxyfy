import React, {FC} from 'react';
import {FormControl, MenuItem, Select, SelectProps} from '@mui/material';
import useActualState from '../useActualState';
import useActualProxies from '../useActualProxies';
import promisifyApi from '../../tools/promisifyApi';

const defaultItems = [
  {title: 'Use enabled proxies by patterns and order', mode: 'pac_script'},
  /* {title: 'Off (use auto detect)', mode: 'auto_detect'}, */
  {title: 'Off (use system settings)', mode: 'system'},
];

const ProxySelect = () => {
  const state = useActualState();
  const proxies = useActualProxies();

  const handleSelect = React.useCallback((e) => {
    const {value} = e.target;
    let id;
    let mode;
    if (['pac_script', 'system'].includes(value)) {
      mode = value;
    } else {
      mode = 'fixed_servers';
      id = value.substr(1);
    }
    promisifyApi('chrome.runtime.sendMessage')({
      action: 'set',
      mode,
      id,
    }).catch((err) => {
      console.error('Set proxy error: %O', err);
    });
  }, []);

  const activeValue = React.useMemo(() => {
    if (!state || !proxies) return '';
    if (['pac_script', 'system'].includes(state.mode)) {
      return state.mode;
    }
    if (state.id) {
      return `_${state.id}`;
    }
    if (!activeValue && state.mode === 'direct') {
      const proxy = proxies.find((p) => p.type === 'direct');
      if (proxy) {
        return `_${proxy.id}`;
      }
    }
    return '';
  }, [state, proxies]);

  if (!proxies) return null;

  return (
    <MySelectNoLabel value={activeValue} onChange={handleSelect}>
      {defaultItems.map((item) => {
        return (
          <MenuItem key={item.mode} value={item.mode}>
            {item.title}
          </MenuItem>
        );
      })}
      {proxies.map((proxy) => {
        return (
          <MenuItem key={proxy.id} value={`_${proxy.id}`}>
            {proxy.title}
          </MenuItem>
        );
      })}
      {activeValue === '' && <MenuItem value="">Unknown</MenuItem>}
    </MySelectNoLabel>
  );
};

type MySelectNoLabelProps = SelectProps;

const mySelectNoLabelStyle = {width: '350px'};
const MySelectNoLabel: FC<MySelectNoLabelProps> = ({children, ...props}) => {
  return (
    <FormControl style={mySelectNoLabelStyle} margin="dense">
      <Select variant="outlined" size="small" {...props}>
        {children}
      </Select>
    </FormControl>
  );
};

export default ProxySelect;
