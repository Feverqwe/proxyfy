import React, {FC, useCallback, useEffect, useState} from 'react';
import {Box, Button, Checkbox, Grid, Paper} from '@mui/material';
import {Link} from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Header from '../../../Header';
import getConfig from '../../../../tools/getConfig';
import ConfigStruct, {ConfigProxy} from '../../../../tools/ConfigStruct';
import Menu from '../Menu/Menu';
import ProxySelect from '../../ProxySelect';
import ColorIcon from '../../ColorIcon';

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

const ProxyList: FC = () => {
  const [proxies, setProxies] = useState<ConfigProxy[]>([]);

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

  const saveProxies = useCallback(async (newProxies: ConfigProxy[]) => {
    const _ = ConfigStruct.assert({proxies: newProxies});
    await chrome.storage.sync.set({proxies: newProxies});
    setProxies(newProxies);
  }, []);

  const handleProxyDelete = useCallback(
    async (proxy: ConfigProxy) => {
      const newProxies = proxies.slice(0);
      const pos = newProxies.indexOf(proxy);
      if (pos === -1) return;
      newProxies.splice(pos, 1);

      await saveProxies(newProxies);
    },
    [proxies, saveProxies],
  );

  const handleMove = useCallback(
    async (proxy: ConfigProxy, offset: number) => {
      const newProxies = proxies.slice(0);
      const pos = newProxies.indexOf(proxy);
      if (pos === -1) return;
      newProxies.splice(pos, 1);
      newProxies.splice(pos + offset, 0, proxy);

      await saveProxies(newProxies);
    },
    [proxies, saveProxies],
  );

  const handleEnabledChange = useCallback(
    async (isEnabled: boolean, proxy: ConfigProxy) => {
      const newProxies = proxies.slice(0);
      const pos = newProxies.indexOf(proxy);
      if (pos === -1) return;
      newProxies.splice(pos, 1, {
        ...proxy,
        enabled: isEnabled,
      });

      await saveProxies(newProxies);
    },
    [proxies, saveProxies],
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
  onDelete: (proxy: ConfigProxy) => unknown;
  onMove: (proxy: ConfigProxy, pos: number) => unknown;
  onEnabledChange: (state: boolean, proxy: ConfigProxy) => unknown;
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
      onDelete(proxy);
    },
    [proxy, onDelete],
  );

  const handleMoveUp = useCallback(
    (e) => {
      e.preventDefault();
      onMove(proxy, -1);
    },
    [proxy, onMove],
  );

  const handleMoveDown = useCallback(
    (e) => {
      e.preventDefault();
      onMove(proxy, 1);
    },
    [proxy, onMove],
  );

  const handleEnabledChange = useCallback(
    (e) => {
      onEnabledChange(e.target.checked, proxy);
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
              to={`/proxy?${new URLSearchParams({
                id: proxy.id,
              }).toString()}`}
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
              to={`/patterns?${new URLSearchParams({
                id: proxy.id,
              }).toString()}`}
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

export default ProxyList;
