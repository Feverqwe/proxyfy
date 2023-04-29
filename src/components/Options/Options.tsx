import React, {FC, useCallback, useEffect, useState} from 'react';
import {Box, Button, Checkbox, Grid, Paper} from '@mui/material';
import {Link} from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Header from '../Header';
import getConfig from '../../tools/getConfig';
import ConfigStruct, {ConfigProxy} from '../../tools/ConfigStruct';
import Menu from './Menu';
import ProxySelect from './ProxySelect';
import ColorIcon from './ColorIcon';

const qs = require('querystring-es3');

const STYLE = {
  mainBox: {
    minHeight: '400px',
  },
  menu: {
    width: '250px',
  },
  colorCell: {
    width: '32px',
  },
  enabledCell: {
    width: '300px',
  },
};

interface Scope {
  proxies: ConfigProxy[];
}

const Options: FC = () => {
  const [scope] = useState<Scope>({proxies: []});
  const [proxies, setProxies] = useState<ConfigProxy[]>([]);

  scope.proxies = proxies;

  useEffect(() => {
    let isMounted = true;
    getConfig().then(
      ({proxies}) => {
        if (!isMounted) return;
        setProxies(proxies as ConfigProxy[]);
      },
      (err) => {
        console.error('getConfig error: %O', err);
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProxyDelete = useCallback(
    async (id) => {
      const {proxies} = scope;
      const proxy = proxies.find((p) => p.id === id);
      if (!proxy) return;
      const pos = proxies.indexOf(proxy);
      if (pos === -1) return;
      proxies.splice(pos, 1);
      const _ = ConfigStruct.assert({proxies});
      await chrome.storage.sync.set({proxies});
      setProxies(proxies.slice(0));
    },
    [scope],
  );

  const handleMove = useCallback(
    async (id, offset) => {
      const {proxies} = scope;
      const proxy = proxies.find((p) => p.id === id);
      if (!proxy) return;
      const pos = proxies.indexOf(proxy);
      if (pos === -1) return;
      proxies.splice(pos, 1);

      proxies.splice(pos + offset, 0, proxy);
      const _ = ConfigStruct.assert({proxies});
      await chrome.storage.sync.set({proxies});
      setProxies(proxies.slice(0));
    },
    [scope],
  );

  const handleEnabledChange = useCallback(
    async (isEnabled, id) => {
      const {proxies} = scope;
      const proxy = proxies.find((p) => p.id === id);
      if (!proxy) return;
      proxy.enabled = isEnabled;
      const _ = ConfigStruct.assert({proxies});
      await chrome.storage.sync.set({proxies});
      setProxies(proxies.slice(0));
    },
    [scope],
  );

  return (
    <>
      <Header title="Options" />
      <Box component={Paper} m={2}>
        <Grid container>
          <Grid item width={STYLE.menu.width}>
            <Box m={2}>
              <Menu />
            </Box>
          </Grid>
          <Grid item xs>
            <Box m={2} minHeight={STYLE.mainBox.minHeight}>
              <ProxySelect />
              <Grid container direction="column">
                {proxies.map((proxy, index) => {
                  const isFirst = index === 0;
                  const isLast = index === proxies.length - 1;
                  return (
                    <Grid item key={proxy.id}>
                      <ProxyItem
                        proxy={proxy}
                        isFirst={isFirst}
                        isLast={isLast}
                        onDelete={handleProxyDelete}
                        onMove={handleMove}
                        onEnabledChange={handleEnabledChange}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

interface ProxyItemProps {
  proxy: ConfigProxy;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (id: string) => unknown;
  onMove: (id: string, pos: number) => unknown;
  onEnabledChange: (state: boolean, id: string) => unknown;
}

const ProxyItem: FC<ProxyItemProps> = ({
  proxy,
  isFirst,
  isLast,
  onDelete,
  onMove,
  onEnabledChange,
}) => {
  const handleDelete = useCallback(
    (e) => {
      e.preventDefault();
      onDelete(proxy.id);
    },
    [proxy, onDelete],
  );

  const handleMoveUp = useCallback(
    (e) => {
      e.preventDefault();
      onMove(proxy.id, -1);
    },
    [proxy, onMove],
  );

  const handleMoveDown = useCallback(
    (e) => {
      e.preventDefault();
      onMove(proxy.id, 1);
    },
    [proxy, onMove],
  );

  const handleEnabledChange = useCallback(
    (e) => {
      onEnabledChange(e.target.checked, proxy.id);
    },
    [proxy, onEnabledChange],
  );

  return (
    <Grid container direction="row" spacing={1} justifyContent="space-between" alignItems="center">
      <Grid item width={STYLE.colorCell.width}>
        <ColorIcon color={proxy.color} />
      </Grid>
      <Grid item xs>
        {proxy.title}
      </Grid>
      <Grid item xs>
        {'host' in proxy ? proxy.host : ''}
      </Grid>
      <Grid item width={STYLE.enabledCell.width}>
        <Grid container alignItems="center" justifyContent="space-around">
          <Grid item>
            <Checkbox
              color="primary"
              defaultChecked={proxy.enabled}
              onChange={handleEnabledChange}
            />
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to={`/proxy?${qs.stringify({
                id: proxy.id,
              })}`}
              variant="outlined"
              size="small"
              color="primary"
            >
              Edit
            </Button>
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to={`/patterns?${qs.stringify({
                id: proxy.id,
              })}`}
              variant="outlined"
              size="small"
              color="primary"
            >
              Patterns
            </Button>
          </Grid>
          <Grid item>
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveDown} disabled={isLast} size="small">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Options;
