import React, {FC, useCallback, useEffect, useState} from 'react';
import {Box, Button, Checkbox, Grid, Paper} from '@mui/material';
import {Link} from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {ColorIcon, CopyIcon, Header, ProxySelect} from '../../../index';
import {ConfigProxy, ConfigStruct, getConfig, getId} from '../../../../tools/index';
import {StorageFactory} from '../../../../storage/index';
import Menu from '../Menu/Menu';

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
    width: '350px',
  },
};

const ProxyList: FC = () => {
  const [proxies, setProxies] = useState<ConfigProxy[]>([]);

  const fetchProxies = useCallback(async () => {
    try {
      const {proxies} = await getConfig();

      setProxies(proxies);
    } catch (err) {
      console.error('getConfig error: %O', err);
    }
  }, []);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const saveProxies = useCallback(
    async (newProxies: ConfigProxy[]) => {
      const _ = ConfigStruct.assert({proxies: newProxies});
      const storageFactory = StorageFactory.getInstance();
      await storageFactory.initialize();
      const storageService = storageFactory.getStorageService();
      await storageService.set({proxies: newProxies});
      await fetchProxies();
    },
    [fetchProxies],
  );

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

  const handleClone = useCallback(
    async (proxy: ConfigProxy) => {
      const newProxies = proxies.slice(0);
      const clone = JSON.parse(JSON.stringify(proxy));
      clone.id = getId();
      clone.title = `Copy of ${proxy.title}`;
      newProxies.push(clone);

      await saveProxies(newProxies);
    },
    [proxies, saveProxies],
  );

  return (
    <>
      <Header title="Options" />
      <Box component={Paper} m={2}>
        <Grid container>
          <Grid>
            <Box m={2}>
              <Menu />
            </Box>
          </Grid>
          <Grid flexGrow={1}>
            <Box m={2} minHeight={STYLE.mainBox.minHeight}>
              <ProxySelect />
              <Grid container direction="column">
                {proxies.map((proxy, index) => {
                  const isFirst = index === 0;
                  const isLast = index === proxies.length - 1;
                  return (
                    <Grid key={proxy.id}>
                      <ProxyItem
                        proxy={proxy}
                        isFirst={isFirst}
                        isLast={isLast}
                        onDelete={handleProxyDelete}
                        onMove={handleMove}
                        onEnabledChange={handleEnabledChange}
                        onClone={handleClone}
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
  onClone: (proxy: ConfigProxy) => unknown;
}

const ProxyItem: FC<ProxyItemProps> = ({
  proxy,
  isFirst,
  isLast,
  onDelete,
  onMove,
  onEnabledChange,
  onClone,
}) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onDelete(proxy);
    },
    [proxy, onDelete],
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(proxy, -1);
    },
    [proxy, onMove],
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(proxy, 1);
    },
    [proxy, onMove],
  );

  const handleEnabledChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onEnabledChange(e.target.checked, proxy);
    },
    [proxy, onEnabledChange],
  );

  const handleClone = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClone(proxy);
    },
    [proxy, onClone],
  );

  return (
    <Grid container spacing={1} direction="row" justifyContent="space-between" alignItems="center">
      <Grid>
        <ColorIcon color={proxy.color} />
      </Grid>
      <Grid flexGrow={1}>{proxy.title}</Grid>
      <Grid flexGrow={1}>{'host' in proxy ? proxy.host : ''}</Grid>
      <Grid>
        <Grid container spacing={1} alignItems="center" justifyContent="space-around">
          <Grid>
            <Checkbox
              color="primary"
              defaultChecked={proxy.enabled}
              onChange={handleEnabledChange}
            />
          </Grid>
          <Grid>
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
          <Grid>
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
          <Grid>
            <IconButton onClick={handleClone} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
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
