import React, {FC, useCallback, useMemo, useState} from 'react';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import SettingsEthernetRoundedIcon from '@mui/icons-material/SettingsEthernetRounded';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import {AUTH_SUPPORTED} from '../../constants';
import type {ProxyMode} from '../../domain/proxy/proxyState';
import {selectProxy} from '../../services/runtime/runtimeClient';
import {ConfigProxy} from '../../tools/index';
import type {MenuItem} from '../../types/index';
import {useActualProxies, useActualState} from '../index';

const defaultItems: MenuItem[] = [
  {title: 'Automatic routing', mode: 'pac_script'},
  {title: 'System settings', mode: 'system'},
];

const Popup = () => {
  const state = useActualState();
  const proxies = useActualProxies();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTitle = useMemo(() => {
    if (!state) return 'Browser settings';
    if (state.mode === 'pac_script') return 'Automatic routing';
    if (state.mode === 'system') return 'System settings';
    return proxies?.find(({id}) => id === state.id)?.title || 'Direct connection';
  }, [proxies, state]);

  const handleClick = useCallback(async (mode: ProxyMode, item: MenuItem | ConfigProxy) => {
    const {id} = item;
    const key = id || mode;
    setPendingKey(key);
    setError(null);

    try {
      if (AUTH_SUPPORTED && 'username' in item && item.username) {
        const granted = await chrome.permissions.request({
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['<all_urls>'],
        });
        if (!granted) {
          setError('Permission is required to use this proxy login.');
          return;
        }
      }

      await selectProxy(mode, id);
    } catch (err) {
      console.error('Set proxy error: %O', err);
      setError('Could not switch the connection. Try again.');
    } finally {
      setPendingKey(null);
    }
  }, []);

  const isLoading = proxies === null;

  return (
    <Box sx={{width: 372, bgcolor: 'background.paper', overflow: 'hidden'}}>
      <Box
        component="header"
        sx={{
          position: 'relative',
          px: 2.25,
          pt: 2.25,
          pb: 2,
          bgcolor: '#15263a',
          color: '#fff',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 30,
            width: 1,
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.12)',
            boxShadow: '12px 0 0 rgba(255,255,255,0.06), 24px 0 0 rgba(255,255,255,0.03)',
          },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{alignItems: 'center'}}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: '11px',
              bgcolor: 'rgba(126, 164, 255, 0.16)',
              color: '#9ab7ff',
            }}
          >
            <RouteRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="overline" sx={{color: '#9ab7ff'}}>
              Current route
            </Typography>
            <Typography variant="h6" sx={{lineHeight: 1.25}}>
              {activeTitle}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{m: 1.5, mb: 0}}>
          {error}
        </Alert>
      )}

      <Box sx={{px: 1.25, pt: 1.5}}>
        <Typography variant="overline" color="text.secondary" sx={{px: 1}}>
          Routing mode
        </Typography>
        <List component="nav" aria-label="Proxy routing" disablePadding sx={{mt: 0.5}}>
          {isLoading
            ? Array.from({length: 4}).map((_, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  sx={{p: 1.25, alignItems: 'center'}}
                >
                  <Skeleton variant="circular" width={30} height={30} />
                  <Box sx={{flex: 1}}>
                    <Skeleton width={`${62 + index * 6}%`} />
                    <Skeleton width="42%" />
                  </Box>
                </Stack>
              ))
            : defaultItems.map((item) => (
                <ProxyItem
                  key={item.mode}
                  item={item}
                  checked={state?.mode === item.mode}
                  mode={item.mode}
                  pending={pendingKey === item.mode}
                  disabled={Boolean(pendingKey)}
                  onClick={handleClick}
                />
              ))}
        </List>
      </Box>

      {!isLoading && proxies.length > 0 && (
        <Box sx={{px: 1.25, pt: 1}}>
          <Typography variant="overline" color="text.secondary" sx={{px: 1}}>
            Saved connections
          </Typography>
          <List component="nav" aria-label="Saved proxy connections" disablePadding sx={{mt: 0.5}}>
            {proxies.map((item) => (
              <ProxyItem
                key={item.id}
                item={item}
                checked={state?.id === item.id}
                mode="fixed_servers"
                pending={pendingKey === item.id}
                disabled={Boolean(pendingKey)}
                onClick={handleClick}
              />
            ))}
          </List>
        </Box>
      )}

      {!isLoading && proxies.length === 0 && (
        <Box sx={{mx: 2.25, my: 1.5, p: 2, borderRadius: 2, bgcolor: 'background.default'}}>
          <Typography variant="body2" sx={{fontWeight: 600}}>
            No saved connections
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add a proxy in settings to switch to it here.
          </Typography>
        </Box>
      )}

      <Divider sx={{mt: 1}} />
      <List disablePadding>
        <ListItemButton href="./options.html" target="_blank" sx={{px: 2.25, py: 1.35}}>
          <ListItemIcon sx={{minWidth: 38}}>
            <SettingsEthernetRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Manage connections"
            slotProps={{primary: {sx: {fontWeight: 600, fontSize: '0.9rem'}}}}
          />
          <OpenInNewRoundedIcon sx={{fontSize: 17, color: 'text.secondary'}} />
        </ListItemButton>
      </List>
    </Box>
  );
};

interface ProxyItemProps {
  item: MenuItem | ConfigProxy;
  mode: ProxyMode;
  checked: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: (mode: ProxyMode, item: MenuItem | ConfigProxy) => void;
}

const ProxyItem: FC<ProxyItemProps> = ({item, mode, checked, pending, disabled, onClick}) => {
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onClick(mode, item);
    },
    [item, mode, onClick],
  );
  const isProxy = 'type' in item;
  const detail = isProxy
    ? item.type === 'direct'
      ? 'No proxy server'
      : `${item.type.toUpperCase()} · ${item.host}:${item.port}`
    : mode === 'pac_script'
      ? 'Match rules in priority order'
      : 'Use your browser configuration';

  return (
    <ListItemButton
      onClick={handleClick}
      selected={checked}
      disabled={disabled}
      aria-current={checked ? 'true' : undefined}
      sx={{
        minHeight: 58,
        mb: 0.5,
        borderRadius: 2.25,
        border: '1px solid',
        borderColor: checked ? 'primary.main' : 'transparent',
        '&.Mui-selected': {bgcolor: 'primary.light'},
      }}
    >
      <ListItemIcon sx={{minWidth: 42}}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: '50%',
            color: checked ? 'primary.main' : 'text.secondary',
            bgcolor: isProxy ? item.color : checked ? '#d9e6ff' : 'background.default',
            boxShadow: isProxy ? 'inset 0 0 0 8px rgba(255,255,255,0.78)' : undefined,
          }}
        >
          {!isProxy && <LanOutlinedIcon sx={{fontSize: 17}} />}
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={item.title}
        secondary={detail}
        slotProps={{
          primary: {sx: {fontWeight: checked ? 700 : 600, fontSize: '0.9rem'}},
          secondary: {sx: {fontSize: '0.72rem'}, noWrap: true},
        }}
      />
      {pending ? (
        <CircularProgress size={18} />
      ) : checked ? (
        <CheckRoundedIcon color="primary" fontSize="small" />
      ) : null}
    </ListItemButton>
  );
};

export default Popup;
