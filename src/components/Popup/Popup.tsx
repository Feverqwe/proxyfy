import React, {FC} from 'react';
import {Box, Divider, List, ListItem, ListItemButton, ListItemText, Paper} from '@mui/material';
import {styled} from '@mui/system';
import promisifyApi from '../../tools/promisifyApi';
import useActualState from '../useActualState';
import useActualProxies from '../useActualProxies';
import {ConfigProxy} from '../../tools/ConfigStruct';

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

const Popup = React.memo(() => {
  const state = useActualState();
  const proxies = useActualProxies();

  const handleClick = React.useCallback((mode, id) => {
    promisifyApi('chrome.runtime.sendMessage')({
      action: 'set',
      mode,
      id,
    }).catch((err) => {
      console.error('Set proxy error: %O', err);
    });
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
});

interface ProxyItemProps {
  item: Item | ConfigProxy;
  mode: string;
  checked: boolean;
  onClick: (mode: string, id?: string) => void;
}

const ProxyItem: FC<ProxyItemProps> = ({item, mode, checked, onClick}) => {
  const handleClick = React.useCallback(
    (e) => {
      e.preventDefault();
      const {id} = item;
      onClick(mode, id);
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
