import React, {FC, useCallback} from 'react';
import {Box, Divider, List, ListItem, ListItemButton, ListItemText, Paper} from '@mui/material';
import {styled} from '@mui/system';
import useActualState from '../useActualState';
import useActualProxies from '../useActualProxies';
import {ConfigProxy, GenericProxy} from '../../tools/ConfigStruct';
import {AUTH_SUPPORTED} from '../../constants';

const MyListItemButton = styled(ListItemButton)({
  '&.active': {
    color: '#fff',
    backgroundColor: '#007bff',
    '&:hover': {
      color: '#fff',
      backgroundColor: '#007bff',
    },
  },
});

interface Item {
  id?: string;
  title: string;
  mode: string;
}

const defaultItems = [
  {title: 'Use enabled proxies by patterns and order', mode: 'pac_script'},
  /* {title: 'Off (use auto detect)', mode: 'auto_detect'}, */
  {title: 'Off (use system settings)', mode: 'system'},
];

const Popup = () => {
  const state = useActualState();
  const proxies = useActualProxies();

  const handleClick = useCallback(async (mode, item: Item | ConfigProxy) => {
    const {id} = item;

    if (AUTH_SUPPORTED && (item as GenericProxy).username) {
      try {
        await chrome.permissions.request({
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['<all_urls>'],
        });
      } catch (err) {
        console.error('Unable request auth permissions: %O', err);
      }
    }

    try {
      await chrome.runtime.sendMessage({
        action: 'set',
        mode,
        id,
      });
    } catch (err) {
      console.error('Set proxy error: %O', err);
    }
  }, []);

  if (!proxies) return null;

  return (
    <Box component={Paper} elevation={0} square minWidth={350}>
      <List component="nav" disablePadding>
        {defaultItems.map((item, index) => {
          const checked = Boolean(state?.mode === item.mode);
          return (
            <ProxyItem
              key={index}
              item={item}
              checked={checked}
              mode={item.mode}
              onClick={handleClick}
            />
          );
        })}
        {proxies.map((item) => {
          const checked = Boolean(state?.id === item.id);
          return (
            <ProxyItem
              key={`_${item.id}`}
              item={item}
              checked={checked}
              mode="fixed_servers"
              onClick={handleClick}
            />
          );
        })}
        <Divider />
        <ListItem button component="a" href="./options.html" target="_blank">
          <ListItemText primary="Options" />
        </ListItem>
      </List>
    </Box>
  );
};

interface ProxyItemProps {
  item: Item | ConfigProxy;
  mode: string;
  checked: boolean;
  onClick: (mode: string, item: Item | ConfigProxy) => void;
}

const ProxyItem: FC<ProxyItemProps> = ({item, mode, checked, onClick}) => {
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      onClick(mode, item);
    },
    [item, mode, onClick],
  );

  const classNames = [];
  if (checked) {
    classNames.push('active');
  }

  return (
    <MyListItemButton onClick={handleClick} className={classNames.join(' ')}>
      <ListItemText primary={item.title} />
    </MyListItemButton>
  );
};

export default Popup;
